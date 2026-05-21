-- Tabla para categorías personalizables de transacciones
CREATE TABLE IF NOT EXISTS transaction_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  subcategory TEXT,
  tax_treatment TEXT NOT NULL CHECK (tax_treatment IN ('deductible', 'non_deductible', 'partial_deductible')),
  vat_applicable BOOLEAN DEFAULT true,
  default_vat_rate DECIMAL(5,4),
  keywords TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para feedback de categorización (aprendizaje)
CREATE TABLE IF NOT EXISTS categorization_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  original_category TEXT NOT NULL,
  new_category TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_transaction_categories_org ON transaction_categories(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_transaction_categories_keywords ON transaction_categories USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_categorization_feedback_transaction ON categorization_feedback(transaction_id);
CREATE INDEX IF NOT EXISTS idx_categorization_feedback_org ON categorization_feedback(organization_id, created_at);

-- Trigger para actualizar updated_at en transaction_categories
CREATE OR REPLACE FUNCTION update_transaction_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_transaction_categories
  BEFORE UPDATE ON transaction_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_transaction_categories_updated_at();

-- Políticas RLS para transaction_categories
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver categorías de su organización"
  ON transaction_categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = transaction_categories.organization_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins y owners pueden gestionar categorías"
  ON transaction_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = transaction_categories.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- Políticas RLS para categorization_feedback
ALTER TABLE categorization_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver feedback de su organización"
  ON categorization_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = categorization_feedback.organization_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios pueden crear feedback"
  ON categorization_feedback FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = categorization_feedback.organization_id
      AND om.user_id = auth.uid()
    )
  );

-- Insertar categorías por defecto para nuevas organizaciones (ejemplo)
INSERT INTO transaction_categories (name, type, subcategory, tax_treatment, vat_applicable, default_vat_rate, keywords, is_active)
VALUES
  -- Gastos
  ('Software y Suscripciones', 'expense', 'software_subscriptions', 'deductible', true, 0.21, ARRAY['saas', 'software', 'suscripción', 'subscription', 'cloud'], true),
  ('Servicios Profesionales', 'expense', 'professional_services', 'deductible', true, 0.21, ARRAY['consulting', 'abogado', 'lawyer', 'consultor', 'asesor'], true),
  ('Marketing y Publicidad', 'expense', 'marketing_advertising', 'deductible', true, 0.21, ARRAY['google ads', 'facebook', 'instagram', 'publicidad', 'marketing', 'ads'], true),
  ('Viajes y Transporte', 'expense', 'travel_transportation', 'deductible', true, 0.21, ARRAY['uber', 'taxi', 'train', 'flight', 'hotel', 'viaje'], true),
  ('Comidas y Entretenimiento', 'expense', 'meals_entertainment', 'partial_deductible', true, 0.10, ARRAY['restaurant', 'restaurante', 'comida', 'lunch', 'dinner'], true),
  ('Suministros de Oficina', 'expense', 'office_supplies', 'deductible', true, 0.21, ARRAY['staples', 'office depot', 'papel', 'bolígrafos', 'supplies'], true),
  ('Equipamiento y Hardware', 'expense', 'equipment_hardware', 'deductible', true, 0.21, ARRAY['apple', 'dell', 'hp', 'ordenador', 'laptop', 'hardware'], true),
  ('Telecomunicaciones', 'expense', 'telecommunications', 'deductible', true, 0.21, ARRAY['telefonica', 'movistar', 'vodafone', 'orange', 'internet', 'teléfono'], true),
  ('Seguros', 'expense', 'insurance', 'deductible', true, 0.21, ARRAY['insurance', 'seguro', 'mutua'], true),
  ('Mantenimiento y Reparaciones', 'expense', 'maintenance_repairs', 'deductible', true, 0.21, ARRAY['repair', 'mantenimiento', 'fix'], true),
  
  -- Ingresos
  ('Ventas de Productos', 'income', 'product_sales', 'deductible', true, 0.21, ARRAY['venta', 'producto', 'sale', 'product'], true),
  ('Ingresos por Servicios', 'income', 'service_revenue', 'deductible', true, 0.21, ARRAY['servicio', 'service', 'consulting', 'project'], true),
  ('Suscripciones Recurrentes', 'income', 'subscription_revenue', 'deductible', true, 0.21, ARRAY['subscription', 'mensual', 'recurrente'], true);

COMMENT ON TABLE transaction_categories IS 'Categorías personalizables para clasificación de transacciones';
COMMENT ON TABLE categorization_feedback IS 'Feedback de usuarios para mejorar la categorización automática con IA';
