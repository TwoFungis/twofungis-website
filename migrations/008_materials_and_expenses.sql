-- Migration: Add Materials Table and Enhanced Expenses
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. CREATE MATERIALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Materials',
    vendor TEXT,
    qty DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit TEXT DEFAULT 'ea',
    unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
    line_total DECIMAL(12,2) GENERATED ALWAYS AS (qty * unit_cost) STORED,
    tax_type TEXT DEFAULT 'None',
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_with_tax DECIMAL(12,2) GENERATED ALWAYS AS ((qty * unit_cost) + COALESCE(tax_amount, 0)) STORED,
    purchased_date DATE DEFAULT CURRENT_DATE,
    paid_status TEXT DEFAULT 'Unpaid',
    billable BOOLEAN DEFAULT false,
    markup_pct DECIMAL(5,2) DEFAULT 0,
    marked_up_total DECIMAL(12,2) GENERATED ALWAYS AS (
        CASE WHEN markup_pct > 0 
        THEN ((qty * unit_cost) + COALESCE(tax_amount, 0)) * (1 + markup_pct / 100)
        ELSE (qty * unit_cost) + COALESCE(tax_amount, 0)
        END
    ) STORED,
    receipt_document_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add constraint for valid categories
ALTER TABLE materials ADD CONSTRAINT materials_category_check 
CHECK (category IN ('Materials', 'Consumables', 'Tools', 'Equipment', 'Rental', 'Delivery'));

-- Add constraint for valid units
ALTER TABLE materials ADD CONSTRAINT materials_unit_check 
CHECK (unit IN ('ea', 'box', 'sheet', 'LF', 'SF', 'hours', 'days', 'gal', 'lb', 'other'));

-- Add constraint for valid tax types
ALTER TABLE materials ADD CONSTRAINT materials_tax_type_check 
CHECK (tax_type IN ('GST', 'PST', 'HST', 'Sales Tax', 'None'));

-- Add constraint for valid paid status
ALTER TABLE materials ADD CONSTRAINT materials_paid_status_check 
CHECK (paid_status IN ('Unpaid', 'Paid'));

-- Create indexes for faster queries
CREATE INDEX idx_materials_user_id ON materials(user_id);
CREATE INDEX idx_materials_project_id ON materials(project_id);
CREATE INDEX idx_materials_category ON materials(category);
CREATE INDEX idx_materials_purchased_date ON materials(purchased_date);

-- ============================================
-- 2. ENHANCE EXPENSES TABLE
-- ============================================
-- Add new columns to expenses table
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS deductibility_pct DECIMAL(5,2) DEFAULT 100;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS deductible_amount DECIMAL(12,2);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS business_personal TEXT DEFAULT 'Business';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- ============================================
-- 3. ROW LEVEL SECURITY
-- ============================================
-- Enable RLS on materials
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own materials
CREATE POLICY materials_select_policy ON materials
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own materials
CREATE POLICY materials_insert_policy ON materials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own materials
CREATE POLICY materials_update_policy ON materials
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own materials
CREATE POLICY materials_delete_policy ON materials
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 4. UPDATED_AT TRIGGER
-- ============================================
-- Create trigger function if not exists
CREATE OR REPLACE FUNCTION update_materials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language plpgsql;

-- Create trigger for materials
DROP TRIGGER IF EXISTS trigger_materials_updated_at ON materials;
CREATE TRIGGER trigger_materials_updated_at
    BEFORE UPDATE ON materials
    FOR EACH ROW
    EXECUTE FUNCTION update_materials_updated_at();

-- ============================================
-- 5. GRANT PERMISSIONS
-- ============================================
GRANT ALL ON materials TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
