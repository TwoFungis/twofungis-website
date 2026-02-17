-- TradeOS Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS PROFILE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users_profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name TEXT,
  company_name TEXT,
  trade_type TEXT,
  region TEXT,
  phone TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  subscription_tier TEXT DEFAULT 'trial' CHECK (subscription_tier IN ('trial', 'pro', 'elite')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'trialing')),
  stripe_customer_id TEXT,
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for users_profile
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON users_profile
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON users_profile
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON users_profile
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 2. PROJECTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  client_gc TEXT,
  region TEXT,
  contract_value NUMERIC DEFAULT 0,
  approved_cos NUMERIC DEFAULT 0,
  cost_to_date NUMERIC DEFAULT 0,
  percent_complete INTEGER DEFAULT 0 CHECK (percent_complete >= 0 AND percent_complete <= 100),
  forecast_margin NUMERIC DEFAULT 20,
  risk_flag TEXT DEFAULT 'green' CHECK (risk_flag IN ('green', 'yellow', 'red')),
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 3. CHANGE ORDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS change_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  co_number TEXT NOT NULL,
  description TEXT,
  labor_cost NUMERIC DEFAULT 0,
  material_cost NUMERIC DEFAULT 0,
  markup_pct NUMERIC DEFAULT 15,
  total_value NUMERIC DEFAULT 0,
  submitted_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'invoiced', 'paid')),
  approved_date DATE,
  invoiced_date DATE,
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for change_orders
ALTER TABLE change_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own change orders" ON change_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own change orders" ON change_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own change orders" ON change_orders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own change orders" ON change_orders
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 4. LABOR PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS labor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  wage NUMERIC DEFAULT 35,
  cpp_ei_pct NUMERIC DEFAULT 7.5,
  worksafe_pct NUMERIC DEFAULT 3.2,
  vacation_pct NUMERIC DEFAULT 4,
  fuel_per_hr NUMERIC DEFAULT 5,
  tool_wear_per_hr NUMERIC DEFAULT 3,
  insurance_per_hr NUMERIC DEFAULT 2,
  overhead_pct NUMERIC DEFAULT 15,
  target_margin_pct NUMERIC DEFAULT 20,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for labor_profiles
ALTER TABLE labor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own labor profiles" ON labor_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own labor profiles" ON labor_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own labor profiles" ON labor_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own labor profiles" ON labor_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 5. SCOPE LIBRARY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS scope_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  scope_item TEXT NOT NULL,
  unit TEXT DEFAULT 'LF',
  default_low NUMERIC DEFAULT 0,
  default_mid NUMERIC DEFAULT 0,
  default_high NUMERIC DEFAULT 0,
  pricing_method TEXT DEFAULT 'per_unit' CHECK (pricing_method IN ('per_unit', 'lump_sum', 'hourly')),
  category TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for scope_library
ALTER TABLE scope_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scope library" ON scope_library
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scope items" ON scope_library
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scope items" ON scope_library
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scope items" ON scope_library
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 6. QUOTES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  quote_number TEXT,
  quote_name TEXT NOT NULL,
  client_gc TEXT,
  client_email TEXT,
  client_phone TEXT,
  region TEXT,
  tier_level TEXT DEFAULT 'custom' CHECK (tier_level IN ('spec', 'custom', 'luxury')),
  profit_target_pct NUMERIC DEFAULT 20,
  subtotal NUMERIC DEFAULT 0,
  markup_amount NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  exclusions TEXT,
  terms TEXT,
  valid_until DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  sent_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for quotes
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quotes" ON quotes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quotes" ON quotes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quotes" ON quotes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quotes" ON quotes
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 7. QUOTE LINES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS quote_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE NOT NULL,
  scope_item TEXT NOT NULL,
  description TEXT,
  qty NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'EA',
  unit_price NUMERIC DEFAULT 0,
  line_total NUMERIC DEFAULT 0,
  price_choice TEXT DEFAULT 'mid' CHECK (price_choice IN ('low', 'mid', 'high', 'custom')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for quote_lines
ALTER TABLE quote_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quote lines" ON quote_lines
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quote lines" ON quote_lines
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quote lines" ON quote_lines
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quote lines" ON quote_lines
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 8. PRODUCTION LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS production_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  log_date DATE DEFAULT CURRENT_DATE,
  crew_count INTEGER DEFAULT 1,
  crew_names TEXT,
  scope_completed TEXT,
  units_installed NUMERIC DEFAULT 0,
  unit_type TEXT DEFAULT 'LF',
  hours_worked NUMERIC DEFAULT 0,
  issues TEXT,
  shortages_bool BOOLEAN DEFAULT false,
  weather TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for production_logs
ALTER TABLE production_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own production logs" ON production_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own production logs" ON production_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own production logs" ON production_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own production logs" ON production_logs
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 9. PAYMENT TRANSACTIONS TABLE (for Stripe)
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT UNIQUE NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'cad',
  plan_type TEXT CHECK (plan_type IN ('pro', 'elite')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'expired', 'cancelled')),
  stripe_payment_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for payment_transactions
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON payment_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_user_id ON change_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_project_id ON change_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_lines_quote_id ON quote_lines(quote_id);
CREATE INDEX IF NOT EXISTS idx_production_logs_user_id ON production_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_production_logs_project_id ON production_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_session_id ON payment_transactions(session_id);

-- =====================================================
-- TRIGGER FOR UPDATED_AT TIMESTAMPS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_profile_updated_at BEFORE UPDATE ON users_profile
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_change_orders_updated_at BEFORE UPDATE ON change_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_labor_profiles_updated_at BEFORE UPDATE ON labor_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scope_library_updated_at BEFORE UPDATE ON scope_library
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_logs_updated_at BEFORE UPDATE ON production_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION TO AUTO-CREATE USER PROFILE ON SIGNUP
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users_profile (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
