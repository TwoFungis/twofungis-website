-- TradeOS Bookkeeping Schema
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. DOCUMENTS TABLE - Store uploaded files metadata
-- =====================================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  
  -- File info
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'receipt', 'invoice', 'quote', 'other'
  file_url TEXT NOT NULL,
  file_size INTEGER DEFAULT 0, -- in bytes
  mime_type TEXT,
  
  -- Metadata
  description TEXT,
  tags TEXT[],
  
  -- Timestamps
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_file_type ON documents(file_type);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_select" ON documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "documents_insert" ON documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "documents_update" ON documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "documents_delete" ON documents FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 2. EXPENSES TABLE - Extracted/manual expense entries
-- =====================================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  
  -- Vendor info
  vendor_name TEXT,
  vendor_address TEXT,
  
  -- Amount info
  subtotal NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  tax_type TEXT, -- 'HST', 'GST', 'PST', 'Sales Tax', 'VAT', 'None'
  tax_rate NUMERIC DEFAULT 0, -- percentage
  total_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'CAD',
  
  -- Categorization
  category TEXT NOT NULL DEFAULT 'Other', -- Materials, Labor, Equipment, Vehicle, Tools, Office, Subcontractors, Insurance, Professional Fees, Other
  is_deductible BOOLEAN DEFAULT true,
  
  -- Details
  description TEXT,
  receipt_date DATE,
  payment_method TEXT, -- 'Cash', 'Credit Card', 'Debit', 'Check', 'E-Transfer', 'Other'
  
  -- Line items (JSON array)
  line_items JSONB DEFAULT '[]',
  
  -- AI extraction metadata
  ai_extracted BOOLEAN DEFAULT false,
  ai_confidence NUMERIC DEFAULT 0, -- 0-100
  raw_ai_response JSONB,
  
  -- Fiscal tracking
  fiscal_year INTEGER,
  fiscal_quarter INTEGER,
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'disputed'
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_fiscal_year ON expenses(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_expenses_receipt_date ON expenses(receipt_date);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_select" ON expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "expenses_insert" ON expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "expenses_update" ON expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "expenses_delete" ON expenses FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. STORAGE USAGE TABLE - Track per-user storage
-- =====================================================
CREATE TABLE IF NOT EXISTS storage_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  bytes_used BIGINT DEFAULT 0,
  file_count INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE storage_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "storage_usage_select" ON storage_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "storage_usage_insert" ON storage_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "storage_usage_update" ON storage_usage FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 4. EXPENSE CATEGORIES VIEW
-- =====================================================
CREATE OR REPLACE VIEW expense_summary_by_category AS
SELECT 
  user_id,
  fiscal_year,
  category,
  COUNT(*) as expense_count,
  SUM(total_amount) as total_spent,
  SUM(tax_amount) as total_tax,
  SUM(CASE WHEN is_deductible THEN total_amount ELSE 0 END) as deductible_amount
FROM expenses
GROUP BY user_id, fiscal_year, category;

-- =====================================================
-- 5. HELPER FUNCTION - Get fiscal year from date
-- =====================================================
CREATE OR REPLACE FUNCTION get_fiscal_year(expense_date DATE)
RETURNS INTEGER AS $$
BEGIN
  -- Calendar year fiscal (Jan-Dec)
  RETURN EXTRACT(YEAR FROM expense_date)::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 6. HELPER FUNCTION - Get fiscal quarter from date
-- =====================================================
CREATE OR REPLACE FUNCTION get_fiscal_quarter(expense_date DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(QUARTER FROM expense_date)::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
