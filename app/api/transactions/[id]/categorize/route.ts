import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { categorizeTransactionWithAI, recategorizeWithFeedback } from '@/features/ai/transaction-categorization.service';
import { CategorizeTransactionRequestSchema, SubmitFeedbackRequestSchema } from '@/types/categorization';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/transactions/[id]/categorize
 * Obtiene información de una transacción y la categoriza con IA
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Obtener sesión del usuario
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user } } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transactionId = params.id;

    // Obtener transacción
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select(`
        id,
        amount,
        currency,
        merchant,
        description,
        timestamp,
        bank_account_id,
        category,
        confidence_score,
        bank_accounts (
          organization_id
        )
      `)
      .eq('id', transactionId)
      .single();

    if (txError || !transaction) {
      return NextResponse.json(
        { error: 'Transacción no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos
    const orgId = transaction.bank_accounts?.organization_id;
    if (!orgId) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 400 }
      );
    }

    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Obtener parámetros de query
    const searchParams = request.nextUrl.searchParams;
    const includeAlternatives = searchParams.get('includeAlternatives') === 'true';
    const useHistoricalContext = searchParams.get('useHistoricalContext') !== 'false';

    // Categorizar con IA
    const result = await categorizeTransactionWithAI({
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
        description: transaction.description || '',
        merchantName: transaction.merchant || '',
        timestamp: transaction.timestamp,
        bankAccountId: transaction.bank_account_id,
      },
      organizationId: orgId,
      userId: user.id,
      includeAlternatives,
      useHistoricalContext,
    });

    return NextResponse.json({
      success: true,
      data: {
        transactionId: transaction.id,
        currentCategory: transaction.category,
        aiResult: result,
      },
    });
  } catch (error) {
    console.error('Error categorizing transaction:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/transactions/[id]/categorize
 * Aplica la categorización sugerida por IA a una transacción
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user } } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transactionId = params.id;
    const body = await request.json();
    const validated = CategorizeTransactionRequestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    // Obtener transacción y organización
    const { data: transaction } = await supabase
      .from('transactions')
      .select(`
        id,
        amount,
        currency,
        merchant,
        description,
        timestamp,
        bank_account_id,
        category,
        bank_accounts (organization_id)
      `)
      .eq('id', transactionId)
      .single();

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transacción no encontrada' },
        { status: 404 }
      );
    }

    const orgId = transaction.bank_accounts?.organization_id;
    if (!orgId) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 400 }
      );
    }

    // Verificar permisos
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin', 'member'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Ejecutar categorización
    const result = await categorizeTransactionWithAI({
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
        description: transaction.description || '',
        merchantName: transaction.merchant || '',
        timestamp: transaction.timestamp,
        bankAccountId: transaction.bank_account_id,
      },
      organizationId: orgId,
      userId: user.id,
      includeAlternatives: validated.data.includeAlternatives,
      useHistoricalContext: validated.data.useHistoricalContext,
    });

    // Actualizar transacción si la confianza es alta o el usuario acepta
    if (result.confidence >= 0.85 || !result.needsReview) {
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          category: result.categoryId,
          confidence_score: result.confidence,
          metadata: {
            ...(transaction.metadata || {}),
            ai_categorized: true,
            categorized_at: new Date().toISOString(),
            reasoning: result.reasoning,
          },
        })
        .eq('id', transactionId);

      if (updateError) {
        console.error('Error updating transaction:', updateError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        transactionId: transaction.id,
        category: result.categoryId,
        confidence: result.confidence,
        needsReview: result.needsReview,
        taxTreatment: result.taxTreatment,
        vatAmount: result.vatAmount,
        reasoning: result.reasoning,
      },
    });
  } catch (error) {
    console.error('Error applying categorization:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno' 
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/transactions/[id]/feedback
 * Envía feedback del usuario sobre una categorización
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user } } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transactionId = params.id;
    const body = await request.json();
    const validated = SubmitFeedbackRequestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    // Obtener transacción actual
    const { data: transaction } = await supabase
      .from('transactions')
      .select(`
        id,
        category,
        bank_accounts (organization_id)
      `)
      .eq('id', transactionId)
      .single();

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transacción no encontrada' },
        { status: 404 }
      );
    }

    const orgId = transaction.bank_accounts?.organization_id;
    if (!orgId) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 400 }
      );
    }

    // Aplicar nueva categoría y guardar feedback
    await Promise.all([
      // Actualizar transacción
      supabase
        .from('transactions')
        .update({
          category: validated.data.newCategory,
          confidence_score: 1.0, // Máxima confianza al ser manual
          metadata: {
            ...(transaction.metadata || {}),
            manually_categorized: true,
            categorized_by: user.id,
            categorized_at: new Date().toISOString(),
          },
        })
        .eq('id', transactionId),

      // Guardar feedback para aprendizaje
      recategorizeWithFeedback({
        transactionId,
        originalCategory: transaction.category || 'uncategorized',
        newCategory: validated.data.newCategory,
        userId: user.id,
        organizationId: orgId,
        reason: validated.data.reason,
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Feedback guardado correctamente',
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno' 
      },
      { status: 500 }
    );
  }
}
