import { createServerClient } from '@/services/supabase/client';

export interface TaxCalculation {
  vatEstimate: number;
  quarterlyEstimate: number;
  annualEstimate: number;
  taxableIncome: number;
  deductibleExpenses: number;
  breakdown: {
    incomeByCategory: Record<string, number>;
    expensesByCategory: Record<string, number>;
    vatCollected: number;
    vatPaid: number;
  };
}

export interface TaxSettings {
  country: string;
  vatRate: number;
  reducedVatRate: number;
  corporateTaxRate: number;
  fiscalYearStartMonth: number;
}

/**
 * Taxes Service
 * Handles tax calculations, projections, and filings
 */
export class TaxesService {
  /**
   * Calculate tax projections for an organization
   */
  static async calculateTaxProjections(
    organizationId: string,
    year: number,
    quarter?: number
  ): Promise<TaxCalculation> {
    const supabase = createServerClient();

    // Get date range based on year and quarter
    const { startDate, endDate } = this.getDateRange(year, quarter);

    // Get all transactions for the period
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        *,
        bank_accounts!inner (
          organization_id
        )
      `)
      .eq('bank_accounts.organization_id', organizationId)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    if (error) throw error;

    // Calculate totals
    let totalIncome = 0;
    let totalExpenses = 0;
    let vatCollected = 0;
    let vatPaid = 0;
    const incomeByCategory: Record<string, number> = {};
    const expensesByCategory: Record<string, number> = {};

    for (const tx of transactions) {
      const amount = Math.abs(tx.amount);
      const category = tx.category || 'uncategorized';

      if (tx.amount > 0) {
        // Income
        totalIncome += amount;
        incomeByCategory[category] = (incomeByCategory[category] || 0) + amount;
        
        // Estimate VAT collected (assuming 21% standard rate)
        vatCollected += amount * 0.21;
      } else {
        // Expense
        totalExpenses += amount;
        expensesByCategory[category] = (expensesByCategory[category] || 0) + amount;
        
        // Estimate VAT paid (assuming 21% standard rate)
        vatPaid += amount * 0.21;
      }
    }

    const taxableIncome = totalIncome - totalExpenses;
    const vatEstimate = vatCollected - vatPaid;
    
    // Corporate tax estimate (25% standard rate in Spain)
    const corporateTaxRate = 0.25;
    const quarterlyEstimate = taxableIncome > 0 ? taxableIncome * corporateTaxRate : 0;
    const annualEstimate = quarterlyEstimate * (quarter ? 4 : 1);

    return {
      vatEstimate,
      quarterlyEstimate,
      annualEstimate,
      taxableIncome,
      deductibleExpenses: totalExpenses,
      breakdown: {
        incomeByCategory,
        expensesByCategory,
        vatCollected,
        vatPaid,
      },
    };
  }

  /**
   * Save tax projection to database
   */
  static async saveTaxProjection(
    organizationId: string,
    calculation: TaxCalculation,
    year: number,
    quarter?: number
  ) {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('tax_projections')
      .upsert({
        organization_id: organizationId,
        vat_estimate: calculation.vatEstimate,
        quarterly_estimate: calculation.quarterlyEstimate,
        annual_estimate: calculation.annualEstimate,
        tax_year: year,
        quarter: quarter || null,
        calculated_at: new Date().toISOString(),
        data: calculation as any,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Get tax settings for an organization
   */
  static async getTaxSettings(organizationId: string): Promise<TaxSettings | null> {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('tax_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) {
      // Return default settings
      return {
        country: 'ES',
        vatRate: 21.0,
        reducedVatRate: 10.0,
        corporateTaxRate: 25.0,
        fiscalYearStartMonth: 1,
      };
    }

    return {
      country: data.country,
      vatRate: data.vat_rate,
      reducedVatRate: data.reduced_vat_rate,
      corporateTaxRate: data.corporate_tax_rate,
      fiscalYearStartMonth: data.fiscal_year_start_month,
    };
  }

  /**
   * Update tax settings for an organization
   */
  static async updateTaxSettings(
    organizationId: string,
    settings: Partial<TaxSettings>
  ) {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('tax_settings')
      .upsert({
        organization_id: organizationId,
        country: settings.country || 'ES',
        vat_rate: settings.vatRate ?? 21.0,
        reduced_vat_rate: settings.reducedVatRate ?? 10.0,
        super_reduced_vat_rate: 4.0,
        corporate_tax_rate: settings.corporateTaxRate ?? 25.0,
        fiscal_year_start_month: settings.fiscalYearStartMonth ?? 1,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Create a tax filing record
   */
  static async createTaxFiling(
    organizationId: string,
    type: string,
    periodStart: string,
    periodEnd: string,
    amountDue: number
  ) {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('tax_filings')
      .insert({
        organization_id: organizationId,
        type,
        period_start: periodStart,
        period_end: periodEnd,
        amount_due: amountDue,
        status: 'draft',
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Get all tax filings for an organization
   */
  static async getTaxFilings(organizationId: string) {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('tax_filings')
      .select('*')
      .eq('organization_id', organizationId)
      .order('period_end', { ascending: false });

    if (error) throw error;

    return data;
  }

  /**
   * Mark a tax filing as submitted
   */
  static async markFilingAsSubmitted(
    filingId: string,
    submissionReference: string
  ) {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('tax_filings')
      .update({
        status: 'filed',
        filed_at: new Date().toISOString(),
        submission_reference: submissionReference,
      })
      .eq('id', filingId)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Mark a tax filing as paid
   */
  static async markFilingAsPaid(filingId: string, amountPaid: number) {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('tax_filings')
      .update({
        status: 'paid',
        amount_paid: amountPaid,
        paid_at: new Date().toISOString(),
      })
      .eq('id', filingId)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Helper: Get date range for a given year and quarter
   */
  private static getDateRange(year: number, quarter?: number) {
    let startDate: Date;
    let endDate: Date;

    if (quarter) {
      const monthStart = (quarter - 1) * 3;
      startDate = new Date(year, monthStart, 1);
      endDate = new Date(year, monthStart + 3, 0);
    } else {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
    }

    return { startDate, endDate };
  }

  /**
   * Get current quarter
   */
  static getCurrentQuarter(): number {
    const month = new Date().getMonth() + 1;
    return Math.ceil(month / 3);
  }
}
