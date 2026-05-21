import { createServerClient } from '@/services/supabase/client';

export interface TransactionsServiceOptions {
  page?: number;
  limit?: number;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  bankAccountId?: string;
}

/**
 * Transactions Service
 * Handles transaction queries, categorization, and management
 */
export class TransactionsService {
  /**
   * Get transactions for an organization with filters
   */
  static async getTransactions(
    organizationId: string,
    options: TransactionsServiceOptions = {}
  ) {
    const supabase = createServerClient();
    const { 
      page = 1, 
      limit = 50, 
      category, 
      dateFrom, 
      dateTo, 
      search,
      bankAccountId
    } = options;

    let query = supabase
      .from('transactions')
      .select(`
        *,
        bank_accounts (
          id,
          provider,
          iban,
          account_name
        )
      `, { count: 'exact' })
      .in('bank_accounts.organization_id', [organizationId]);

    if (bankAccountId) {
      query = query.eq('bank_account_id', bankAccountId);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (dateFrom) {
      query = query.gte('timestamp', dateFrom);
    }

    if (dateTo) {
      query = query.lte('timestamp', dateTo);
    }

    if (search) {
      query = query.or(`merchant.ilike.%${search}%,description.ilike.%${search}%`);
    }

    query = query.order('timestamp', { ascending: false });

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Get a single transaction by ID
   */
  static async getTransaction(transactionId: string, organizationId: string) {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        bank_accounts (
          id,
          organization_id
        )
      `)
      .eq('id', transactionId)
      .single();

    if (error) throw error;

    // Verify transaction belongs to organization
    if (data.bank_accounts.organization_id !== organizationId) {
      throw new Error('Transaction not found');
    }

    return data;
  }

  /**
   * Update transaction category
   */
  static async updateCategory(
    transactionId: string,
    category: string,
    subcategory?: string
  ) {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('transactions')
      .update({
        category,
        subcategory: subcategory || null,
        confidence_score: 1.0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transactionId)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Bulk update transaction categories
   */
  static async bulkUpdateCategories(
    updates: Array<{ id: string; category: string; subcategory?: string }>
  ) {
    const supabase = createServerClient();

    for (const update of updates) {
      await supabase
        .from('transactions')
        .update({
          category: update.category,
          subcategory: update.subcategory || null,
          confidence_score: 1.0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', update.id);
    }

    return true;
  }

  /**
   * Get transaction statistics
   */
  static async getStatistics(
    organizationId: string,
    dateFrom: string,
    dateTo: string
  ) {
    const supabase = createServerClient();

    // Get income
    const { data: incomeData } = await supabase
      .from('transactions')
      .select('amount, category')
      .in('bank_accounts.organization_id', [organizationId])
      .gt('amount', 0)
      .gte('timestamp', dateFrom)
      .lte('timestamp', dateTo);

    // Get expenses
    const { data: expenseData } = await supabase
      .from('transactions')
      .select('amount, category')
      .in('bank_accounts.organization_id', [organizationId])
      .lt('amount', 0)
      .gte('timestamp', dateFrom)
      .lte('timestamp', dateTo);

    const totalIncome = incomeData?.reduce((sum, tx) => sum + tx.amount, 0) || 0;
    const totalExpenses = expenseData?.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) || 0;

    // Group by category
    const incomeByCategory: Record<string, number> = {};
    const expensesByCategory: Record<string, number> = {};

    incomeData?.forEach(tx => {
      const cat = tx.category || 'uncategorized';
      incomeByCategory[cat] = (incomeByCategory[cat] || 0) + tx.amount;
    });

    expenseData?.forEach(tx => {
      const cat = tx.category || 'uncategorized';
      expensesByCategory[cat] = (expensesByCategory[cat] || 0) + Math.abs(tx.amount);
    });

    return {
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      incomeByCategory,
      expensesByCategory,
      transactionCount: (incomeData?.length || 0) + (expenseData?.length || 0),
    };
  }

  /**
   * Get uncategorized transactions
   */
  static async getUncategorized(organizationId: string, limit = 20) {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .in('bank_accounts.organization_id', [organizationId])
      .is('category', null)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data;
  }

  /**
   * Reconcile a transaction
   */
  static async reconcileTransaction(transactionId: string) {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('transactions')
      .update({
        is_reconciled: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transactionId)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Delete a transaction
   */
  static async deleteTransaction(transactionId: string) {
    const supabase = createServerClient();

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId);

    if (error) throw error;

    return true;
  }

  /**
   * Get spending trends by month
   */
  static async getSpendingTrends(organizationId: string, months = 6) {
    const supabase = createServerClient();

    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const { data, error } = await supabase
      .from('transactions')
      .select('amount, timestamp, category')
      .in('bank_accounts.organization_id', [organizationId])
      .lt('amount', 0)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    if (error) throw error;

    // Group by month
    const trends: Record<string, number> = {};
    
    data?.forEach(tx => {
      const month = new Date(tx.timestamp).toISOString().slice(0, 7); // YYYY-MM
      trends[month] = (trends[month] || 0) + Math.abs(tx.amount);
    });

    return trends;
  }
}
