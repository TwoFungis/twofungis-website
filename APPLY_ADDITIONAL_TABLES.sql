-- ============================================================
-- TradeOS ADDITIONAL TABLES Migration
-- ============================================================
-- Run this in Supabase SQL Editor AFTER the main schema
-- Tables: change_orders, production_logs, labor_profiles
-- ============================================================

-- ============================================================
-- CHANGE ORDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS change_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  co_number TEXT,
  description TEXT NOT NULL,
  total_value NUMERIC DEFAULT 0,
  labor_cost NUMERIC DEFAULT 0,
  material_cost NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'invoiced', 'paid', 'rejected')),
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_change_orders_user_id ON change_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_project_id ON change_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_status ON change_orders(status);

-- RLS
ALTER TABLE change_orders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own change orders" ON change_orders FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own change orders" ON change_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own change orders" ON change_orders FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own change orders" ON change_orders FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_change_orders_updated_at ON change_orders;
CREATE TRIGGER update_change_orders_updated_at BEFORE UPDATE ON change_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- PRODUCTION LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS production_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  crew_count INTEGER DEFAULT 0,
  hours_worked NUMERIC DEFAULT 0,
  scope_completed TEXT,
  units_installed NUMERIC DEFAULT 0,
  unit_type TEXT DEFAULT 'SF',
  issues_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_production_logs_user_id ON production_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_production_logs_project_id ON production_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_production_logs_log_date ON production_logs(log_date);

-- RLS
ALTER TABLE production_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own production logs" ON production_logs FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own production logs" ON production_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own production logs" ON production_logs FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own production logs" ON production_logs FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_production_logs_updated_at ON production_logs;
CREATE TRIGGER update_production_logs_updated_at BEFORE UPDATE ON production_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- LABOR PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS labor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT DEFAULT 'Default',
  base_wage NUMERIC DEFAULT 35,
  cpp_ei NUMERIC DEFAULT 7.5,
  worksafe NUMERIC DEFAULT 3.2,
  vacation_pay NUMERIC DEFAULT 4,
  fuel NUMERIC DEFAULT 5,
  tool_wear NUMERIC DEFAULT 3,
  insurance NUMERIC DEFAULT 2,
  overhead NUMERIC DEFAULT 15,
  target_margin NUMERIC DEFAULT 20,
  billable_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_labor_profiles_user_id ON labor_profiles(user_id);

-- RLS
ALTER TABLE labor_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own labor profiles" ON labor_profiles FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own labor profiles" ON labor_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own labor profiles" ON labor_profiles FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own labor profiles" ON labor_profiles FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_labor_profiles_updated_at ON labor_profiles;
CREATE TRIGGER update_labor_profiles_updated_at BEFORE UPDATE ON labor_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- QUOTES TABLE (for saved quotes)
-- ============================================================
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  quote_number TEXT,
  quote_name TEXT,
  client_gc TEXT,
  client_email TEXT,
  region TEXT,
  subtotal NUMERIC DEFAULT 0,
  markup_percent NUMERIC DEFAULT 0,
  markup_amount NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  payment_days INTEGER DEFAULT 30,
  quote_valid_days INTEGER DEFAULT 30,
  terms TEXT,
  exclusions TEXT,
  line_items JSONB DEFAULT '[]',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_project_id ON quotes(project_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);

-- RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own quotes" ON quotes FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own quotes" ON quotes FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own quotes" ON quotes FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own quotes" ON quotes FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_quotes_updated_at ON quotes;
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- DONE! Tables created with full CRUD permissions
-- ============================================================
