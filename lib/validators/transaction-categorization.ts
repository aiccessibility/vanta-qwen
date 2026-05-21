import { z } from 'zod';

/**
 * Categorías fiscales estándar para clasificación de transacciones
 */
export const TAX_CATEGORIES = [
  'income',
  'expense',
  'vat_input',
  'vat_output',
  'asset',
  'liability',
  'equity',
] as const;

export const EXPENSE_CATEGORIES = [
  'office_supplies',
  'software_subscriptions',
  'professional_services',
  'marketing_advertising',
  'travel_transportation',
  'meals_entertainment',
  'utilities',
  'rent_leases',
  'insurance',
  'bank_fees',
  'payroll_salaries',
  'training_education',
  'equipment_hardware',
  'telecommunications',
  'maintenance_repairs',
  'shipping_delivery',
  'contractors_freelancers',
  'other_expenses',
] as const;

export const INCOME_CATEGORIES = [
  'product_sales',
  'service_revenue',
  'subscription_revenue',
  'consulting_income',
  'commission_income',
  'investment_income',
  'other_income',
] as const;

export const MERCHANT_TYPES = [
  'retail',
  'saas',
  'restaurant',
  'transportation',
  'hotel',
  'gas_station',
  'supermarket',
  'electronics',
  'professional_service',
  'telecommunications',
  'utilities',
  'government',
  'financial_service',
  'entertainment',
  'healthcare',
  'education',
  'unknown',
] as const;

export const TransactionCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.enum(['income', 'expense']),
  subcategory: z.string(),
  taxTreatment: z.enum(['deductible', 'non_deductible', 'partial_deductible']),
  vatApplicable: z.boolean(),
  defaultVatRate: z.number().optional(),
  keywords: z.array(z.string()),
  confidenceThreshold: z.number().default(0.7),
});

export type TransactionCategory = z.infer<typeof TransactionCategorySchema>;

export const MerchantInfoSchema = z.object({
  name: z.string(),
  type: z.enum(MERCHANT_TYPES),
  category: z.string(),
  vatNumber: z.string().optional(),
  country: z.string().optional(),
  riskScore: z.number().min(0).max(1).optional(),
});

export type MerchantInfo = z.infer<typeof MerchantInfoSchema>;

export const AICategorizationResultSchema = z.object({
  categoryId: z.string(),
  categoryName: z.string(),
  subcategory: z.string(),
  confidence: z.number().min(0).max(1),
  merchantInfo: MerchantInfoSchema.optional(),
  taxTreatment: z.enum(['deductible', 'non_deductible', 'partial_deductible']),
  vatAmount: z.number().optional(),
  vatRate: z.number().optional(),
  reasoning: z.string(),
  alternativeCategories: z.array(
    z.object({
      categoryId: z.string(),
      confidence: z.number(),
    })
  ).optional(),
  needsReview: z.boolean(),
  learningData: z.object({
    userFeedback: z.string().optional(),
    contextUsed: z.array(z.string()),
    historicalMatches: z.number(),
  }).optional(),
});

export type AICategorizationResult = z.infer<typeof AICategorizationResultSchema>;

export const TransactionInputSchema = z.object({
  id: z.string().uuid(),
  amount: z.number(),
  currency: z.string(),
  description: z.string(),
  merchantName: z.string(),
  timestamp: z.string().datetime(),
  bankAccountId: z.string().uuid(),
  metadata: z.record(z.unknown()).optional(),
});

export type TransactionInput = z.infer<typeof TransactionInputSchema>;

export const CategorizationRequestSchema = z.object({
  transaction: TransactionInputSchema,
  organizationId: z.string().uuid(),
  userId: z.string().uuid(),
  includeAlternatives: z.boolean().default(false),
  useHistoricalContext: z.boolean().default(true),
});

export type CategorizationRequest = z.infer<typeof CategorizationRequestSchema>;
