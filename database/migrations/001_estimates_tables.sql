-- TRADEOS v1.1.2 - Estimates Tables Migration
-- =============================================
-- 
-- This migration creates the tables required for cross-device estimate sync.
-- Run this in your Supabase SQL Editor (supabase.com > SQL Editor > New Query)
--
-- Tables created:
--   1. estimates - Main estimate header with metadata
--   2. estimate_line_items - Individual line items with pricing snapshots
--
-- After running this migration, estimates will sync across all devices.

-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ESTIMATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.estimates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    created_by UUID NOT NULL,
    
    -- Basic Info
    name VARCHAR(255) NOT NULL DEFAULT 'New Estimate',
    estimate_number VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'archived')),
    
    -- Links
    opportunity_id UUID,
    client_id UUID,
    
    -- Legacy description field (for backwards compatibility)
    description TEXT,
    
    -- Pricing Configuration
    tax_rate DECIMAL(5,2) DEFAULT 5.00,
    markup_percent DECIMAL(5,2) DEFAULT 15.00,
    contingency_percent DECIMAL(5,2) DEFAULT 10.00,
    pricing_profile VARCHAR(20) DEFAULT 'Standard' CHECK (pricing_profile IN ('Low', 'Standard', 'Premium')),
    valid_until TIMESTAMP WITH TIME ZONE,
    
    -- Notes
    notes TEXT,
    clarifications TEXT,
    internal_notes TEXT,
    
    -- Extended Metadata (v1.1.2 Platform Parity)
    client_info JSONB,
    project_info JSONB,
    company_profile_snapshot JSONB,
    
    -- Calculated Totals (denormalized for performance)
    subtotal DECIMAL(12,2) DEFAULT 0,
    markup_amount DECIMAL(12,2) DEFAULT 0,
    contingency_amount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    item_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_estimates_org ON public.estimates(organization_id);
CREATE INDEX IF NOT EXISTS idx_estimates_created_by ON public.estimates(created_by);
CREATE INDEX IF NOT EXISTS idx_estimates_status ON public.estimates(status);
CREATE INDEX IF NOT EXISTS idx_estimates_number ON public.estimates(estimate_number);
CREATE INDEX IF NOT EXISTS idx_estimates_created_at ON public.estimates(created_at DESC);

-- =====================================================
-- ESTIMATE LINE ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.estimate_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estimate_id UUID NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
    
    -- Reference to production library
    standard_id UUID,
    domain_id UUID,
    domain_name VARCHAR(100),
    
    -- Pricing (captured at time of add)
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(12,2) DEFAULT 0,
    unit_price_override DECIMAL(12,2),  -- NULL means use calculated price
    line_total DECIMAL(12,2) DEFAULT 0,
    
    -- Notes
    notes TEXT,
    
    -- Ordering
    sort_order INTEGER DEFAULT 0,
    
    -- Pricing Snapshot (immutable record of pricing at add time)
    -- Contains: production_code, production_name, description, unit_of_measure,
    --           low_rate, standard_rate, premium_rate, complex_rate,
    --           labor_price, material_price, etc.
    snapshot JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_line_items_estimate ON public.estimate_line_items(estimate_id);
CREATE INDEX IF NOT EXISTS idx_line_items_standard ON public.estimate_line_items(standard_id);
CREATE INDEX IF NOT EXISTS idx_line_items_sort ON public.estimate_line_items(estimate_id, sort_order);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_line_items ENABLE ROW LEVEL SECURITY;

-- Estimates: Users can only access estimates in their organization
CREATE POLICY "Users can view estimates in their org"
    ON public.estimates FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can create estimates in their org"
    ON public.estimates FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update estimates in their org"
    ON public.estimates FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete estimates in their org"
    ON public.estimates FOR DELETE
    USING (organization_id IN (
        SELECT organization_id FROM public.users WHERE id = auth.uid()
    ));

-- Line Items: Users can access line items of estimates in their org
CREATE POLICY "Users can view line items of their estimates"
    ON public.estimate_line_items FOR SELECT
    USING (estimate_id IN (
        SELECT e.id FROM public.estimates e
        JOIN public.users u ON e.organization_id = u.organization_id
        WHERE u.id = auth.uid()
    ));

CREATE POLICY "Users can create line items for their estimates"
    ON public.estimate_line_items FOR INSERT
    WITH CHECK (estimate_id IN (
        SELECT e.id FROM public.estimates e
        JOIN public.users u ON e.organization_id = u.organization_id
        WHERE u.id = auth.uid()
    ));

CREATE POLICY "Users can update line items of their estimates"
    ON public.estimate_line_items FOR UPDATE
    USING (estimate_id IN (
        SELECT e.id FROM public.estimates e
        JOIN public.users u ON e.organization_id = u.organization_id
        WHERE u.id = auth.uid()
    ));

CREATE POLICY "Users can delete line items of their estimates"
    ON public.estimate_line_items FOR DELETE
    USING (estimate_id IN (
        SELECT e.id FROM public.estimates e
        JOIN public.users u ON e.organization_id = u.organization_id
        WHERE u.id = auth.uid()
    ));

-- =====================================================
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_estimates_updated_at
    BEFORE UPDATE ON public.estimates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ESTIMATE NUMBER SEQUENCE (Organization-scoped)
-- =====================================================
-- Note: The backend generates estimate numbers in format EST-YYYY-XXXX
-- This sequence can be used for a more traditional incremental approach

-- CREATE SEQUENCE IF NOT EXISTS estimate_number_seq START 1001;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the tables were created correctly:

-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'estimate%';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'estimates';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'estimate_line_items';
