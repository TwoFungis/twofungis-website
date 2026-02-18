-- TradeOS Expenses Table Schema
-- Run this in Supabase SQL Editor

-- Create or update expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    category TEXT DEFAULT 'other',
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    project_name TEXT,
    project_id UUID,
    expense_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    vendor TEXT,
    receipt_url TEXT,
    has_receipt BOOLEAN DEFAULT FALSE,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    is_tax_deductible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- If expenses table exists but has different columns, alter it:
DO $$
BEGIN
    -- Add expense_date if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'expense_date') THEN
        ALTER TABLE expenses ADD COLUMN expense_date DATE DEFAULT CURRENT_DATE;
    END IF;
    
    -- Add amount if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'amount') THEN
        ALTER TABLE expenses ADD COLUMN amount DECIMAL(12,2) DEFAULT 0;
    END IF;
    
    -- Add category if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'category') THEN
        ALTER TABLE expenses ADD COLUMN category TEXT DEFAULT 'other';
    END IF;
    
    -- Add description if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'description') THEN
        ALTER TABLE expenses ADD COLUMN description TEXT;
    END IF;
    
    -- Add project_name if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'project_name') THEN
        ALTER TABLE expenses ADD COLUMN project_name TEXT;
    END IF;
    
    -- Add project_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'project_id') THEN
        ALTER TABLE expenses ADD COLUMN project_id UUID;
    END IF;
    
    -- Add notes if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'notes') THEN
        ALTER TABLE expenses ADD COLUMN notes TEXT;
    END IF;
    
    -- Add vendor if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'vendor') THEN
        ALTER TABLE expenses ADD COLUMN vendor TEXT;
    END IF;
    
    -- Add receipt_url if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'receipt_url') THEN
        ALTER TABLE expenses ADD COLUMN receipt_url TEXT;
    END IF;
    
    -- Add has_receipt if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'has_receipt') THEN
        ALTER TABLE expenses ADD COLUMN has_receipt BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add tax_amount if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'tax_amount') THEN
        ALTER TABLE expenses ADD COLUMN tax_amount DECIMAL(12,2) DEFAULT 0;
    END IF;
    
    -- Add is_tax_deductible if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'is_tax_deductible') THEN
        ALTER TABLE expenses ADD COLUMN is_tax_deductible BOOLEAN DEFAULT TRUE;
    END IF;
    
    -- Add updated_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'updated_at') THEN
        ALTER TABLE expenses ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON expenses(project_id);

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can manage own expenses" ON expenses;

-- Create RLS policies
CREATE POLICY "Users can view own expenses" ON expenses
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own expenses" ON expenses
    FOR ALL USING (auth.uid() = user_id);

SELECT 'Expenses table schema complete!' as status;
