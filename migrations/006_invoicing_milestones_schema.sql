-- TradeOS Core Business Functions: Invoicing & Milestones Schema
-- Run this in Supabase SQL Editor

-- 1. Project Milestones Table
CREATE TABLE IF NOT EXISTS project_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID, -- Optional link to projects table
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

-- 2. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    project_id UUID,
    milestone_id UUID REFERENCES project_milestones(id) ON DELETE SET NULL,
    
    -- Client Info
    client_name TEXT NOT NULL,
    client_email TEXT,
    client_address TEXT,
    client_phone TEXT,
    
    -- Project Info
    project_name TEXT,
    
    -- Amounts
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Status & Dates
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled')),
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    paid_amount DECIMAL(12,2),
    payment_method TEXT,
    
    -- Payment Terms
    payment_terms TEXT DEFAULT 'Net 30',
    payment_terms_days INT DEFAULT 30,
    
    notes TEXT,
    internal_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, invoice_number)
);

-- 3. Invoice Line Items Table
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

-- 4. Invoice Counter (for auto-incrementing invoice numbers per user)
CREATE TABLE IF NOT EXISTS invoice_counters (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    current_number INT DEFAULT 0,
    prefix TEXT DEFAULT 'INV-',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Invoice Activity Log (for audit trail)
CREATE TABLE IF NOT EXISTS invoice_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'created', 'sent', 'viewed', 'paid', 'updated', 'cancelled'
    actor TEXT, -- user_id or 'system' or 'client'
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create indexes
CREATE INDEX IF NOT EXISTS idx_milestones_user_id ON project_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON project_milestones(status);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_milestone_id ON invoices(milestone_id);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_activity_invoice_id ON invoice_activity_log(invoice_id);

-- 7. Enable Row Level Security
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_activity_log ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for project_milestones
CREATE POLICY "Users can view own milestones" ON project_milestones
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own milestones" ON project_milestones
    FOR ALL USING (auth.uid() = user_id);

-- 9. RLS Policies for invoices
CREATE POLICY "Users can view own invoices" ON invoices
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own invoices" ON invoices
    FOR ALL USING (auth.uid() = user_id);

-- 10. RLS Policies for invoice_line_items
CREATE POLICY "Users can view own line items" ON invoice_line_items
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_line_items.invoice_id AND invoices.user_id = auth.uid())
    );
CREATE POLICY "Users can manage own line items" ON invoice_line_items
    FOR ALL USING (
        EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_line_items.invoice_id AND invoices.user_id = auth.uid())
    );

-- 11. RLS Policies for invoice_counters
CREATE POLICY "Users can view own counter" ON invoice_counters
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own counter" ON invoice_counters
    FOR ALL USING (auth.uid() = user_id);

-- 12. RLS Policies for invoice_activity_log
CREATE POLICY "Users can view own activity" ON invoice_activity_log
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_activity_log.invoice_id AND invoices.user_id = auth.uid())
    );
CREATE POLICY "Users can manage own activity" ON invoice_activity_log
    FOR ALL USING (
        EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_activity_log.invoice_id AND invoices.user_id = auth.uid())
    );

-- 13. Function to get next invoice number
CREATE OR REPLACE FUNCTION get_next_invoice_number(p_user_id UUID, p_prefix TEXT DEFAULT 'INV-')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_number INT;
    v_invoice_number TEXT;
BEGIN
    -- Insert or update the counter
    INSERT INTO invoice_counters (user_id, current_number, prefix, updated_at)
    VALUES (p_user_id, 1, p_prefix, NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET current_number = invoice_counters.current_number + 1,
        prefix = COALESCE(p_prefix, invoice_counters.prefix),
        updated_at = NOW()
    RETURNING current_number INTO v_number;
    
    -- Format the invoice number with leading zeros
    v_invoice_number := p_prefix || LPAD(v_number::TEXT, 4, '0');
    
    RETURN v_invoice_number;
END;
$$;

-- 14. Grant access to service role
GRANT ALL ON project_milestones TO service_role;
GRANT ALL ON invoices TO service_role;
GRANT ALL ON invoice_line_items TO service_role;
GRANT ALL ON invoice_counters TO service_role;
GRANT ALL ON invoice_activity_log TO service_role;
GRANT EXECUTE ON FUNCTION get_next_invoice_number TO service_role;

SELECT 'Invoicing & Milestones schema created successfully!' as status;
