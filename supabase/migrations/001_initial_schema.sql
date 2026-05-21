-- Vanta Database Schema
-- Migration: 001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE TABLES
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    tax_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organization members (role-based access)
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Bank accounts table
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    iban TEXT NOT NULL,
    balance DECIMAL(20, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'EUR',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
    amount DECIMAL(20, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    merchant TEXT NOT NULL,
    category TEXT,
    confidence_score DECIMAL(5, 4) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    timestamp TIMESTAMPTZ NOT NULL,
    description TEXT,
    reference TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    type TEXT NOT NULL,
    parsed_json JSONB,
    confidence_score DECIMAL(5, 4) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tax projections table
CREATE TABLE IF NOT EXISTS tax_projections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vat_estimate DECIMAL(20, 2),
    quarterly_estimate DECIMAL(20, 2),
    fiscal_year INTEGER NOT NULL,
    quarter INTEGER CHECK (quarter BETWEEN 1 AND 4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, fiscal_year, quarter)
);

-- AI events table
CREATE TABLE IF NOT EXISTS ai_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,
    user_id UUID REFERENCES users(id),
    previous_values JSONB,
    new_values JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_organization_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_organization_id ON bank_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_transactions_bank_account_id ON transactions(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_documents_organization_id ON documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_tax_projections_organization_id ON tax_projections(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_events_organization_id ON ai_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_events_type ON ai_events(type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at
    BEFORE UPDATE ON bank_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_projections_updated_at
    BEFORE UPDATE ON tax_projections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRIGGER: Create user profile on signup
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NOW(), NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================
-- TRIGGER: Create organization member on organization creation
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_organization()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO organization_members (organization_id, user_id, role, created_at)
    VALUES (NEW.id, NEW.owner_id, 'owner', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_organization_created ON organizations;
CREATE TRIGGER on_organization_created
    AFTER INSERT ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_organization();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- Organization members policies
CREATE POLICY "Users can view members of their organizations"
    ON organization_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = organization_members.organization_id
            AND om.user_id = auth.uid()
        )
    );

-- Organizations policies
CREATE POLICY "Users can view their organizations"
    ON organizations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = organizations.id
            AND om.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create organizations"
    ON organizations FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their organizations"
    ON organizations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = organizations.id
            AND om.user_id = auth.uid()
            AND om.role = 'owner'
        )
    );

-- Bank accounts policies
CREATE POLICY "Users can view bank accounts of their organizations"
    ON bank_accounts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = bank_accounts.organization_id
            AND om.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins and owners can manage bank accounts"
    ON bank_accounts FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = bank_accounts.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
    );

-- Transactions policies
CREATE POLICY "Users can view transactions of their organizations"
    ON transactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            JOIN bank_accounts ba ON ba.organization_id = om.organization_id
            WHERE ba.id = transactions.bank_account_id
            AND om.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins and owners can manage transactions"
    ON transactions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            JOIN bank_accounts ba ON ba.organization_id = om.organization_id
            WHERE ba.id = transactions.bank_account_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
    );

-- Documents policies
CREATE POLICY "Users can view documents of their organizations"
    ON documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = documents.organization_id
            AND om.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins and owners can manage documents"
    ON documents FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = documents.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
    );

-- Tax projections policies
CREATE POLICY "Users can view tax projections of their organizations"
    ON tax_projections FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = tax_projections.organization_id
            AND om.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins and owners can manage tax projections"
    ON tax_projections FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = tax_projections.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
    );

-- AI events policies
CREATE POLICY "Users can view AI events of their organizations"
    ON ai_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = ai_events.organization_id
            AND om.user_id = auth.uid()
        )
    );

CREATE POLICY "System can create AI events"
    ON ai_events FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = ai_events.organization_id
            AND om.user_id = auth.uid()
        )
    );

-- Audit logs policies
CREATE POLICY "Admins and owners can view audit logs"
    ON audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE (
                (audit_logs.entity_type = 'organization' AND om.organization_id = audit_logs.entity_id)
                OR
                (om.organization_id IN (
                    SELECT o.id FROM organizations o
                    JOIN bank_accounts ba ON ba.organization_id = o.id
                    WHERE ba.id = audit_logs.entity_id
                    AND audit_logs.entity_type = 'bank_account'
                ))
                OR
                (om.organization_id IN (
                    SELECT o.id FROM organizations o
                    JOIN bank_accounts ba ON ba.organization_id = o.id
                    JOIN transactions t ON t.bank_account_id = ba.id
                    WHERE t.id = audit_logs.entity_id
                    AND audit_logs.entity_type = 'transaction'
                ))
            )
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
    );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if user has role in organization
CREATE OR REPLACE FUNCTION check_organization_role(
    p_organization_id UUID,
    p_required_roles TEXT[]
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = p_organization_id
        AND user_id = auth.uid()
        AND role = ANY(p_required_roles)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's organizations
CREATE OR REPLACE FUNCTION get_user_organizations()
RETURNS SETOF organizations AS $$
BEGIN
    RETURN QUERY
    SELECT o.*
    FROM organizations o
    JOIN organization_members om ON om.organization_id = o.id
    WHERE om.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's role in organization
CREATE OR REPLACE FUNCTION get_user_role_in_organization(p_organization_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM organization_members
    WHERE organization_id = p_organization_id
    AND user_id = auth.uid();
    
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
