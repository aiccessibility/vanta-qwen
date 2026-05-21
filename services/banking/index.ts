import { createServerClient } from '@/services/supabase/client';

export interface SyncBankAccountsParams {
  organizationId: string;
  provider: 'plaid' | 'gocardless' | 'manual';
}

export interface TransactionData {
  id: string;
  amount: number;
  currency: string;
  merchant: string;
  description?: string;
  timestamp: string;
  category?: string;
  reference?: string;
}

/**
 * Banking Service
 * Handles bank account connections and transaction synchronization
 */
export class BankingService {
  /**
   * Get all bank accounts for an organization
   */
  static async getBankAccounts(organizationId: string) {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (error) throw error;

    return data;
  }

  /**
   * Link a new bank account
   */
  static async linkBankAccount(
    organizationId: string,
    provider: string,
    iban: string,
    accountName: string,
    currency: string = 'EUR'
  ) {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('bank_accounts')
      .insert({
        organization_id: organizationId,
        provider,
        iban,
        account_name: accountName,
        currency,
        balance: 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Synchronize transactions from a bank provider
   */
  static async syncTransactions(bankAccountId: string, transactions: TransactionData[]) {
    const supabase = createServerClient();

    if (transactions.length === 0) {
      return [];
    }

    // Prepare transactions for upsert
    const transactionsToInsert = transactions.map((tx) => ({
      bank_account_id: bankAccountId,
      amount: tx.amount,
      currency: tx.currency,
      merchant: tx.merchant,
      description: tx.description || null,
      timestamp: tx.timestamp,
      category: tx.category || null,
      confidence_score: tx.category ? 0.9 : 0.5,
      transaction_type: tx.amount > 0 ? 'income' : 'expense' as const,
      metadata: { external_id: tx.id },
    }));

    // Upsert transactions (avoid duplicates based on external_id in metadata)
    const { data, error } = await supabase
      .from('transactions')
      .upsert(transactionsToInsert, {
        onConflict: 'bank_account_id,metadata->>external_id',
      })
      .select();

    if (error) throw error;

    // Update last synced timestamp
    await supabase
      .from('bank_accounts')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', bankAccountId);

    return data;
  }

  /**
   * Get transactions for a bank account with pagination
   */
  static async getTransactions(
    bankAccountId: string,
    options: {
      page?: number;
      limit?: number;
      dateFrom?: string;
      dateTo?: string;
      category?: string;
      search?: string;
    } = {}
  ) {
    const supabase = createServerClient();
    const { page = 1, limit = 50, dateFrom, dateTo, category, search } = options;

    let query = supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('bank_account_id', bankAccountId);

    if (dateFrom) {
      query = query.gte('timestamp', dateFrom);
    }

    if (dateTo) {
      query = query.lte('timestamp', dateTo);
    }

    if (category) {
      query = query.eq('category', category);
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
   * Categorize a transaction manually
   */
  static async categorizeTransaction(
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
   * Delete a bank account (soft delete by setting is_active to false)
   */
  static async deactivateBankAccount(bankAccountId: string) {
    const supabase = createServerClient();

    const { error } = await supabase
      .from('bank_accounts')
      .update({ is_active: false })
      .eq('id', bankAccountId);

    if (error) throw error;

    return true;
  }

  /**
   * Get Plaid link token for connecting accounts
   */
  static async getPlaidLinkToken(organizationId: string, userId: string) {
    // This would integrate with Plaid API
    // For now, return a placeholder
    return {
      link_token: 'placeholder_link_token',
      expires_at: new Date(Date.now() + 3600000).toISOString(),
    };
  }

  /**
   * Exchange Plaid public token for access token
   */
  static async exchangePlaidToken(publicToken: string, organizationId: string) {
    // This would integrate with Plaid API
    // For now, return a placeholder
    return {
      access_token: 'placeholder_access_token',
      item_id: 'placeholder_item_id',
    };
  }
}
