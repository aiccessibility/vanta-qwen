/**
 * Database Types for Vanta
 * Generated from Supabase schema
 */

export type UUID = string;

export type UserRole = 'owner' | 'admin' | 'member';

export type DocumentType = 'invoice' | 'receipt' | 'contract' | 'tax_form' | 'other';

export type AIEventType = 
  | 'transaction_categorized'
  | 'anomaly_detected'
  | 'tax_optimization_suggestion'
  | 'document_parsed'
  | 'forecast_updated';

export interface User {
  id: UUID;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: UUID;
  owner_id: UUID;
  name: string;
  country: string;
  tax_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: UUID;
  organization_id: UUID;
  user_id: UUID;
  role: UserRole;
  created_at: string;
  user?: User;
}

export interface BankAccount {
  id: UUID;
  organization_id: UUID;
  provider: string;
  iban: string;
  balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  organization?: Organization;
}

export interface Transaction {
  id: UUID;
  bank_account_id: UUID;
  amount: number;
  currency: string;
  merchant: string;
  category?: string | null;
  confidence_score?: number | null;
  timestamp: string;
  description?: string | null;
  reference?: string | null;
  created_at: string;
  updated_at: string;
  bank_account?: BankAccount;
}

export interface Document {
  id: UUID;
  organization_id: UUID;
  file_url: string;
  type: DocumentType;
  parsed_json?: Record<string, unknown> | null;
  confidence_score?: number | null;
  uploaded_by?: UUID | null;
  created_at: string;
  updated_at: string;
  uploader?: User;
}

export interface TaxProjection {
  id: UUID;
  organization_id: UUID;
  vat_estimate?: number | null;
  quarterly_estimate?: number | null;
  fiscal_year: number;
  quarter?: number | null;
  created_at: string;
  updated_at: string;
  organization?: Organization;
}

export interface AIEvent {
  id: UUID;
  organization_id: UUID;
  type: AIEventType;
  payload: Record<string, unknown>;
  created_at: string;
  organization?: Organization;
}

export interface AuditLog {
  id: UUID;
  entity_type: string;
  entity_id: UUID;
  action: string;
  user_id?: UUID | null;
  previous_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  timestamp: string;
  user?: User;
}

// Response types
export interface DashboardSummary {
  total_balance: number;
  monthly_income: number;
  monthly_expenses: number;
  pending_transactions: number;
  vat_due: number;
}

export interface TransactionFilters {
  bank_account_id?: UUID;
  category?: string;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  search?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
