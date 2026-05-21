import { z } from 'zod';

/**
 * Database validation schemas for Vanta
 */

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const UUIDSchema = z.string().uuid('Invalid UUID format');

export const UserRoleSchema = z.enum(['owner', 'admin', 'member']);

export const DocumentTypeSchema = z.enum(['invoice', 'receipt', 'contract', 'tax_form', 'other']);

export const AIEventTypeSchema = z.enum([
  'transaction_categorized',
  'anomaly_detected',
  'tax_optimization_suggestion',
  'document_parsed',
  'forecast_updated'
]);

// Organization schemas
export const CreateOrganizationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  country: z.string().length(2, 'Country must be a 2-letter ISO code'),
  tax_id: z.string().optional()
});

export const UpdateOrganizationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  country: z.string().length(2).optional(),
  tax_id: z.string().optional().nullable()
});

// Bank Account schemas
export const CreateBankAccountSchema = z.object({
  provider: z.string().min(1, 'Provider is required'),
  iban: z.string().min(1, 'IBAN is required'),
  currency: z.string().default('EUR')
});

export const UpdateBankAccountSchema = z.object({
  provider: z.string().min(1).optional(),
  iban: z.string().min(1).optional(),
  balance: z.number().optional(),
  currency: z.string().optional(),
  is_active: z.boolean().optional()
});

// Transaction schemas
export const CreateTransactionSchema = z.object({
  bank_account_id: UUIDSchema,
  amount: z.number(),
  currency: z.string().default('EUR'),
  merchant: z.string().min(1, 'Merchant is required'),
  category: z.string().optional().nullable(),
  confidence_score: z.number().min(0).max(1).optional().nullable(),
  timestamp: z.string().datetime(),
  description: z.string().optional().nullable(),
  reference: z.string().optional().nullable()
});

export const UpdateTransactionSchema = z.object({
  amount: z.number().optional(),
  currency: z.string().optional(),
  merchant: z.string().min(1).optional(),
  category: z.string().optional().nullable(),
  confidence_score: z.number().min(0).max(1).optional().nullable(),
  timestamp: z.string().datetime().optional(),
  description: z.string().optional().nullable(),
  reference: z.string().optional().nullable()
});

export const TransactionFiltersSchema = z.object({
  bank_account_id: UUIDSchema.optional(),
  category: z.string().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  amount_min: z.number().optional(),
  amount_max: z.number().optional(),
  search: z.string().optional()
});

// Document schemas
export const CreateDocumentSchema = z.object({
  organization_id: UUIDSchema,
  file_url: z.string().url(),
  type: DocumentTypeSchema,
  uploaded_by: UUIDSchema.optional()
});

export const UpdateDocumentSchema = z.object({
  type: DocumentTypeSchema.optional(),
  parsed_json: z.record(z.unknown()).optional().nullable(),
  confidence_score: z.number().min(0).max(1).optional().nullable()
});

// Tax Projection schemas
export const CreateTaxProjectionSchema = z.object({
  organization_id: UUIDSchema,
  vat_estimate: z.number().optional().nullable(),
  quarterly_estimate: z.number().optional().nullable(),
  fiscal_year: z.number().int(),
  quarter: z.number().int().min(1).max(4).optional().nullable()
});

export const UpdateTaxProjectionSchema = z.object({
  vat_estimate: z.number().optional().nullable(),
  quarterly_estimate: z.number().optional().nullable()
});

// AI Event schemas
export const CreateAIEventSchema = z.object({
  organization_id: UUIDSchema,
  type: AIEventTypeSchema,
  payload: z.record(z.unknown())
});

// Audit Log schemas
export const CreateAuditLogSchema = z.object({
  entity_type: z.string().min(1),
  entity_id: UUIDSchema,
  action: z.string().min(1),
  user_id: UUIDSchema.optional().nullable(),
  previous_values: z.record(z.unknown()).optional().nullable(),
  new_values: z.record(z.unknown()).optional().nullable()
});

// Pagination schema
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// Export typed schemas
export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;
export type CreateBankAccountInput = z.infer<typeof CreateBankAccountSchema>;
export type UpdateBankAccountInput = z.infer<typeof UpdateBankAccountSchema>;
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;
export type TransactionFiltersInput = z.infer<typeof TransactionFiltersSchema>;
export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof UpdateDocumentSchema>;
export type CreateTaxProjectionInput = z.infer<typeof CreateTaxProjectionSchema>;
export type UpdateTaxProjectionInput = z.infer<typeof UpdateTaxProjectionSchema>;
export type CreateAIEventInput = z.infer<typeof CreateAIEventSchema>;
export type CreateAuditLogInput = z.infer<typeof CreateAuditLogSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
