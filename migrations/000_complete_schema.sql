-- ===========================================
-- TradeOS Complete Database Schema Setup
-- Run this in Supabase SQL Editor for new project
-- ===========================================

-- 1. USERS PROFILE TABLE
CREATE TABLE IF NOT EXISTS users_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    company_name TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    province TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'Canada',
    
    -- Subscription
    subscription_tier TEXT DEFAULT 'trial' CHECK (subscription_tier IN ('trial', 'free', 'pro', 'elite', 'lifetime', 'founding', 'founding_lifetime', 'lifetime_elite')),
    plan_type TEXT DEFAULT 'TRIAL',
    plan_status TEXT DEFAULT 'inactive',
    
    -- Stripe
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_payment_intent_id TEXT,
    lifetime_purchased_at TIMESTAMPTZ,
    
    -- Trial & Access Control
    trial_started_at TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    grandfathered_active BOOLEAN DEFAULT false,
    locked_project_created BOOLEAN DEFAULT false,
    locked_quote_created BOOLEAN DEFAULT false,
    locked_invoice_created BOOLEAN DEFAULT false,
    ai_daily_usage INTEGER DEFAULT 0,
    ai_usage_reset_at TIMESTAMPTZ,
    
    -- Business Activation
    labor_rate DECIMAL(10,2),
    business_activated BOOLEAN DEFAULT false,
    business_activation_skipped BOOLEAN DEFAULT false,
    default_payment_days INTEGER DEFAULT 30,
    
    -- Profile
    avatar_url TEXT,
    rating_avg DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on users_profile
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users_profile
CREATE POLICY "Users can view own profile" ON users_profile
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON users_profile
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON users_profile
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    client_gc TEXT,
    region TEXT,
    contract_value DECIMAL(12,2),
    labor_rate DECIMAL(10,2),
    tax_type TEXT,
    tax_rate DECIMAL(5,2),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'on_hold')),
    client_approval_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own projects" ON projects FOR ALL USING (auth.uid() = user_id);

-- 3. QUOTES/ESTIMATES TABLE
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quote_number TEXT NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    project_name TEXT,
    client_name TEXT,
    client_email TEXT,
    client_address TEXT,
    client_phone TEXT,
    valid_until DATE,
    subtotal DECIMAL(12,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
    notes TEXT,
    sent_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, quote_number)
);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own quotes" ON quotes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own quotes" ON quotes FOR ALL USING (auth.uid() = user_id);

-- 4. QUOTE LINE ITEMS
CREATE TABLE IF NOT EXISTS quote_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    unit TEXT,
    line_total DECIMAL(12,2) DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quote_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own quote line items" ON quote_line_items
    FOR SELECT USING (EXISTS (SELECT 1 FROM quotes WHERE quotes.id = quote_line_items.quote_id AND quotes.user_id = auth.uid()));
CREATE POLICY "Users can manage own quote line items" ON quote_line_items
    FOR ALL USING (EXISTS (SELECT 1 FROM quotes WHERE quotes.id = quote_line_items.quote_id AND quotes.user_id = auth.uid()));

-- 5. PROJECT MILESTONES
CREATE TABLE IF NOT EXISTS project_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    due_date DATE,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'invoiced', 'paid')),
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    invoiced_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own milestones" ON project_milestones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own milestones" ON project_milestones FOR ALL USING (auth.uid() = user_id);

-- 6. INVOICES
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    milestone_id UUID REFERENCES project_milestones(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_email TEXT,
    client_address TEXT,
    client_phone TEXT,
    project_name TEXT,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled')),
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    paid_amount DECIMAL(12,2),
    payment_method TEXT,
    payment_terms TEXT DEFAULT 'Net 30',
    payment_terms_days INT DEFAULT 30,
    last_reminder_sent TIMESTAMPTZ,
    notes TEXT,
    internal_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, invoice_number)
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own invoices" ON invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own invoices" ON invoices FOR ALL USING (auth.uid() = user_id);

-- 7. INVOICE LINE ITEMS
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own invoice line items" ON invoice_line_items
    FOR SELECT USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_line_items.invoice_id AND invoices.user_id = auth.uid()));
CREATE POLICY "Users can manage own invoice line items" ON invoice_line_items
    FOR ALL USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_line_items.invoice_id AND invoices.user_id = auth.uid()));

-- 8. INVOICE COUNTERS
CREATE TABLE IF NOT EXISTS invoice_counters (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    current_number INT DEFAULT 0,
    prefix TEXT DEFAULT 'INV-',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE invoice_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own counter" ON invoice_counters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own counter" ON invoice_counters FOR ALL USING (auth.uid() = user_id);

-- 9. INVOICE ACTIVITY LOG
CREATE TABLE IF NOT EXISTS invoice_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    actor TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE invoice_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own activity" ON invoice_activity_log
    FOR SELECT USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_activity_log.invoice_id AND invoices.user_id = auth.uid()));
CREATE POLICY "Users can manage own activity" ON invoice_activity_log
    FOR ALL USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_activity_log.invoice_id AND invoices.user_id = auth.uid()));

-- 10. EXPENSES
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    category TEXT DEFAULT 'Other',
    payment_method TEXT,
    vendor TEXT,
    receipt_url TEXT,
    expense_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own expenses" ON expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own expenses" ON expenses FOR ALL USING (auth.uid() = user_id);

-- 11. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_users_profile_user_id ON users_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_user_id ON project_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON expenses(project_id);

-- 12. GRANT ACCESS TO SERVICE ROLE
GRANT ALL ON users_profile TO service_role;
GRANT ALL ON projects TO service_role;
GRANT ALL ON quotes TO service_role;
GRANT ALL ON quote_line_items TO service_role;
GRANT ALL ON project_milestones TO service_role;
GRANT ALL ON invoices TO service_role;
GRANT ALL ON invoice_line_items TO service_role;
GRANT ALL ON invoice_counters TO service_role;
GRANT ALL ON invoice_activity_log TO service_role;
GRANT ALL ON expenses TO service_role;

-- 13. FUNCTION: Get next invoice number
CREATE OR REPLACE FUNCTION get_next_invoice_number(p_user_id UUID, p_prefix TEXT DEFAULT 'INV-')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_number INT;
    v_invoice_number TEXT;
BEGIN
    INSERT INTO invoice_counters (user_id, current_number, prefix, updated_at)
    VALUES (p_user_id, 1, p_prefix, NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET current_number = invoice_counters.current_number + 1,
        prefix = COALESCE(p_prefix, invoice_counters.prefix),
        updated_at = NOW()
    RETURNING current_number INTO v_number;
    
    v_invoice_number := p_prefix || LPAD(v_number::TEXT, 4, '0');
    RETURN v_invoice_number;
END;
$$;

GRANT EXECUTE ON FUNCTION get_next_invoice_number TO service_role;

-- Done!
SELECT 'TradeOS database schema created successfully!' as status;
