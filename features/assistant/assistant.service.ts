import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { OpenAIService } from '@/services/openai';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'insight' | 'alert' | 'summary';
  data?: any;
  timestamp: string;
};

type Insight = {
  type: 'spending_alert' | 'cash_flow' | 'tax_reminder' | 'category_suggestion';
  title: string;
  message: string;
  icon: any;
  action?: string;
};

export class AssistantService {
  private supabase: SupabaseClient<Database>;
  private openai: OpenAIService;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
    this.openai = new OpenAIService();
  }

  /**
   * Obtener historial de chat de la organización
   */
  async getChatHistory(limit: number = 50): Promise<Message[]> {
    const org = await this.getCurrentOrganizationId();
    if (!org) return [];

    const { data, error } = await this.supabase
      .from('ai_events')
      .select('*')
      .eq('organization_id', org)
      .eq('type', 'chat_message')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(msg => ({
      id: msg.id,
      role: msg.payload.role as 'user' | 'assistant',
      content: msg.payload.content,
      type: msg.payload.type || 'text',
      data: msg.payload.data,
      timestamp: msg.created_at,
    }));
  }

  /**
   * Guardar un mensaje en el historial
   */
  async saveMessage(message: Message): Promise<void> {
    const org = await this.getCurrentOrganizationId();
    if (!org) throw new Error('No organization found');

    const { error } = await this.supabase
      .from('ai_events')
      .insert([{
        organization_id: org,
        type: 'chat_message',
        payload: {
          role: message.role,
          content: message.content,
          type: message.type,
          data: message.data,
        },
      }]);

    if (error) throw error;
  }

  /**
   * Enviar mensaje a la IA y obtener respuesta
   */
  async sendMessage(content: string): Promise<{
    content: string;
    type: 'text' | 'insight' | 'alert' | 'summary';
    data?: any;
    newInsights?: boolean;
  }> {
    const org = await this.getCurrentOrganizationId();
    if (!org) throw new Error('No organization found');

    // Obtener contexto financiero relevante
    const context = await this.getFinancialContext(org);

    // Construir prompt con contexto
    const prompt = this.buildPrompt(content, context);

    // Llamar a OpenAI
    const response = await this.openai.chat(prompt, {
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Analizar respuesta para determinar tipo
    let responseType: 'text' | 'insight' | 'alert' | 'summary' = 'text';
    let responseData: any = undefined;

    // Detección simple del tipo de respuesta
    if (response.includes('resumen') || response.includes('total') || response.includes('suma')) {
      responseType = 'summary';
      responseData = this.extractMetrics(response);
    } else if (response.includes('alerta') || response.includes('importante') || response.includes('atención')) {
      responseType = 'alert';
    } else if (response.includes('insight') || response.includes('recomendación') || response.includes('sugerencia')) {
      responseType = 'insight';
    }

    // Detectar si hay nuevos insights proactivos
    const newInsights = await this.detectNewInsights(org, content, response);

    return {
      content: response,
      type: responseType,
      data: responseData,
      newInsights,
    };
  }

  /**
   * Obtener insights proactivos basados en el estado financiero
   */
  async getProactiveInsights(): Promise<Insight[]> {
    const org = await this.getCurrentOrganizationId();
    if (!org) return [];

    const insights: Insight[] = [];

    // Obtener datos financieros recientes
    const { data: transactions } = await this.supabase
      .from('transactions')
      .select('amount, category, merchant, timestamp')
      .eq('organization_id', org)
      .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false });

    // Obtener proyección fiscal
    const { data: taxProjection } = await this.supabase
      .from('tax_projections')
      .select('vat_estimate, quarterly_estimate')
      .eq('organization_id', org)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Análisis de gastos elevados
    if (transactions && transactions.length > 0) {
      const totalSpent = transactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      if (totalSpent > 5000) {
        insights.push({
          type: 'spending_alert',
          title: 'Gastos Elevados este Mes',
          message: `Has gastado ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalSpent)} en los últimos 30 días. Considera revisar tus gastos discrecionales.`,
          icon: () => null, // Se reemplaza en el frontend
          action: 'Analiza mis gastos por categoría',
        });
      }
    }

    // Recordatorio fiscal
    if (taxProjection && taxProjection.vat_estimate > 1000) {
      insights.push({
        type: 'tax_reminder',
        title: 'IVA a Pagar Significativo',
        message: `Tu IVA estimado a pagar es de ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(taxProjection.vat_estimate)}. Asegúrate de tener fondos disponibles.`,
        icon: () => null,
        action: '¿Cuánto IVA tengo que pagar?',
      });
    }

    // Sugerencias de categorización
    const { count: uncategorized } = await this.supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org)
      .is('category', null);

    if (uncategorized && uncategorized > 5) {
      insights.push({
        type: 'category_suggestion',
        title: 'Transacciones sin Categorizar',
        message: `Tienes ${uncategorized} transacciones sin categorizar. Categorizarlas mejorará tus informes fiscales.`,
        icon: () => null,
        action: '¿Hay alguna factura sin categorizar?',
      });
    }

    return insights.slice(0, 3); // Máximo 3 insights
  }

  /**
   * Obtener ID de la organización actual
   */
  private async getCurrentOrganizationId(): Promise<string | null> {
    const user = await this.supabase.auth.getUser();
    if (!user.data.user) return null;

    const { data } = await this.supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.data.user.id)
      .limit(1)
      .single();

    return data?.organization_id || null;
  }

  /**
   * Obtener contexto financiero para la IA
   */
  private async getFinancialContext(orgId: string): Promise<{
    recentTransactions: any[];
    taxProjection: any;
    uncategorizedCount: number;
  }> {
    const [transactions, taxProjection, uncategorized] = await Promise.all([
      this.supabase
        .from('transactions')
        .select('amount, currency, merchant, category, timestamp')
        .eq('organization_id', orgId)
        .order('timestamp', { ascending: false })
        .limit(20),
      this.supabase
        .from('tax_projections')
        .select('vat_estimate, quarterly_estimate, annual_projection')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
      this.supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .is('category', null),
    ]);

    return {
      recentTransactions: transactions.data || [],
      taxProjection: taxProjection.data || null,
      uncategorizedCount: uncategorized.count || 0,
    };
  }

  /**
   * Construir prompt para la IA con contexto
   */
  private buildPrompt(userMessage: string, context: any): string {
    return `Eres un asistente financiero inteligente para una empresa española. Tu objetivo es ayudar al usuario a entender sus finanzas, impuestos y transacciones.

CONTEXTO FINANCIERO ACTUAL:
- Transacciones recientes: ${JSON.stringify(context.recentTransactions.slice(0, 5))}
- Proyección fiscal: ${context.taxProjection ? `IVA estimado: ${context.taxProjection.vat_estimate}€` : 'No disponible'}
- Transacciones sin categorizar: ${context.uncategorizedCount}

INSTRUCCIONES:
- Responde de forma clara y concisa en español
- Usa datos reales del contexto cuando sea relevante
- Si no tienes información suficiente, dilo claramente
- Proporciona insights accionables cuando sea posible
- Para cantidades monetarias, usa el formato EUR

PREGUNTA DEL USUARIO:
${userMessage}

RESPUESTA:`;
  }

  /**
   * Extraer métricas de la respuesta de la IA
   */
  private extractMetrics(response: string): any {
    // Implementación simplificada - en producción usaría parsing más sofisticado
    const metrics: any = {};
    
    // Buscar patrones de cantidad
    const amountMatches = response.match(/(\d+[\.,]?\d*)\s?€/g);
    if (amountMatches) {
      metrics.total_amount = parseFloat(amountMatches[0].replace(/[€\s]/g, '').replace(',', '.'));
    }

    return Object.keys(metrics).length > 0 ? metrics : null;
  }

  /**
   * Detectar si hay nuevos insights después de una conversación
   */
  private async detectNewInsights(orgId: string, userMessage: string, aiResponse: string): Promise<boolean> {
    // Lógica simple: si el usuario preguntó sobre algo específico y la IA encontró algo relevante
    const triggerWords = ['gasto', 'impuesto', 'iva', 'categoría', 'factura'];
    const hasTrigger = triggerWords.some(word => 
      userMessage.toLowerCase().includes(word) || aiResponse.toLowerCase().includes(word)
    );

    return hasTrigger;
  }
}
