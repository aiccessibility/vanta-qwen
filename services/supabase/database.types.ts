/**
 * Supabase Database Types for Vanta
 * Auto-generated types based on database schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      organizations: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          country: string;
          tax_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          country: string;
          tax_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          country?: string;
          tax_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'member';
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'member';
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: 'owner' | 'admin' | 'member';
          created_at?: string;
        };
      };
      bank_accounts: {
        Row: {
          id: string;
          organization_id: string;
          provider: string;
          iban: string;
          balance: number;
          currency: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          provider: string;
          iban: string;
          balance?: number;
          currency?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          provider?: string;
          iban?: string;
          balance?: number;
          currency?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          bank_account_id: string;
          amount: number;
          currency: string;
          merchant: string;
          category: string | null;
          confidence_score: number | null;
          timestamp: string;
          description: string | null;
          reference: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bank_account_id: string;
          amount: number;
          currency?: string;
          merchant: string;
          category?: string | null;
          confidence_score?: number | null;
          timestamp: string;
          description?: string | null;
          reference?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          bank_account_id?: string;
          amount?: number;
          currency?: string;
          merchant?: string;
          category?: string | null;
          confidence_score?: number | null;
          timestamp?: string;
          description?: string | null;
          reference?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          organization_id: string;
          file_url: string;
          type: string;
          parsed_json: Json | null;
          confidence_score: number | null;
          uploaded_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          file_url: string;
          type: string;
          parsed_json?: Json | null;
          confidence_score?: number | null;
          uploaded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          file_url?: string;
          type?: string;
          parsed_json?: Json | null;
          confidence_score?: number | null;
          uploaded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tax_projections: {
        Row: {
          id: string;
          organization_id: string;
          vat_estimate: number | null;
          quarterly_estimate: number | null;
          fiscal_year: number;
          quarter: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          vat_estimate?: number | null;
          quarterly_estimate?: number | null;
          fiscal_year: number;
          quarter?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          vat_estimate?: number | null;
          quarterly_estimate?: number | null;
          fiscal_year?: number;
          quarter?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ai_events: {
        Row: {
          id: string;
          organization_id: string;
          type: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          type: string;
          payload: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          type?: string;
          payload?: Json;
          created_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          entity_type: string;
          entity_id: string;
          action: string;
          user_id: string | null;
          previous_values: Json | null;
          new_values: Json | null;
          timestamp: string;
        };
        Insert: {
          id?: string;
          entity_type: string;
          entity_id: string;
          action: string;
          user_id?: string | null;
          previous_values?: Json | null;
          new_values?: Json | null;
          timestamp?: string;
        };
        Update: {
          id?: string;
          entity_type?: string;
          entity_id?: string;
          action?: string;
          user_id?: string | null;
          previous_values?: Json | null;
          new_values?: Json | null;
          timestamp?: string;
        };
      };
    };
    Views: {};
    Functions: {
      check_organization_role: {
        Args: {
          p_organization_id: string;
          p_required_roles: string[];
        };
        Returns: boolean;
      };
      get_user_organizations: {
        Args: {};
        Returns: {
          id: string;
          owner_id: string;
          name: string;
          country: string;
          tax_id: string | null;
          created_at: string;
          updated_at: string;
        }[];
      };
      get_user_role_in_organization: {
        Args: {
          p_organization_id: string;
        };
        Returns: string;
      };
    };
    Enums: {};
  };
}
