-- ============================================================
-- PRODUCTION LIBRARY SCHEMA v1.0
-- TradeOS Company Knowledge Engine
-- ============================================================
-- 
-- This is the permanent foundation of the Company Knowledge Engine.
-- Based on existing operational estimating knowledge.
--
-- Four-Level Hierarchy:
-- Level 1: Knowledge Domain (Finish Carpentry, Doors & Hardware, etc.)
-- Level 2: Service Category (Residential, Commercial, etc.)
-- Level 3: Production Item (the knowledge records)
-- Level 4: Measurement Unit (EA, LF, SF, LS, DAY, HR, SET, KIT, PAIR, COST)
--
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- LEVEL 4: MEASUREMENT UNITS (Controlled Lookup)
-- ============================================================
-- Only these standardized units are supported in Version 1.
-- No free-text entries. No duplicates.

CREATE TABLE IF NOT EXISTS measurement_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert standard measurement units
INSERT INTO measurement_units (code, name, description, sort_order) VALUES
    ('EA', 'Each', 'Individual items counted one at a time', 1),
    ('LF', 'Linear Foot', 'Length measurement in feet', 2),
    ('SF', 'Square Foot', 'Area measurement in square feet', 3),
    ('LS', 'Lump Sum', 'Fixed price for complete scope', 4),
    ('DAY', 'Day', 'Daily rate or duration', 5),
    ('HR', 'Hour', 'Hourly rate or duration', 6),
    ('SET', 'Set', 'Complete set of items', 7),
    ('KIT', 'Kit', 'Pre-packaged kit of components', 8),
    ('PAIR', 'Pair', 'Two matching items', 9),
    ('COST', 'Cost', 'Direct cost passthrough', 10)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- LEVEL 1: KNOWLEDGE DOMAINS
-- ============================================================
-- Primary navigation categories throughout the Production Library.

CREATE TABLE IF NOT EXISTS knowledge_domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Identity
    code VARCHAR(20),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Display
    sort_order INTEGER DEFAULT 0,
    icon VARCHAR(50),
    color VARCHAR(20),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false,  -- System-provided domains
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    UNIQUE(organization_id, name)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_knowledge_domains_org ON knowledge_domains(organization_id) WHERE is_active = true;

-- ============================================================
-- LEVEL 2: SERVICE CATEGORIES
-- ============================================================
-- Where Production Items are commonly used.
-- One Production Item may support multiple Service Categories.

CREATE TABLE IF NOT EXISTS service_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Identity
    code VARCHAR(20),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Display
    sort_order INTEGER DEFAULT 0,
    icon VARCHAR(50),
    color VARCHAR(20),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    UNIQUE(organization_id, name)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_service_categories_org ON service_categories(organization_id) WHERE is_active = true;

-- ============================================================
-- LEVEL 3: PRODUCTION ITEMS
-- ============================================================
-- The permanent reusable knowledge records for the company.
-- This is the heart of the Company Knowledge Engine.

CREATE TABLE IF NOT EXISTS production_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Identity
    production_code VARCHAR(50) NOT NULL,
    production_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Classification
    knowledge_domain_id UUID NOT NULL REFERENCES knowledge_domains(id),
    
    -- Measurement (references controlled lookup)
    measurement_unit_id UUID NOT NULL REFERENCES measurement_units(id),
    
    -- Production Standards
    production_per_day DECIMAL(10,4),        -- Units produced per day
    crew_size DECIMAL(4,2) DEFAULT 1,        -- Number of workers
    labour_hours DECIMAL(10,4),              -- Hours per unit
    
    -- Pricing Tiers
    standard_rate DECIMAL(12,2),             -- Normal pricing
    premium_rate DECIMAL(12,2),              -- Premium/rush pricing
    complex_rate DECIMAL(12,2),              -- Complex conditions pricing
    
    -- Historical Intelligence (Company Brain learns from this)
    historical_average DECIMAL(12,2),        -- Calculated from actuals
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_company_standard BOOLEAN DEFAULT false,  -- Marked as company standard
    
    -- AI Metadata (Company Brain learning)
    ai_confidence_score DECIMAL(5,4) DEFAULT 0,  -- 0.0000 to 1.0000
    ai_last_trained_at TIMESTAMPTZ,
    ai_sample_count INTEGER DEFAULT 0,
    
    -- Revision Control
    version INTEGER DEFAULT 1,
    
    -- Notes
    notes TEXT,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    UNIQUE(organization_id, production_code)
);

-- Indexes for scale (250,000+ items)
CREATE INDEX IF NOT EXISTS idx_production_items_org ON production_items(organization_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_production_items_domain ON production_items(organization_id, knowledge_domain_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_production_items_code ON production_items(organization_id, production_code);
CREATE INDEX IF NOT EXISTS idx_production_items_name ON production_items(organization_id, production_name);
CREATE INDEX IF NOT EXISTS idx_production_items_ai ON production_items(organization_id, ai_confidence_score DESC) WHERE is_active = true;

-- ============================================================
-- PRODUCTION ITEM SERVICE CATEGORIES (Many-to-Many)
-- ============================================================
-- One Production Item may support multiple Service Categories.
-- Service Categories DO NOT create duplicate Production Items.

CREATE TABLE IF NOT EXISTS production_item_service_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_item_id UUID NOT NULL REFERENCES production_items(id) ON DELETE CASCADE,
    service_category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
    
    -- Optional overrides per service category
    rate_adjustment_pct DECIMAL(5,2) DEFAULT 0,  -- Percentage adjustment for this category
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(production_item_id, service_category_id)
);

CREATE INDEX IF NOT EXISTS idx_prod_item_svc_cat ON production_item_service_categories(production_item_id);
CREATE INDEX IF NOT EXISTS idx_svc_cat_prod_item ON production_item_service_categories(service_category_id);

-- ============================================================
-- PRODUCTION ITEM REVISIONS
-- ============================================================
-- Immutable audit trail of all changes.

CREATE TABLE IF NOT EXISTS production_item_revisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_item_id UUID NOT NULL REFERENCES production_items(id) ON DELETE CASCADE,
    
    -- Version
    version INTEGER NOT NULL,
    
    -- Snapshot
    snapshot JSONB NOT NULL,  -- Complete item state at this version
    
    -- Change metadata
    change_type VARCHAR(20) NOT NULL,  -- created, updated, pricing_change, deprecated
    change_reason TEXT,
    changed_fields TEXT[],
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    UNIQUE(production_item_id, version)
);

CREATE INDEX IF NOT EXISTS idx_revisions_item ON production_item_revisions(production_item_id, version DESC);

-- ============================================================
-- PRODUCTION ITEM ATTACHMENTS
-- ============================================================
-- Documents, photos, specs attached to items.

CREATE TABLE IF NOT EXISTS production_item_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_item_id UUID NOT NULL REFERENCES production_items(id) ON DELETE CASCADE,
    
    -- File info
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    file_url TEXT NOT NULL,
    
    -- Classification
    attachment_type VARCHAR(50) DEFAULT 'document',  -- document, photo, spec, drawing
    
    -- Display
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    
    -- Audit
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_attachments_item ON production_item_attachments(production_item_id);

-- ============================================================
-- PRODUCTION ASSEMBLIES
-- ============================================================
-- Assemblies consume Production Items.
-- Assemblies never duplicate Production Items.

CREATE TABLE IF NOT EXISTS production_assemblies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Identity
    assembly_code VARCHAR(50),
    assembly_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Classification
    knowledge_domain_id UUID REFERENCES knowledge_domains(id),
    
    -- Calculated Totals (denormalized for performance)
    total_labour_hours DECIMAL(12,2) DEFAULT 0,
    total_standard_cost DECIMAL(12,2) DEFAULT 0,
    total_premium_cost DECIMAL(12,2) DEFAULT 0,
    total_complex_cost DECIMAL(12,2) DEFAULT 0,
    item_count INTEGER DEFAULT 0,
    
    -- AI Metadata
    ai_confidence_score DECIMAL(5,4) DEFAULT 0,
    ai_sample_count INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_company_standard BOOLEAN DEFAULT false,
    
    -- Notes
    notes TEXT,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    UNIQUE(organization_id, assembly_code)
);

CREATE INDEX IF NOT EXISTS idx_assemblies_org ON production_assemblies(organization_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_assemblies_domain ON production_assemblies(organization_id, knowledge_domain_id);

-- ============================================================
-- ASSEMBLY ITEMS (Junction Table)
-- ============================================================
-- Each component references an existing Production Item.

CREATE TABLE IF NOT EXISTS assembly_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assembly_id UUID NOT NULL REFERENCES production_assemblies(id) ON DELETE CASCADE,
    production_item_id UUID NOT NULL REFERENCES production_items(id),
    
    -- Quantity
    quantity DECIMAL(12,4) NOT NULL DEFAULT 1,
    
    -- Optional overrides
    rate_override DECIMAL(12,2),  -- NULL = use production item rate
    
    -- Position
    sort_order INTEGER DEFAULT 0,
    group_name VARCHAR(100),  -- Optional grouping within assembly
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(assembly_id, production_item_id)
);

CREATE INDEX IF NOT EXISTS idx_assembly_items_assembly ON assembly_items(assembly_id);
CREATE INDEX IF NOT EXISTS idx_assembly_items_production ON assembly_items(production_item_id);

-- ============================================================
-- HISTORICAL PRODUCTION RECORDS
-- ============================================================
-- Immutable learning data for Company Brain.
-- Every completed project improves the Production Library.

CREATE TABLE IF NOT EXISTS historical_production_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Source Links
    project_id UUID,
    estimate_id UUID,
    production_item_id UUID REFERENCES production_items(id),
    
    -- Item Identification (snapshot - item may change)
    production_code VARCHAR(50) NOT NULL,
    production_name VARCHAR(255) NOT NULL,
    knowledge_domain_name VARCHAR(100),
    
    -- Estimated Values
    estimated_quantity DECIMAL(12,4),
    estimated_unit VARCHAR(20),
    estimated_rate DECIMAL(12,2),
    estimated_labour_hours DECIMAL(12,2),
    estimated_total DECIMAL(12,2),
    
    -- Actual Values
    actual_quantity DECIMAL(12,4),
    actual_rate DECIMAL(12,2),
    actual_labour_hours DECIMAL(12,2),
    actual_total DECIMAL(12,2),
    
    -- Calculated Variances
    quantity_variance DECIMAL(12,4),
    rate_variance DECIMAL(12,2),
    labour_variance DECIMAL(12,2),
    total_variance DECIMAL(12,2),
    variance_percentage DECIMAL(8,4),
    
    -- Context
    project_type VARCHAR(100),
    service_category VARCHAR(100),
    
    -- Dates
    work_completed_at DATE,
    
    -- AI Processing
    ai_processed BOOLEAN DEFAULT false,
    ai_processed_at TIMESTAMPTZ,
    ai_quality_score DECIMAL(5,4),
    
    -- Immutable Record
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    recorded_by UUID REFERENCES auth.users(id)
);

-- Indexes for AI queries at scale
CREATE INDEX IF NOT EXISTS idx_historical_org_item ON historical_production_records(organization_id, production_item_id);
CREATE INDEX IF NOT EXISTS idx_historical_dates ON historical_production_records(organization_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_historical_ai ON historical_production_records(organization_id) WHERE ai_processed = false;

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE knowledge_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_item_service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_item_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_item_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_assemblies ENABLE ROW LEVEL SECURITY;
ALTER TABLE assembly_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_production_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies (organization isolation)
CREATE POLICY knowledge_domains_org_policy ON knowledge_domains
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY service_categories_org_policy ON service_categories
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY production_items_org_policy ON production_items
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY production_item_service_categories_policy ON production_item_service_categories
    FOR ALL USING (
        production_item_id IN (
            SELECT id FROM production_items WHERE organization_id IN (
                SELECT organization_id FROM organization_members 
                WHERE user_id = auth.uid() AND is_active = true
            )
        )
    );

CREATE POLICY production_item_revisions_policy ON production_item_revisions
    FOR ALL USING (
        production_item_id IN (
            SELECT id FROM production_items WHERE organization_id IN (
                SELECT organization_id FROM organization_members 
                WHERE user_id = auth.uid() AND is_active = true
            )
        )
    );

CREATE POLICY production_item_attachments_policy ON production_item_attachments
    FOR ALL USING (
        production_item_id IN (
            SELECT id FROM production_items WHERE organization_id IN (
                SELECT organization_id FROM organization_members 
                WHERE user_id = auth.uid() AND is_active = true
            )
        )
    );

CREATE POLICY production_assemblies_org_policy ON production_assemblies
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY assembly_items_policy ON assembly_items
    FOR ALL USING (
        assembly_id IN (
            SELECT id FROM production_assemblies WHERE organization_id IN (
                SELECT organization_id FROM organization_members 
                WHERE user_id = auth.uid() AND is_active = true
            )
        )
    );

CREATE POLICY historical_production_records_org_policy ON historical_production_records
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function to update assembly totals when items change
CREATE OR REPLACE FUNCTION update_assembly_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE production_assemblies pa
    SET 
        item_count = (
            SELECT COUNT(*) FROM assembly_items ai WHERE ai.assembly_id = pa.id
        ),
        total_labour_hours = (
            SELECT COALESCE(SUM(ai.quantity * pi.labour_hours), 0)
            FROM assembly_items ai
            JOIN production_items pi ON pi.id = ai.production_item_id
            WHERE ai.assembly_id = pa.id
        ),
        total_standard_cost = (
            SELECT COALESCE(SUM(ai.quantity * COALESCE(ai.rate_override, pi.standard_rate)), 0)
            FROM assembly_items ai
            JOIN production_items pi ON pi.id = ai.production_item_id
            WHERE ai.assembly_id = pa.id
        ),
        total_premium_cost = (
            SELECT COALESCE(SUM(ai.quantity * pi.premium_rate), 0)
            FROM assembly_items ai
            JOIN production_items pi ON pi.id = ai.production_item_id
            WHERE ai.assembly_id = pa.id
        ),
        total_complex_cost = (
            SELECT COALESCE(SUM(ai.quantity * pi.complex_rate), 0)
            FROM assembly_items ai
            JOIN production_items pi ON pi.id = ai.production_item_id
            WHERE ai.assembly_id = pa.id
        ),
        updated_at = NOW()
    WHERE pa.id = COALESCE(NEW.assembly_id, OLD.assembly_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for assembly totals
DROP TRIGGER IF EXISTS assembly_items_update_totals ON assembly_items;
CREATE TRIGGER assembly_items_update_totals
    AFTER INSERT OR UPDATE OR DELETE ON assembly_items
    FOR EACH ROW EXECUTE FUNCTION update_assembly_totals();

-- Function to create revision on production item update
CREATE OR REPLACE FUNCTION create_production_item_revision()
RETURNS TRIGGER AS $$
DECLARE
    changed_fields TEXT[];
BEGIN
    -- Determine changed fields
    IF OLD.production_name != NEW.production_name THEN changed_fields := array_append(changed_fields, 'production_name'); END IF;
    IF OLD.standard_rate IS DISTINCT FROM NEW.standard_rate THEN changed_fields := array_append(changed_fields, 'standard_rate'); END IF;
    IF OLD.premium_rate IS DISTINCT FROM NEW.premium_rate THEN changed_fields := array_append(changed_fields, 'premium_rate'); END IF;
    IF OLD.complex_rate IS DISTINCT FROM NEW.complex_rate THEN changed_fields := array_append(changed_fields, 'complex_rate'); END IF;
    IF OLD.labour_hours IS DISTINCT FROM NEW.labour_hours THEN changed_fields := array_append(changed_fields, 'labour_hours'); END IF;
    IF OLD.production_per_day IS DISTINCT FROM NEW.production_per_day THEN changed_fields := array_append(changed_fields, 'production_per_day'); END IF;
    IF OLD.crew_size IS DISTINCT FROM NEW.crew_size THEN changed_fields := array_append(changed_fields, 'crew_size'); END IF;
    IF OLD.is_active IS DISTINCT FROM NEW.is_active THEN changed_fields := array_append(changed_fields, 'is_active'); END IF;
    
    -- Create revision if anything changed
    IF array_length(changed_fields, 1) > 0 THEN
        NEW.version := OLD.version + 1;
        NEW.updated_at := NOW();
        
        INSERT INTO production_item_revisions (
            production_item_id,
            version,
            snapshot,
            change_type,
            changed_fields,
            created_by
        ) VALUES (
            NEW.id,
            NEW.version,
            row_to_json(OLD)::jsonb,
            CASE 
                WHEN 'standard_rate' = ANY(changed_fields) OR 'premium_rate' = ANY(changed_fields) OR 'complex_rate' = ANY(changed_fields)
                THEN 'pricing_change'
                ELSE 'updated'
            END,
            changed_fields,
            NEW.updated_by
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for revisions
DROP TRIGGER IF EXISTS production_item_revision_trigger ON production_items;
CREATE TRIGGER production_item_revision_trigger
    BEFORE UPDATE ON production_items
    FOR EACH ROW EXECUTE FUNCTION create_production_item_revision();

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE production_items IS 'The atomic unit of company knowledge. Every estimate consumes these. Every project improves these.';
COMMENT ON TABLE production_assemblies IS 'Grouped production items. Assemblies consume items, never duplicate them.';
COMMENT ON TABLE historical_production_records IS 'Immutable learning data for Company Brain. Every completed project feeds this.';
COMMENT ON TABLE knowledge_domains IS 'Level 1 of hierarchy: Primary navigation categories (Finish Carpentry, Doors & Hardware, etc.)';
COMMENT ON TABLE service_categories IS 'Level 2 of hierarchy: Where items are used (Residential, Commercial, etc.)';
COMMENT ON TABLE measurement_units IS 'Level 4 of hierarchy: Controlled lookup table. Only 10 units in v1.';

COMMENT ON COLUMN production_items.ai_confidence_score IS 'Company Brain confidence in recommendations (0-1). Improves as historical data accumulates.';
COMMENT ON COLUMN production_items.historical_average IS 'Calculated from historical_production_records. The intelligence that improves over time.';
