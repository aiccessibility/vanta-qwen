-- Vanta Seed Data
-- For development and testing purposes

-- ============================================
-- SAMPLE ORGANIZATIONS
-- ============================================

INSERT INTO organizations (id, owner_id, name, country, tax_id)
SELECT 
    '550e8400-e29b-41d4-a716-446655440001',
    u.id,
    'Acme Corporation',
    'ES',
    'B12345678'
FROM users u
WHERE u.email = 'owner@vanta.dev'
ON CONFLICT (id) DO NOTHING;

INSERT INTO organizations (id, owner_id, name, country, tax_id)
SELECT 
    '550e8400-e29b-41d4-a716-446655440002',
    u.id,
    'Tech Startup SL',
    'ES',
    'B87654321'
FROM users u
WHERE u.email = 'founder@vanta.dev'
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SAMPLE BANK ACCOUNTS
-- ============================================

INSERT INTO bank_accounts (id, organization_id, provider, iban, balance, currency)
VALUES 
    ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Stripe', 'ES9121000418450200051332', 15000.00, 'EUR'),
    ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Wise', 'ES7620770024003102575766', 8500.50, 'EUR'),
    ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Revolut Business', 'LT213250024345874123', 25000.00, 'EUR')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SAMPLE TRANSACTIONS
-- ============================================

INSERT INTO transactions (bank_account_id, amount, currency, merchant, category, confidence_score, timestamp, description)
VALUES 
    -- Income transactions
    ('660e8400-e29b-41d4-a716-446655440001', 5000.00, 'EUR', 'Client ABC', 'income', 0.98, NOW() - INTERVAL '5 days', 'Payment for consulting services'),
    ('660e8400-e29b-41d4-a716-446655440001', 2500.00, 'EUR', 'Client XYZ', 'income', 0.95, NOW() - INTERVAL '10 days', 'Monthly retainer'),
    
    -- Expense transactions
    ('660e8400-e29b-41d4-a716-446655440001', -150.00, 'EUR', 'AWS', 'infrastructure', 0.99, NOW() - INTERVAL '3 days', 'Cloud hosting'),
    ('660e8400-e29b-41d4-a716-446655440001', -89.99, 'EUR', 'Slack', 'software', 0.97, NOW() - INTERVAL '7 days', 'Team communication'),
    ('660e8400-e29b-41d4-a716-446655440001', -299.00, 'EUR', 'Apple', 'equipment', 0.92, NOW() - INTERVAL '15 days', 'MacBook accessories'),
    ('660e8400-e29b-41d4-a716-446655440001', -45.00, 'EUR', 'GitHub', 'software', 0.99, NOW() - INTERVAL '1 days', 'Developer tools'),
    
    -- More transactions for second account
    ('660e8400-e29b-41d4-a716-446655440002', 3000.00, 'EUR', 'Enterprise Client', 'income', 0.96, NOW() - INTERVAL '2 days', 'Project milestone'),
    ('660e8400-e29b-41d4-a716-446655440002', -200.00, 'EUR', 'Google Workspace', 'software', 0.98, NOW() - INTERVAL '4 days', 'Email and productivity'),
    
    -- Transactions for second organization
    ('660e8400-e29b-41d4-a716-446655440003', 10000.00, 'EUR', 'Investment Round', 'investment', 1.00, NOW() - INTERVAL '20 days', 'Seed funding'),
    ('660e8400-e29b-41d4-a716-446655440003', -1500.00, 'EUR', 'Office Rent', 'rent', 0.99, NOW() - INTERVAL '1 days', 'Monthly office rent'),
    ('660e8400-e29b-41d4-a716-446655440003', -350.00, 'EUR', 'Notion', 'software', 0.97, NOW() - INTERVAL '8 days', 'Workspace management')
ON CONFLICT DO NOTHING;

-- ============================================
-- SAMPLE DOCUMENTS
-- ============================================

INSERT INTO documents (organization_id, file_url, type, parsed_json, confidence_score)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'https://storage.vanta.dev/invoices/inv-001.pdf', 'invoice', 
     '{"invoice_number": "INV-001", "amount": 5000, "date": "2025-01-15", "vendor": "Client ABC"}'::jsonb, 0.95),
    ('550e8400-e29b-41d4-a716-446655440001', 'https://storage.vanta.dev/receipts/rec-001.pdf', 'receipt', 
     '{"receipt_number": "REC-001", "amount": 150, "date": "2025-01-17", "vendor": "AWS"}'::jsonb, 0.92),
    ('550e8400-e29b-41d4-a716-446655440002', 'https://storage.vanta.dev/invoices/inv-002.pdf', 'invoice', 
     '{"invoice_number": "INV-002", "amount": 3000, "date": "2025-01-18", "vendor": "Enterprise Client"}'::jsonb, 0.94)
ON CONFLICT DO NOTHING;

-- ============================================
-- SAMPLE TAX PROJECTIONS
-- ============================================

INSERT INTO tax_projections (organization_id, vat_estimate, quarterly_estimate, fiscal_year, quarter)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 1890.00, 7560.00, 2025, 1),
    ('550e8400-e29b-41d4-a716-446655440002', 2100.00, 8400.00, 2025, 1)
ON CONFLICT (organization_id, fiscal_year, quarter) DO NOTHING;

-- ============================================
-- SAMPLE AI EVENTS
-- ============================================

INSERT INTO ai_events (organization_id, type, payload)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'transaction_categorized', 
     '{"transaction_id": "xxx", "predicted_category": "infrastructure", "confidence": 0.99}'::jsonb),
    ('550e8400-e29b-41d4-a716-446655440001', 'anomaly_detected', 
     '{"transaction_id": "yyy", "reason": "unusual_amount", "severity": "medium"}'::jsonb),
    ('550e8400-e29b-41d4-a716-446655440002', 'tax_optimization_suggestion', 
     '{"suggestion": "Consider R&D tax credit", "potential_savings": 1500}'::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================
-- SAMPLE AUDIT LOGS
-- ============================================

INSERT INTO audit_logs (entity_type, entity_id, action, user_id, previous_values, new_values)
SELECT 
    'organization',
    '550e8400-e29b-41d4-a716-446655440001',
    'created',
    u.id,
    NULL,
    '{"name": "Acme Corporation", "country": "ES"}'::jsonb
FROM users u
WHERE u.email = 'owner@vanta.dev'
ON CONFLICT DO NOTHING;

INSERT INTO audit_logs (entity_type, entity_id, action, user_id, previous_values, new_values)
SELECT 
    'bank_account',
    '660e8400-e29b-41d4-a716-446655440001',
    'connected',
    u.id,
    NULL,
    '{"provider": "Stripe", "iban": "ES91***1332"}'::jsonb
FROM users u
WHERE u.email = 'owner@vanta.dev'
ON CONFLICT DO NOTHING;
