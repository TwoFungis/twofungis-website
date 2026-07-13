-- ============================================================
-- EXPANDED PRODUCTION LIBRARY SCHEMA v2.0
-- TradeOS Company Knowledge Engine - Six-Level Hierarchy
-- ============================================================
-- 
-- This migration expands the Production Library to support:
-- Knowledge Domain → Service Category → Area → Phase → Division → Production Item
--
-- Every Production Item now supports comprehensive fields for:
-- - Multiple pricing tiers (Low/Standard/Premium labour, Material, Equipment)
-- - Production metrics (Rate, Output, Crew Size)
-- - Cost tracking (Cost Code, Trade Discipline)
-- - Organizational metadata (Tags, Notes, Active/Archived)
--
-- ============================================================

-- ============================================================
-- LEVEL 3: AREAS (NEW)
-- ============================================================
-- Areas represent physical or logical sections of a project
-- Examples: Lobby, Corridors, Parking, Amenity Space, Suites

CREATE TABLE IF NOT EXISTS production_areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Hierarchy
    service_category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL,
    
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

CREATE INDEX IF NOT EXISTS idx_production_areas_org ON production_areas(organization_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_production_areas_category ON production_areas(organization_id, service_category_id);

-- ============================================================
-- LEVEL 4: PHASES (NEW)
-- ============================================================
-- Phases represent stages of work within an area
-- Examples: Framing, Rough-In, Finishing, Punchlist

CREATE TABLE IF NOT EXISTS production_phases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Hierarchy
    area_id UUID REFERENCES production_areas(id) ON DELETE SET NULL,
    
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

CREATE INDEX IF NOT EXISTS idx_production_phases_org ON production_phases(organization_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_production_phases_area ON production_phases(organization_id, area_id);

-- ============================================================
-- LEVEL 5: DIVISIONS (NEW)
-- ============================================================
-- Divisions represent CSI MasterFormat or custom trade categories
-- Examples: Division 06 - Wood & Plastics, Division 09 - Finishes

CREATE TABLE IF NOT EXISTS production_divisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Hierarchy
    phase_id UUID REFERENCES production_phases(id) ON DELETE SET NULL,
    
    -- Identity (CSI MasterFormat compatible)
    code VARCHAR(20),  -- e.g., "06", "0610", "061000"
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Display
    sort_order INTEGER DEFAULT 0,
    icon VARCHAR(50),
    color VARCHAR(20),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false,  -- System divisions (CSI standard)
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    UNIQUE(organization_id, code)
);

CREATE INDEX IF NOT EXISTS idx_production_divisions_org ON production_divisions(organization_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_production_divisions_phase ON production_divisions(organization_id, phase_id);

-- ============================================================
-- EXPANDED PRODUCTION ITEMS
-- ============================================================
-- Add new columns to existing production_items table

-- Trade Discipline
ALTER TABLE production_items ADD COLUMN IF NOT EXISTS trade_discipline VARCHAR(100);

-- Cost Code (links to accounting/job costing)
ALTER TABLE production_items ADD COLUMN IF NOT EXISTS cost_code VARCHAR(50);

-- Division reference (new hierarchy level)
ALTER TABLE production_items ADD COLUMN IF NOT EXISTS division_id UUID REFERENCES production_divisions(id) ON DELETE SET NULL;

-- Expanded Labour Rates
ALTER TABLE production_items ADD COLUMN IF NOT EXISTS low_labour_rate DECIMAL(12,2);
-- standard_rate already exists (use as standard_labour_rate)
ALTER TABLE production_items ADD COLUMN IF NOT EXISTS premium_labour_rate DECIMAL(12,2);
-- premium_rate already exists, we'll keep it for backwards compatibility

-- Material Rate
ALTER TABLE production_items ADD COLUMN IF NOT EXISTS material_rate DECIMAL(12,2);

-- Equipment Rate
ALTER TABLE production_items ADD COLUMN IF NOT EXISTS equipment_rate DECIMAL(12,2);

-- Production Output (different from production_per_day - this is per hour)
ALTER TABLE production_items ADD COLUMN IF NOT EXISTS production_output DECIMAL(10,4);

-- Tags (for flexible categorization)
ALTER TABLE production_items ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Archived status (soft delete with reason)
ALTER TABLE production_items ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE production_items ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES auth.users(id);
ALTER TABLE production_items ADD COLUMN IF NOT EXISTS archive_reason TEXT;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_production_items_division ON production_items(organization_id, division_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_production_items_trade ON production_items(organization_id, trade_discipline) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_production_items_cost_code ON production_items(organization_id, cost_code);
CREATE INDEX IF NOT EXISTS idx_production_items_tags ON production_items USING GIN(tags);

-- ============================================================
-- COST CODES TABLE (NEW)
-- ============================================================
-- Standardized cost codes for job costing integration

CREATE TABLE IF NOT EXISTS cost_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Identity
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Classification
    code_type VARCHAR(50) DEFAULT 'labour',  -- labour, material, equipment, subcontract, overhead
    division_id UUID REFERENCES production_divisions(id) ON DELETE SET NULL,
    
    -- GL Account mapping (for QuickBooks/accounting integration)
    gl_account VARCHAR(50),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    UNIQUE(organization_id, code)
);

CREATE INDEX IF NOT EXISTS idx_cost_codes_org ON cost_codes(organization_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_cost_codes_type ON cost_codes(organization_id, code_type);

-- ============================================================
-- TRADE DISCIPLINES TABLE (NEW)
-- ============================================================
-- Standardized trade classifications

CREATE TABLE IF NOT EXISTS trade_disciplines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Identity
    code VARCHAR(20),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Related Division (CSI mapping)
    division_id UUID REFERENCES production_divisions(id) ON DELETE SET NULL,
    
    -- Display
    sort_order INTEGER DEFAULT 0,
    icon VARCHAR(50),
    color VARCHAR(20),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    UNIQUE(organization_id, name)
);

CREATE INDEX IF NOT EXISTS idx_trade_disciplines_org ON trade_disciplines(organization_id) WHERE is_active = true;

-- ============================================================
-- ROW LEVEL SECURITY FOR NEW TABLES
-- ============================================================

ALTER TABLE production_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_disciplines ENABLE ROW LEVEL SECURITY;

CREATE POLICY production_areas_org_policy ON production_areas
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY production_phases_org_policy ON production_phases
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY production_divisions_org_policy ON production_divisions
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY cost_codes_org_policy ON cost_codes
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY trade_disciplines_org_policy ON trade_disciplines
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE production_areas IS 'Level 3: Physical/logical sections of a project (Lobby, Corridors, Suites)';
COMMENT ON TABLE production_phases IS 'Level 4: Stages of work within an area (Framing, Rough-In, Finishing)';
COMMENT ON TABLE production_divisions IS 'Level 5: CSI MasterFormat divisions (06-Wood & Plastics, 09-Finishes)';
COMMENT ON TABLE cost_codes IS 'Job costing codes for labour/material/equipment tracking';
COMMENT ON TABLE trade_disciplines IS 'Trade classifications for crew and subcontractor management';

COMMENT ON COLUMN production_items.low_labour_rate IS 'Economy labour rate per unit';
COMMENT ON COLUMN production_items.premium_labour_rate IS 'Premium/rush labour rate per unit';
COMMENT ON COLUMN production_items.material_rate IS 'Material cost per unit (optional)';
COMMENT ON COLUMN production_items.equipment_rate IS 'Equipment cost per unit (optional)';
COMMENT ON COLUMN production_items.production_output IS 'Units produced per hour (alternative to per_day)';
COMMENT ON COLUMN production_items.trade_discipline IS 'Primary trade responsible for this work';
COMMENT ON COLUMN production_items.cost_code IS 'Job costing code reference';
COMMENT ON COLUMN production_items.tags IS 'Flexible tagging for custom categorization';

-- ============================================================
-- SEED DEFAULT CSI DIVISIONS
-- ============================================================
-- These are industry-standard divisions that every organization can use

CREATE OR REPLACE FUNCTION seed_csi_divisions(org_id UUID, user_id UUID)
RETURNS void AS $$
BEGIN
    -- Only seed if no divisions exist for this org
    IF NOT EXISTS (SELECT 1 FROM production_divisions WHERE organization_id = org_id LIMIT 1) THEN
        INSERT INTO production_divisions (organization_id, code, name, description, is_system, sort_order, created_by) VALUES
            (org_id, '01', 'General Requirements', 'Summary, schedules, coordination, temporary facilities', true, 1, user_id),
            (org_id, '02', 'Existing Conditions', 'Subsurface investigation, demolition, remediation', true, 2, user_id),
            (org_id, '03', 'Concrete', 'Cast-in-place, precast, grouting', true, 3, user_id),
            (org_id, '04', 'Masonry', 'Unit masonry, stone, assemblies', true, 4, user_id),
            (org_id, '05', 'Metals', 'Structural steel, joists, decking, fabrications', true, 5, user_id),
            (org_id, '06', 'Wood & Plastics', 'Rough carpentry, finish carpentry, millwork', true, 6, user_id),
            (org_id, '07', 'Thermal & Moisture', 'Waterproofing, insulation, roofing, siding', true, 7, user_id),
            (org_id, '08', 'Openings', 'Doors, windows, hardware, glazing', true, 8, user_id),
            (org_id, '09', 'Finishes', 'Drywall, tile, flooring, painting', true, 9, user_id),
            (org_id, '10', 'Specialties', 'Signage, lockers, toilet accessories', true, 10, user_id),
            (org_id, '11', 'Equipment', 'Commercial equipment, appliances', true, 11, user_id),
            (org_id, '12', 'Furnishings', 'Window treatments, furniture, casework', true, 12, user_id),
            (org_id, '13', 'Special Construction', 'Pre-engineered structures, pools', true, 13, user_id),
            (org_id, '14', 'Conveying Equipment', 'Elevators, escalators, lifts', true, 14, user_id),
            (org_id, '21', 'Fire Suppression', 'Sprinkler systems, standpipes', true, 21, user_id),
            (org_id, '22', 'Plumbing', 'Plumbing fixtures, piping', true, 22, user_id),
            (org_id, '23', 'HVAC', 'Heating, ventilation, air conditioning', true, 23, user_id),
            (org_id, '26', 'Electrical', 'Power, lighting, communications', true, 26, user_id),
            (org_id, '27', 'Communications', 'Data, voice, audio-visual', true, 27, user_id),
            (org_id, '28', 'Electronic Safety', 'Fire detection, security, access control', true, 28, user_id),
            (org_id, '31', 'Earthwork', 'Grading, excavation, shoring', true, 31, user_id),
            (org_id, '32', 'Exterior Improvements', 'Paving, landscaping, site furnishings', true, 32, user_id),
            (org_id, '33', 'Utilities', 'Water, sanitary, storm, gas', true, 33, user_id)
        ON CONFLICT (organization_id, code) DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SEED DEFAULT TRADE DISCIPLINES
-- ============================================================

CREATE OR REPLACE FUNCTION seed_trade_disciplines(org_id UUID, user_id UUID)
RETURNS void AS $$
BEGIN
    -- Only seed if no disciplines exist for this org
    IF NOT EXISTS (SELECT 1 FROM trade_disciplines WHERE organization_id = org_id LIMIT 1) THEN
        INSERT INTO trade_disciplines (organization_id, code, name, description, sort_order, created_by) VALUES
            (org_id, 'CARP', 'Carpentry', 'Rough and finish carpentry, framing', 1, user_id),
            (org_id, 'MILL', 'Millwork', 'Custom millwork, cabinetry, architectural woodwork', 2, user_id),
            (org_id, 'DOOR', 'Doors & Hardware', 'Door installation, hardware, closers', 3, user_id),
            (org_id, 'DRYW', 'Drywall', 'Drywall installation, taping, finishing', 4, user_id),
            (org_id, 'TILE', 'Tile & Stone', 'Ceramic, porcelain, natural stone installation', 5, user_id),
            (org_id, 'FLOR', 'Flooring', 'Hardwood, vinyl, carpet, resilient flooring', 6, user_id),
            (org_id, 'PANT', 'Painting', 'Interior/exterior painting, staining, finishing', 7, user_id),
            (org_id, 'ELEC', 'Electrical', 'Electrical rough-in and finish', 8, user_id),
            (org_id, 'PLMB', 'Plumbing', 'Plumbing rough-in and finish', 9, user_id),
            (org_id, 'HVAC', 'HVAC', 'Heating, ventilation, air conditioning', 10, user_id),
            (org_id, 'INSL', 'Insulation', 'Thermal and acoustic insulation', 11, user_id),
            (org_id, 'GLAZ', 'Glazing', 'Windows, curtain wall, glass installation', 12, user_id),
            (org_id, 'ROOF', 'Roofing', 'Roofing, waterproofing, flashing', 13, user_id),
            (org_id, 'CONC', 'Concrete', 'Concrete forming, placing, finishing', 14, user_id),
            (org_id, 'MSNR', 'Masonry', 'Brick, block, stone masonry', 15, user_id),
            (org_id, 'STRU', 'Structural Steel', 'Steel erection, welding, connections', 16, user_id),
            (org_id, 'DEMO', 'Demolition', 'Selective and complete demolition', 17, user_id),
            (org_id, 'SITE', 'Site Work', 'Excavation, grading, paving', 18, user_id),
            (org_id, 'LABR', 'General Labour', 'General labour, cleanup, material handling', 19, user_id)
        ON CONFLICT (organization_id, name) DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SEED DEFAULT AREAS (Common project areas)
-- ============================================================

CREATE OR REPLACE FUNCTION seed_production_areas(org_id UUID, user_id UUID)
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM production_areas WHERE organization_id = org_id LIMIT 1) THEN
        INSERT INTO production_areas (organization_id, code, name, description, sort_order, created_by) VALUES
            (org_id, 'LOBBY', 'Lobby', 'Main entrance and reception areas', 1, user_id),
            (org_id, 'CORR', 'Corridors', 'Hallways and common circulation', 2, user_id),
            (org_id, 'AMEN', 'Amenity Space', 'Common amenity rooms and facilities', 3, user_id),
            (org_id, 'SUITE', 'Suites', 'Individual residential or office units', 4, user_id),
            (org_id, 'PARK', 'Parking', 'Underground and surface parking', 5, user_id),
            (org_id, 'ROOF', 'Rooftop', 'Roof deck and mechanical areas', 6, user_id),
            (org_id, 'MECH', 'Mechanical Room', 'Mechanical and electrical rooms', 7, user_id),
            (org_id, 'STAIR', 'Stairs', 'Stairwells and landings', 8, user_id),
            (org_id, 'ELEV', 'Elevator', 'Elevator lobbies and shafts', 9, user_id),
            (org_id, 'STOR', 'Storage', 'Storage rooms and lockers', 10, user_id),
            (org_id, 'SITE', 'Site', 'Exterior site work', 11, user_id),
            (org_id, 'GEN', 'General', 'General/unassigned areas', 99, user_id)
        ON CONFLICT (organization_id, name) DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SEED DEFAULT PHASES (Construction workflow stages)
-- ============================================================

CREATE OR REPLACE FUNCTION seed_production_phases(org_id UUID, user_id UUID)
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM production_phases WHERE organization_id = org_id LIMIT 1) THEN
        INSERT INTO production_phases (organization_id, code, name, description, sort_order, created_by) VALUES
            (org_id, 'PREP', 'Preparation', 'Site prep, layout, protection', 1, user_id),
            (org_id, 'DEMO', 'Demolition', 'Selective and complete demolition', 2, user_id),
            (org_id, 'FRAM', 'Framing', 'Wood and steel framing', 3, user_id),
            (org_id, 'RUGH', 'Rough-In', 'Mechanical, electrical, plumbing rough-in', 4, user_id),
            (org_id, 'INSL', 'Insulation', 'Thermal and acoustic insulation', 5, user_id),
            (org_id, 'DRYW', 'Drywall', 'Drywall installation and finishing', 6, user_id),
            (org_id, 'TRIM', 'Trim & Millwork', 'Doors, trim, millwork installation', 7, user_id),
            (org_id, 'TILE', 'Tile & Stone', 'Tile and stone installation', 8, user_id),
            (org_id, 'FLOR', 'Flooring', 'Flooring installation', 9, user_id),
            (org_id, 'PANT', 'Painting', 'Painting and finishing', 10, user_id),
            (org_id, 'FIXR', 'Fixtures', 'Fixture and accessory installation', 11, user_id),
            (org_id, 'PNCH', 'Punchlist', 'Deficiency corrections and touch-ups', 12, user_id),
            (org_id, 'CLEN', 'Cleaning', 'Construction and final cleaning', 13, user_id),
            (org_id, 'GEN', 'General', 'General/unassigned phases', 99, user_id)
        ON CONFLICT (organization_id, name) DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- UPDATE SEED ENDPOINT TO INCLUDE NEW HIERARCHY
-- ============================================================

CREATE OR REPLACE FUNCTION seed_production_library_v2(org_id UUID, user_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    domains_count INTEGER;
    categories_count INTEGER;
    areas_count INTEGER;
    phases_count INTEGER;
    divisions_count INTEGER;
    disciplines_count INTEGER;
BEGIN
    -- Seed all hierarchy levels
    PERFORM seed_csi_divisions(org_id, user_id);
    PERFORM seed_trade_disciplines(org_id, user_id);
    PERFORM seed_production_areas(org_id, user_id);
    PERFORM seed_production_phases(org_id, user_id);
    
    -- Count results
    SELECT COUNT(*) INTO domains_count FROM knowledge_domains WHERE organization_id = org_id;
    SELECT COUNT(*) INTO categories_count FROM service_categories WHERE organization_id = org_id;
    SELECT COUNT(*) INTO areas_count FROM production_areas WHERE organization_id = org_id;
    SELECT COUNT(*) INTO phases_count FROM production_phases WHERE organization_id = org_id;
    SELECT COUNT(*) INTO divisions_count FROM production_divisions WHERE organization_id = org_id;
    SELECT COUNT(*) INTO disciplines_count FROM trade_disciplines WHERE organization_id = org_id;
    
    result := jsonb_build_object(
        'success', true,
        'seeded', jsonb_build_object(
            'knowledge_domains', domains_count,
            'service_categories', categories_count,
            'production_areas', areas_count,
            'production_phases', phases_count,
            'production_divisions', divisions_count,
            'trade_disciplines', disciplines_count
        )
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
