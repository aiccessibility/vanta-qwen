/**
 * README: Database Architecture for Vanta
 * 
 * This document describes the database architecture implemented for Vanta.
 */

# Vanta Database Architecture

## Overview

Vanta uses **Supabase** (PostgreSQL) as its primary database with Row Level Security (RLS) for data protection.

## Core Tables

### 1. `users`
Extends Supabase auth.users with additional profile information.
- `id`: UUID (PK, references auth.users)
- `email`: TEXT (unique)
- `created_at`, `updated_at`: TIMESTAMPTZ

### 2. `organizations`
Represents companies/businesses using Vanta.
- `id`: UUID (PK)
- `owner_id`: UUID (FK → users)
- `name`, `country`, `tax_id`: TEXT
- `created_at`, `updated_at`: TIMESTAMPTZ

### 3. `organization_members`
Many-to-many relationship between users and organizations with roles.
- `id`: UUID (PK)
- `organization_id`, `user_id`: UUID (FK)
- `role`: TEXT ('owner' | 'admin' | 'member')
- Unique constraint on (organization_id, user_id)

### 4. `bank_accounts`
Connected bank accounts for organizations.
- `id`: UUID (PK)
- `organization_id`: UUID (FK)
- `provider`, `iban`, `currency`: TEXT
- `balance`: DECIMAL(20,2)
- `is_active`: BOOLEAN

### 5. `transactions`
Financial transactions from connected bank accounts.
- `id`: UUID (PK)
- `bank_account_id`: UUID (FK)
- `amount`: DECIMAL(20,2)
- `merchant`, `category`: TEXT
- `confidence_score`: DECIMAL(5,4) [0-1]
- `timestamp`: TIMESTAMPTZ

### 6. `documents`
Uploaded financial documents (invoices, receipts).
- `id`: UUID (PK)
- `organization_id`: UUID (FK)
- `file_url`: TEXT
- `type`: TEXT
- `parsed_json`: JSONB
- `confidence_score`: DECIMAL(5,4)

### 7. `tax_projections`
Calculated tax estimates.
- `id`: UUID (PK)
- `organization_id`: UUID (FK)
- `vat_estimate`, `quarterly_estimate`: DECIMAL(20,2)
- `fiscal_year`: INTEGER
- `quarter`: INTEGER [1-4]
- Unique constraint on (organization_id, fiscal_year, quarter)

### 8. `ai_events`
AI-generated insights and events.
- `id`: UUID (PK)
- `organization_id`: UUID (FK)
- `type`: TEXT
- `payload`: JSONB

### 9. `audit_logs`
Audit trail for all important actions.
- `id`: UUID (PK)
- `entity_type`, `action`: TEXT
- `entity_id`: UUID
- `user_id`: UUID (FK)
- `previous_values`, `new_values`: JSONB
- `timestamp`: TIMESTAMPTZ

## Security Model

### Row Level Security (RLS)
All tables have RLS enabled with policies that ensure:
- Users can only access data from their organizations
- Role-based permissions (owner > admin > member)
- Owners have full control, admins can manage, members can view

### Key Policies
1. **Users**: Can only view/update their own profile
2. **Organizations**: Members can view, owners can update
3. **Bank Accounts**: Members can view, owners/admins can manage
4. **Transactions**: Members can view, owners/admins can manage
5. **Documents**: Members can view, owners/admins can manage
6. **Tax Projections**: Members can view, owners/admins can manage
7. **Audit Logs**: Only owners/admins can view

## Triggers

### Automatic Profile Creation
- `on_auth_user_created`: Creates user record when auth.user is created

### Automatic Membership
- `on_organization_created`: Adds creator as 'owner' member

### Timestamp Updates
- Auto-updates `updated_at` on all tables

## Helper Functions

1. `check_organization_role(org_id, roles[])`: Check if user has required role
2. `get_user_organizations()`: Get all organizations for current user
3. `get_user_role_in_organization(org_id)`: Get user's role in specific org

## Files Structure

```
/supabase
  /migrations
    001_initial_schema.sql    # Complete schema with RLS
  /seed
    001_seed_data.sql         # Sample data for development

/services/supabase
  client.ts                   # Supabase client configuration
  database.types.ts           # TypeScript types from schema

/types
  database.ts                 # Application database types

/lib/validators
  database.ts                 # Zod schemas for validation

/features/organizations
  organizations.service.ts    # Organization CRUD operations
```

## Usage

### Running Migrations
```bash
# Using Supabase CLI
supabase db push

# Or apply manually in Supabase Dashboard SQL Editor
```

### Seeding Development Data
```sql
-- Run after migrations in development
\i supabase/seed/001_seed_data.sql
```

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Next Steps

1. ✅ Database schema implemented
2. ✅ RLS policies configured
3. ✅ TypeScript types generated
4. ✅ Validation schemas created
5. ✅ Organizations service implemented
6. ⏳ Transactions service (pending)
7. ⏳ Documents service (pending)
8. ⏳ Tax projections service (pending)
