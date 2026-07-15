-- TRADEOS v1.1.2 - Quote Table Extension Migration
-- =================================================
-- 
-- This migration extends the existing quotes table to support the
-- Estimate Workbench features (Platform Parity, Cross-Device Sync).
--
-- No new tables are created. All changes are additive to existing schema.
--
-- Run this in Supabase SQL Editor: supabase.com > SQL Editor > New Query

-- =====================================================
-- EXTEND QUOTES TABLE
-- =====================================================

-- Add organization_id for proper multi-tenant isolation
-- (Currently quotes only has user_id)
ALTER TABLE public.quotes 
    ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Add v1.1.2 Estimate Workbench fields
ALTER TABLE public.quotes 
    ADD COLUMN IF NOT EXISTS markup_percent DECIMAL(5,2) DEFAULT 15.00,
    ADD COLUMN IF NOT EXISTS contingency_percent DECIMAL(5,2) DEFAULT 10.00,
    ADD COLUMN IF NOT EXISTS pricing_profile VARCHAR(20) DEFAULT 'Standard',
    ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 5.00;

-- Add extended metadata columns (replaces storing in description JSON)
ALTER TABLE public.quotes 
    ADD COLUMN IF NOT EXISTS client_info JSONB,
    ADD COLUMN IF NOT EXISTS project_info JSONB,
    ADD COLUMN IF NOT EXISTS company_profile_snapshot JSONB,
    ADD COLUMN IF NOT EXISTS clarifications TEXT,
    ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- Add calculated totals for denormalized access
ALTER TABLE public.quotes 
    ADD COLUMN IF NOT EXISTS markup_amount DECIMAL(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS contingency_amount DECIMAL(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS item_count INTEGER DEFAULT 0;

-- Add updated_at timestamp if not exists
ALTER TABLE public.quotes 
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Constraint for pricing_profile values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'quotes_pricing_profile_check'
    ) THEN
        ALTER TABLE public.quotes 
            ADD CONSTRAINT quotes_pricing_profile_check 
            CHECK (pricing_profile IS NULL OR pricing_profile IN ('Low', 'Standard', 'Premium'));
    END IF;
END $$;

-- Backfill organization_id from user's primary organization
UPDATE public.quotes q
SET organization_id = (
    SELECT om.organization_id 
    FROM public.organization_members om 
    WHERE om.user_id = q.user_id 
    AND om.is_active = true
    ORDER BY om.is_primary DESC NULLS LAST
    LIMIT 1
)
WHERE q.organization_id IS NULL;

-- =====================================================
-- EXTEND QUOTE_LINE_ITEMS TABLE
-- =====================================================

-- Add domain reference for grouping
ALTER TABLE public.quote_line_items 
    ADD COLUMN IF NOT EXISTS domain_id UUID,
    ADD COLUMN IF NOT EXISTS domain_name VARCHAR(100);

-- Add production library reference
ALTER TABLE public.quote_line_items 
    ADD COLUMN IF NOT EXISTS standard_id UUID;

-- Add unit price override tracking
ALTER TABLE public.quote_line_items 
    ADD COLUMN IF NOT EXISTS unit_price_override DECIMAL(12,2);

-- Add pricing snapshot (immutable record of pricing at add time)
ALTER TABLE public.quote_line_items 
    ADD COLUMN IF NOT EXISTS snapshot JSONB;

-- Add created_at if not exists
ALTER TABLE public.quote_line_items 
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_quotes_org_id 
    ON public.quotes(organization_id);

CREATE INDEX IF NOT EXISTS idx_quotes_updated 
    ON public.quotes(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_quote_line_items_domain 
    ON public.quote_line_items(domain_id);

CREATE INDEX IF NOT EXISTS idx_quote_line_items_standard 
    ON public.quote_line_items(standard_id);

-- =====================================================
-- ROW LEVEL SECURITY POLICY UPDATES
-- =====================================================

-- Enable RLS if not already enabled
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_line_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Users can view own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can create own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can update own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can delete own quotes" ON public.quotes;

DROP POLICY IF EXISTS "quotes_org_select" ON public.quotes;
DROP POLICY IF EXISTS "quotes_org_insert" ON public.quotes;
DROP POLICY IF EXISTS "quotes_org_update" ON public.quotes;
DROP POLICY IF EXISTS "quotes_org_delete" ON public.quotes;

-- Create new organization-scoped policies
-- Note: Uses user_id directly OR organization_id through organization_members

CREATE POLICY "quotes_org_select" ON public.quotes
    FOR SELECT USING (
        user_id = auth.uid()
        OR organization_id IN (
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "quotes_org_insert" ON public.quotes
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        OR organization_id IN (
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "quotes_org_update" ON public.quotes
    FOR UPDATE USING (
        user_id = auth.uid()
        OR organization_id IN (
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "quotes_org_delete" ON public.quotes
    FOR DELETE USING (
        user_id = auth.uid()
        OR organization_id IN (
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Line items inherit quote access through foreign key
DROP POLICY IF EXISTS "Users can view own quote items" ON public.quote_line_items;
DROP POLICY IF EXISTS "Users can create own quote items" ON public.quote_line_items;
DROP POLICY IF EXISTS "Users can update own quote items" ON public.quote_line_items;
DROP POLICY IF EXISTS "Users can delete own quote items" ON public.quote_line_items;

DROP POLICY IF EXISTS "quote_items_inherit_access" ON public.quote_line_items;
DROP POLICY IF EXISTS "quote_items_inherit_insert" ON public.quote_line_items;
DROP POLICY IF EXISTS "quote_items_inherit_update" ON public.quote_line_items;
DROP POLICY IF EXISTS "quote_items_inherit_delete" ON public.quote_line_items;

CREATE POLICY "quote_items_inherit_access" ON public.quote_line_items
    FOR SELECT USING (
        quote_id IN (SELECT id FROM public.quotes WHERE 
            user_id = auth.uid() OR organization_id IN (
                SELECT organization_id FROM public.organization_members 
                WHERE user_id = auth.uid() AND is_active = true
            )
        )
    );

CREATE POLICY "quote_items_inherit_insert" ON public.quote_line_items
    FOR INSERT WITH CHECK (
        quote_id IN (SELECT id FROM public.quotes WHERE 
            user_id = auth.uid() OR organization_id IN (
                SELECT organization_id FROM public.organization_members 
                WHERE user_id = auth.uid() AND is_active = true
            )
        )
    );

CREATE POLICY "quote_items_inherit_update" ON public.quote_line_items
    FOR UPDATE USING (
        quote_id IN (SELECT id FROM public.quotes WHERE 
            user_id = auth.uid() OR organization_id IN (
                SELECT organization_id FROM public.organization_members 
                WHERE user_id = auth.uid() AND is_active = true
            )
        )
    );

CREATE POLICY "quote_items_inherit_delete" ON public.quote_line_items
    FOR DELETE USING (
        quote_id IN (SELECT id FROM public.quotes WHERE 
            user_id = auth.uid() OR organization_id IN (
                SELECT organization_id FROM public.organization_members 
                WHERE user_id = auth.uid() AND is_active = true
            )
        )
    );

-- =====================================================
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS quotes_updated_at_trigger ON public.quotes;
CREATE TRIGGER quotes_updated_at_trigger
    BEFORE UPDATE ON public.quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_quotes_updated_at();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the migration:
--
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'quotes' 
-- ORDER BY ordinal_position;
--
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'quote_line_items' 
-- ORDER BY ordinal_position;
--
-- SELECT policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('quotes', 'quote_line_items');
