import OpenAI from 'openai';
import {
  AICategorizationResult,
  AICategorizationResultSchema,
  CategorizationRequest,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  MERCHANT_TYPES,
} from '@/lib/validators/transaction-categorization';
import {
  getHistoricalCategorizations,
  getOrganizationCategories,
  logAILearningEvent,
} from '@/services/supabase/categorization';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Prompt del sistema para la IA de categorización
 */
const SYSTEM_PROMPT = `Eres un experto contable y fiscal especializado en clasificación automática de transacciones financieras.

Tu tarea es analizar transacciones bancarias y clasificarlas correctamente según:
1. El tipo de comercio/proveedor
2. La descripción de la transacción
3. El monto y contexto
4. Las categorías fiscales estándar

Debes proporcionar:
- Categoría principal con alta confianza
- Tratamiento fiscal (deducible o no)
- Cálculo de IVA cuando aplique
- Razonamiento claro de tu decisión
- Identificación del tipo de comerciante

Si la confianza es menor al 70%, marca como "needsReview": true para revisión manual.`;

/**
 * Construye el prompt contextual con historial y patrones
 */
function buildContextualPrompt(
  request: CategorizationRequest,
  historicalData: Array<{
    merchant: string;
    category: string;
    amount: number;
    description?: string | null;
  }>,
  customCategories: Array<{ name: string; keywords: string[] }>
) {
  const { transaction } = request;

  let contextSection = '';

  if (historicalData.length > 0) {
    const recentMatches = historicalData.slice(0, 10);
    contextSection += `
HISTORIAL DE CATEGORIZACIONES PREVIAS (mismos proveedores o similares):
${recentMatches
  .map(
    (h) =>
      `- Proveedor: "${h.merchant}" | Monto: ${h.amount} | Categoría: ${h.category}${h.description ? ` | Desc: ${h.description}` : ''}`
  )
  .join('\n')}

Estas categorizaciones previas deben considerarse como patrón de referencia.`;
  }

  if (customCategories.length > 0) {
    contextSection += `

CATEGORÍAS PERSONALIZADAS DE LA ORGANIZACIÓN:
${customCategories
  .map((c) => `- ${c.name} (palabras clave: ${c.keywords.join(', ')})`)
  .join('\n')}

Prioriza estas categorías personalizadas cuando haya coincidencia con las palabras clave.`;
  }

  return `
TRANSACCIÓN A ANALIZAR:
- Proveedor: ${transaction.merchantName}
- Monto: ${transaction.amount} ${transaction.currency}
- Descripción: ${transaction.description}
- Fecha: ${transaction.timestamp}
- ID Transacción: ${transaction.id}
${contextSection}

Proporciona tu análisis en formato JSON válido siguiendo estrictamente el esquema especificado.`;
}

/**
 * Extrae información del proveedor usando IA
 */
async function extractMerchantInfo(merchantName: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Eres un especialista en identificación de tipos de comercio.
Analiza el nombre del proveedor y determina su tipo de negocio.

Tipos disponibles: ${MERCHANT_TYPES.join(', ')}

Responde SOLO con un JSON: {"type": "tipo_comercio", "category": "categoría_general", "confidence": 0.9}`,
      },
      {
        role: 'user',
        content: `Proveedor: ${merchantName}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 150,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return null;

  try {
    const parsed = JSON.parse(content);
    return {
      name: merchantName,
      type: parsed.type as (typeof MERCHANT_TYPES)[number] || 'unknown',
      category: parsed.category || 'general',
      riskScore: parsed.confidence ? 1 - parsed.confidence : 0.5,
    };
  } catch {
    return null;
  }
}

/**
 * Función principal de categorización con IA
 */
export async function categorizeTransactionWithAI(
  request: CategorizationRequest
): Promise<AICategorizationResult> {
  const { transaction, organizationId, userId, includeAlternatives, useHistoricalContext } = request;

  // Obtener contexto histórico si está habilitado
  let historicalData: Array<{
    merchant: string;
    category: string;
    amount: number;
    description?: string | null;
  }> = [];

  let customCategories: Array<{ name: string; keywords: string[] }> = [];

  if (useHistoricalContext) {
    const [historical, categories] = await Promise.all([
      getHistoricalCategorizations(organizationId, transaction.merchantName),
      getOrganizationCategories(organizationId),
    ]);

    historicalData = historical.map((h) => ({
      merchant: h.merchant || '',
      category: h.category || '',
      amount: h.amount,
      description: h.description,
    }));

    customCategories = categories.map((c) => ({
      name: c.name,
      keywords: c.keywords || [],
    }));
  }

  // Extraer información del proveedor
  const merchantInfo = await extractMerchantInfo(transaction.merchantName);

  // Construir prompt contextual
  const userPrompt = buildContextualPrompt(request, historicalData, customCategories);

  // Determinar si es ingreso o gasto basado en el monto (positivo/negativo)
  const transactionType = transaction.amount >= 0 ? 'income' : 'expense';
  const relevantCategories = transactionType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // Llamar a OpenAI para categorización
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 800,
    response_format: { type: 'json_object' },
    tools: [
      {
        type: 'function',
        function: {
          name: 'categorize_transaction',
          description: 'Clasifica una transacción financiera en categorías contables y fiscales',
          parameters: {
            type: 'object',
            properties: {
              categoryId: { type: 'string', description: 'ID de la categoría asignada' },
              categoryName: { type: 'string', description: 'Nombre de la categoría' },
              subcategory: { type: 'string', description: 'Subcategoría específica' },
              confidence: {
                type: 'number',
                minimum: 0,
                maximum: 1,
                description: 'Nivel de confianza (0-1)',
              },
              taxTreatment: {
                type: 'string',
                enum: ['deductible', 'non_deductible', 'partial_deductible'],
                description: 'Tratamiento fiscal',
              },
              vatAmount: { type: 'number', description: 'Monto de IVA (si aplica)' },
              vatRate: { type: 'number', description: 'Tasa de IVA aplicada' },
              reasoning: { type: 'string', description: 'Explicación del razonamiento' },
              needsReview: {
                type: 'boolean',
                description: 'Si requiere revisión manual (confianza < 0.7)',
              },
              alternativeCategories: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    categoryId: { type: 'string' },
                    confidence: { type: 'number' },
                  },
                },
                description: 'Categorías alternativas (solo si includeAlternatives=true)',
              },
            },
            required: [
              'categoryId',
              'categoryName',
              'subcategory',
              'confidence',
              'taxTreatment',
              'reasoning',
              'needsReview',
            ],
          },
        },
      },
    ],
    tool_choice: { type: 'function', function: { name: 'categorize_transaction' } },
  });

  const toolCall = response.choices[0]?.message?.tool_calls?.[0];
  if (!toolCall || toolCall.function?.name !== 'categorize_transaction') {
    throw new Error('La IA no devolvo una categorización válida');
  }

  const resultData = JSON.parse(toolCall.function.arguments);

  // Construir resultado final
  const categorizationResult: AICategorizationResult = {
    categoryId: resultData.categoryId,
    categoryName: resultData.categoryName,
    subcategory: resultData.subcategory,
    confidence: resultData.confidence,
    merchantInfo: merchantInfo || undefined,
    taxTreatment: resultData.taxTreatment,
    vatAmount: resultData.vatAmount,
    vatRate: resultData.vatRate,
    reasoning: resultData.reasoning,
    alternativeCategories: includeAlternatives ? resultData.alternativeCategories : undefined,
    needsReview: resultData.needsReview || resultData.confidence < 0.7,
    learningData: {
      contextUsed: [
        useHistoricalContext ? 'historical_patterns' : '',
        customCategories.length > 0 ? 'custom_categories' : '',
        merchantInfo ? 'merchant_analysis' : '',
      ].filter(Boolean),
      historicalMatches: historicalData.length,
    },
  };

  // Validar el resultado con Zod
  const validated = AICategorizationResultSchema.safeParse(categorizationResult);
  if (!validated.success) {
    console.error('Validación fallida:', validated.error);
    throw new Error('El resultado de la IA no cumple con el esquema esperado');
  }

  // Registrar evento de aprendizaje
  await logAILearningEvent({
    organizationId,
    eventType: 'categorization',
    payload: {
      transactionId: transaction.id,
      result: categorizationResult,
      contextSize: historicalData.length,
    },
  });

  return categorizationResult;
}

/**
 * Categorización en lote para procesamiento por lotes
 */
export async function categorizeTransactionsBatch(
  requests: CategorizationRequest[],
  concurrencyLimit = 5
) {
  const results: Array<{ requestId: string; result: AICategorizationResult | null; error?: string }> =
    [];

  // Procesar con concurrencia limitada
  for (let i = 0; i < requests.length; i += concurrencyLimit) {
    const batch = requests.slice(i, i + concurrencyLimit);
    const batchResults = await Promise.allSettled(
      batch.map((req) => categorizeTransactionWithAI(req))
    );

    batchResults.forEach((result, index) => {
      const requestId = batch[index].transaction.id;
      if (result.status === 'fulfilled') {
        results.push({ requestId, result: result.value });
      } else {
        results.push({ requestId, result: null, error: result.reason.message });
      }
    });

    // Pequeña pausa entre lotes para evitar rate limiting
    if (i + concurrencyLimit < requests.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return results;
}

/**
 * Re-categorizar transacción con feedback del usuario
 */
export async function recategorizeWithFeedback(params: {
  transactionId: string;
  originalCategory: string;
  newCategory: string;
  userId: string;
  organizationId: string;
  reason?: string;
}) {
  const { transactionId, originalCategory, newCategory, userId, organizationId, reason } = params;

  // Guardar feedback para aprendizaje
  const { saveCategorizationFeedback } = await import('@/services/supabase/categorization');
  await saveCategorizationFeedback({
    transactionId,
    originalCategory,
    newCategory,
    userId,
    organizationId,
  });

  // Registrar evento de corrección
  await logAILearningEvent({
    organizationId,
    eventType: 'correction',
    payload: {
      transactionId,
      originalCategory,
      newCategory,
      reason: reason || 'manual_correction',
      userId,
    },
  });

  return { success: true };
}
