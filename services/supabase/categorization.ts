import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Obtiene el historial de categorizaciones previas para aprendizaje contextual
 */
export async function getHistoricalCategorizations(
  organizationId: string,
  merchantName?: string,
  category?: string,
  limit = 50
) {
  let query = supabaseAdmin
    .from('transactions')
    .select(`
      id,
      amount,
      currency,
      merchant,
      category,
      description,
      created_at,
      confidence_score
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (merchantName) {
    query = query.ilike('merchant', `%${merchantName}%`);
  }

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching historical categorizations:', error);
    return [];
  }

  return data || [];
}

/**
 * Obtiene las categorías personalizadas de una organización
 */
export async function getOrganizationCategories(organizationId: string) {
  const { data, error } = await supabaseAdmin
    .from('transaction_categories')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching organization categories:', error);
    return [];
  }

  return data || [];
}

/**
 * Guarda el feedback del usuario para aprendizaje
 */
export async function saveCategorizationFeedback(params: {
  transactionId: string;
  originalCategory: string;
  newCategory: string;
  userId: string;
  organizationId: string;
}) {
  const { transactionId, originalCategory, newCategory, userId, organizationId } = params;

  const { error } = await supabaseAdmin
    .from('categorization_feedback')
    .insert({
      transaction_id: transactionId,
      original_category: originalCategory,
      new_category: newCategory,
      user_id: userId,
      organization_id: organizationId,
    });

  if (error) {
    console.error('Error saving feedback:', error);
    throw error;
  }
}

/**
 * Actualiza la transacción con la nueva categoría
 */
export async function updateTransactionCategory(
  transactionId: string,
  category: string,
  confidenceScore: number,
  metadata?: Record<string, unknown>
) {
  const updateData: Record<string, unknown> = {
    category,
    confidence_score: confidenceScore,
    updated_at: new Date().toISOString(),
  };

  if (metadata) {
    updateData.metadata = { ...metadata, manually_categorized: true };
  }

  const { error } = await supabaseAdmin
    .from('transactions')
    .update(updateData)
    .eq('id', transactionId);

  if (error) {
    console.error('Error updating transaction category:', error);
    throw error;
  }
}

/**
 * Registra un evento de aprendizaje para IA
 */
export async function logAILearningEvent(params: {
  organizationId: string;
  eventType: 'categorization' | 'feedback' | 'correction';
  payload: Record<string, unknown>;
}) {
  const { organizationId, eventType, payload } = params;

  const { error } = await supabaseAdmin
    .from('ai_events')
    .insert({
      organization_id: organizationId,
      type: eventType,
      payload,
    });

  if (error) {
    console.error('Error logging AI event:', error);
    throw error;
  }
}
