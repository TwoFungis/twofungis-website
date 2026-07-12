-- =====================================================
-- TRADEOS VERTICAL SLICE 1 - Opportunity Workspace Foundation
-- Version: 2.0.0
-- Date: July 12, 2026
-- =====================================================
--
-- ARCHITECTURAL PRINCIPLE (Per Constitution Article I):
-- The Opportunity is a WORKSPACE CONTAINER for work from discovery to project.
-- It is NOT a CRM record. It is a living workspace where contractors work.
--
-- WORKFLOW STAGES (These are workflow stages, not CRM stages):
--
--   DISCOVERED     → Initial opportunity identified
--   QUALIFYING     → Gathering info, drawings, contacts, site visits
--   TENDERING      → Active estimating, RFIs, takeoffs, pricing
--   SUBMITTED      → Proposal delivered to client
--   NEGOTIATION    → Clarifications, revisions, value engineering
--   AWARDED        → Contract accepted → converts to PROJECT
--   DECLINED       → We chose not to bid
--   LOST           → Another contractor was awarded
--   ARCHIVED       → Cancelled, duplicate, or inactive
--
-- WORKSPACE COMPONENTS (all live inside Opportunity Workspace):
--   • Overview
--   • Tender Workspace
--   • Documents
--   • Communications
--   • RFIs
--   • Site Notes
--   • Schedule
--   • Estimate
--   • Proposal
--   • Activity Timeline
--   • Company Brain
--
-- =====================================================

-- =====================================================
-- STEP 1: CREATE OPPORTUNITIES TABLE
-- =====================================================
-- The Opportunity Workspace is the PARENT CONTAINER.
-- Everything happens inside this workspace.

CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Organization Scope (REQUIRED per Spec 1.5)
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Basic Info
    name TEXT NOT NULL,
    description TEXT,
    reference_number TEXT,  -- Internal reference (e.g., "OPP-2026-001")
    
    -- WORKFLOW STATUS (not CRM status)
    status TEXT NOT NULL DEFAULT 'discovered',
    -- Valid: discovered, qualifying, tendering, submitted, negotiation, awarded, declined, lost, archived
    
    -- Client Relationship
    client_name TEXT,
    client_company TEXT,
    client_email TEXT,
    client_phone TEXT,
    client_id UUID,  -- Future: FK to clients table
    
    -- Primary Contact (may differ from client)
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    contact_role TEXT,  -- e.g., "Project Manager", "Owner", "Superintendent"
    
    -- Builder Relationship (if subcontracting to a GC)
    builder_name TEXT,
    builder_company TEXT,
    builder_email TEXT,
    builder_phone TEXT,
    builder_id UUID,  -- Future: FK to builders table
    
    -- Architect/Designer
    architect_name TEXT,
    architect_company TEXT,
    architect_email TEXT,
    architect_phone TEXT,
    
    -- Location
    site_address TEXT,
    site_city TEXT,
    site_province TEXT DEFAULT 'British Columbia',
    site_postal_code TEXT,
    site_country TEXT DEFAULT 'CA',
    site_notes TEXT,
    
    -- Classification
    project_type TEXT,      -- commercial, residential, industrial, institutional
    work_type TEXT,         -- new_construction, renovation, tenant_improvement, service, maintenance
    trade_category TEXT,    -- e.g., "Finishing", "Drywall", "Painting", "Framing"
    scope_summary TEXT,     -- Brief scope description
    
    -- Value & Confidence
    estimated_value DECIMAL(14,2),
    confidence_percent INTEGER DEFAULT 50,  -- Win probability
    priority TEXT DEFAULT 'medium',  -- low, medium, high, urgent
    
    -- Timeline
    tender_due_date TIMESTAMPTZ,
    tender_due_time TEXT,  -- e.g., "2:00 PM"
    site_visit_date TIMESTAMPTZ,
    decision_expected_date TIMESTAMPTZ,
    project_start_date TIMESTAMPTZ,
    project_end_date TIMESTAMPTZ,
    project_duration_days INTEGER,
    
    -- Source & Attribution
    lead_source TEXT,  -- referral, website, repeat_client, bid_service, cold_call, walk_in, trade_show
    referred_by TEXT,
    bid_invitation_date TIMESTAMPTZ,
    
    -- Assignment
    assigned_to UUID REFERENCES auth.users(id),
    assigned_estimator UUID REFERENCES auth.users(id),
    assigned_project_manager UUID REFERENCES auth.users(id),
    
    -- Bonding & Insurance Requirements
    bond_required BOOLEAN DEFAULT false,
    bond_type TEXT,  -- bid, performance, payment
    bond_amount DECIMAL(14,2),
    insurance_requirements TEXT,
    
    -- Outcome (populated when workflow reaches terminal state)
    outcome_reason TEXT,
    outcome_notes TEXT,
    outcome_date TIMESTAMPTZ,
    competitor_name TEXT,
    competitor_bid_amount DECIMAL(14,2),
    lessons_learned TEXT,
    
    -- Conversion
    converted_project_id UUID,  -- FK to projects table when awarded
    
    -- Tags for categorization
    tags TEXT[],
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- STEP 2: CREATE OPPORTUNITY_DOCUMENTS TABLE
-- =====================================================
-- Documents live inside the Opportunity Workspace

CREATE TABLE IF NOT EXISTS opportunity_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Parent
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Document Info
    name TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type TEXT,  -- pdf, dwg, xlsx, docx, jpg, png, etc.
    file_size INTEGER,  -- bytes
    
    -- Classification
    document_type TEXT NOT NULL,  -- drawing, specification, addendum, rfi, photo, contract, other
    version TEXT,
    revision_date DATE,
    
    -- Drawing-specific
    drawing_number TEXT,
    sheet_name TEXT,
    discipline TEXT,  -- architectural, structural, mechanical, electrical, civil
    
    -- Status
    is_current BOOLEAN DEFAULT true,
    superseded_by UUID REFERENCES opportunity_documents(id),
    
    -- Metadata
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 3: CREATE OPPORTUNITY_COMMUNICATIONS TABLE
-- =====================================================
-- All communications related to the opportunity

CREATE TABLE IF NOT EXISTS opportunity_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Parent
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Communication Type
    comm_type TEXT NOT NULL,  -- email, phone, meeting, site_visit, text, note
    direction TEXT,  -- inbound, outbound, internal
    
    -- Content
    subject TEXT,
    body TEXT,
    summary TEXT,  -- Brief summary of conversation
    
    -- Participants
    from_name TEXT,
    from_email TEXT,
    to_name TEXT,
    to_email TEXT,
    attendees TEXT[],  -- For meetings
    
    -- Related
    related_rfi_id UUID,
    related_document_id UUID,
    
    -- Action Items
    action_items JSONB DEFAULT '[]',
    follow_up_date TIMESTAMPTZ,
    
    -- Metadata
    comm_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    logged_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 4: CREATE OPPORTUNITY_RFIS TABLE
-- =====================================================
-- RFIs (Requests for Information) for the opportunity

CREATE TABLE IF NOT EXISTS opportunity_rfis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Parent
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- RFI Info
    rfi_number TEXT NOT NULL,  -- e.g., "RFI-001"
    subject TEXT NOT NULL,
    question TEXT NOT NULL,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'draft',  -- draft, submitted, answered, closed
    
    -- Dates
    submitted_date TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    answered_date TIMESTAMPTZ,
    
    -- Response
    answer TEXT,
    answered_by TEXT,
    impact_description TEXT,
    cost_impact DECIMAL(12,2),
    schedule_impact_days INTEGER,
    
    -- Related
    related_drawing TEXT,
    related_spec_section TEXT,
    
    -- Attachments stored in opportunity_documents with reference
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 5: CREATE OPPORTUNITY_SITE_NOTES TABLE
-- =====================================================
-- Site visit notes and observations

CREATE TABLE IF NOT EXISTS opportunity_site_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Parent
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Note Info
    title TEXT NOT NULL,
    visit_date TIMESTAMPTZ NOT NULL,
    notes TEXT NOT NULL,
    
    -- Conditions Observed
    conditions JSONB DEFAULT '{}',  -- weather, site_access, existing_conditions
    
    -- Attendees
    attendees TEXT[],
    
    -- Location within site
    location_area TEXT,
    
    -- Action Items
    action_items JSONB DEFAULT '[]',
    
    -- Photos stored in opportunity_documents with reference
    photo_ids UUID[],
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 6: CREATE TENDERS TABLE
-- =====================================================
-- A Tender is the estimate/quote within an Opportunity.
-- Supports versioning - nothing is ever overwritten.

CREATE TABLE IF NOT EXISTS tenders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Organization Scope
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Parent Opportunity
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    
    -- Version Control
    version_number INTEGER NOT NULL DEFAULT 1,
    is_current BOOLEAN DEFAULT true,
    parent_version_id UUID REFERENCES tenders(id),
    version_label TEXT,  -- e.g., "Initial", "Revised", "Final", "Alt 1"
    
    -- Status
    status TEXT NOT NULL DEFAULT 'draft',
    -- Valid: draft, review, submitted, superseded, accepted, rejected
    
    -- Totals (calculated from line items)
    subtotal DECIMAL(14,2) DEFAULT 0,
    
    -- Markup & Adjustments (organization defaults can be overridden)
    markup_type TEXT DEFAULT 'percent',  -- percent or fixed
    markup_percent DECIMAL(5,2) DEFAULT 0,
    markup_amount DECIMAL(14,2) DEFAULT 0,
    
    overhead_type TEXT DEFAULT 'percent',
    overhead_percent DECIMAL(5,2) DEFAULT 0,
    overhead_amount DECIMAL(14,2) DEFAULT 0,
    
    profit_type TEXT DEFAULT 'percent',
    profit_percent DECIMAL(5,2) DEFAULT 0,
    profit_amount DECIMAL(14,2) DEFAULT 0,
    
    contingency_type TEXT DEFAULT 'percent',
    contingency_percent DECIMAL(5,2) DEFAULT 0,
    contingency_amount DECIMAL(14,2) DEFAULT 0,
    
    discount_type TEXT DEFAULT 'percent',
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(14,2) DEFAULT 0,
    
    -- Tax
    tax_rate DECIMAL(5,2) DEFAULT 12.00,  -- BC GST+PST default
    tax_amount DECIMAL(14,2) DEFAULT 0,
    tax_included BOOLEAN DEFAULT false,
    
    -- Final Total
    total DECIMAL(14,2) DEFAULT 0,
    
    -- Validity
    valid_days INTEGER DEFAULT 30,
    valid_until DATE,
    
    -- Proposal Content
    scope_of_work TEXT,
    inclusions TEXT,
    exclusions TEXT,
    assumptions TEXT,
    clarifications TEXT,
    alternates TEXT,
    terms_and_conditions TEXT,
    payment_terms TEXT,
    warranty_terms TEXT,
    notes_to_client TEXT,
    internal_notes TEXT,
    
    -- Submission Tracking
    submitted_at TIMESTAMPTZ,
    submitted_by UUID REFERENCES auth.users(id),
    submitted_to TEXT,
    submission_method TEXT,  -- email, portal, hand_delivered, mail
    
    -- PDF
    pdf_url TEXT,
    pdf_generated_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- STEP 7: CREATE TENDER_SECTIONS TABLE
-- =====================================================
-- Sections organize line items within a tender.
-- Examples: "Drywall", "Painting", "Trim", "Labor", "Materials"

CREATE TABLE IF NOT EXISTS tender_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Parent Tender
    tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    
    -- Section Info
    name TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    
    -- Section Totals (calculated)
    labor_total DECIMAL(14,2) DEFAULT 0,
    material_total DECIMAL(14,2) DEFAULT 0,
    equipment_total DECIMAL(14,2) DEFAULT 0,
    subcontract_total DECIMAL(14,2) DEFAULT 0,
    other_total DECIMAL(14,2) DEFAULT 0,
    subtotal DECIMAL(14,2) DEFAULT 0,
    
    -- Display Options
    show_line_items BOOLEAN DEFAULT true,
    show_in_proposal BOOLEAN DEFAULT true,
    is_collapsed BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 8: CREATE TENDER_LINE_ITEMS TABLE
-- =====================================================
-- FULL ESTIMATE LINE ITEM STRUCTURE
-- Built to be the benchmark platform from day one.

CREATE TABLE IF NOT EXISTS tender_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Parent References
    tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    section_id UUID REFERENCES tender_sections(id) ON DELETE SET NULL,
    
    -- Position
    sort_order INTEGER DEFAULT 0,
    
    -- CORE FIELDS
    category TEXT,                -- Major category: "Drywall", "Paint", "Trim"
    scope TEXT,                   -- Scope area: "Level 1", "Unit A", "Main Floor"
    name TEXT NOT NULL,           -- Item name
    description TEXT,             -- Detailed description
    
    -- QUANTITY & UNIT
    quantity DECIMAL(14,4) DEFAULT 1,
    unit TEXT DEFAULT 'each',     -- each, sq ft, linear ft, hours, days, board, sheet, etc.
    
    -- LABOR
    labor_hours DECIMAL(10,2) DEFAULT 0,
    labor_rate DECIMAL(10,2) DEFAULT 0,
    labor_total DECIMAL(14,2) DEFAULT 0,
    labor_burden_percent DECIMAL(5,2) DEFAULT 0,  -- Benefits, taxes, insurance
    labor_burden_amount DECIMAL(14,2) DEFAULT 0,
    
    -- MATERIAL
    material_quantity DECIMAL(14,4) DEFAULT 0,
    material_unit TEXT,
    material_unit_cost DECIMAL(10,2) DEFAULT 0,
    material_total DECIMAL(14,2) DEFAULT 0,
    
    -- EQUIPMENT
    equipment_description TEXT,
    equipment_hours DECIMAL(10,2) DEFAULT 0,
    equipment_rate DECIMAL(10,2) DEFAULT 0,
    equipment_cost DECIMAL(14,2) DEFAULT 0,
    
    -- SUBCONTRACTOR
    subcontractor_name TEXT,
    subcontractor_scope TEXT,
    subcontractor_cost DECIMAL(14,2) DEFAULT 0,
    
    -- PRODUCTION RATE (ties to Production Library)
    production_rate DECIMAL(10,4),        -- Units per hour (e.g., 45 sq ft/hr)
    production_rate_unit TEXT,            -- e.g., "sq ft/hr", "linear ft/hr"
    production_source TEXT,               -- "library", "manual", "brain_suggested"
    
    -- CREW
    crew_size DECIMAL(4,2) DEFAULT 1,     -- Number of workers
    crew_composition TEXT,                -- e.g., "1 journeyman, 1 apprentice"
    
    -- DURATION (calculated or manual)
    duration_hours DECIMAL(10,2) DEFAULT 0,
    duration_days DECIMAL(10,2) DEFAULT 0,
    
    -- WASTE
    waste_percent DECIMAL(5,2) DEFAULT 0,
    waste_amount DECIMAL(14,2) DEFAULT 0,
    
    -- MARKUP (line-item level)
    markup_percent DECIMAL(5,2) DEFAULT 0,
    markup_amount DECIMAL(14,2) DEFAULT 0,
    
    -- OVERHEAD (line-item level)
    overhead_percent DECIMAL(5,2) DEFAULT 0,
    overhead_amount DECIMAL(14,2) DEFAULT 0,
    
    -- PROFIT (line-item level)
    profit_percent DECIMAL(5,2) DEFAULT 0,
    profit_amount DECIMAL(14,2) DEFAULT 0,
    
    -- CONTINGENCY (line-item level)
    contingency_percent DECIMAL(5,2) DEFAULT 0,
    contingency_amount DECIMAL(14,2) DEFAULT 0,
    
    -- TAX
    tax_percent DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(14,2) DEFAULT 0,
    is_taxable BOOLEAN DEFAULT true,
    
    -- CALCULATED TOTALS
    cost_total DECIMAL(14,2) DEFAULT 0,   -- Labor + Material + Equipment + Sub + Other
    unit_cost DECIMAL(14,2) DEFAULT 0,    -- Cost per unit
    unit_price DECIMAL(14,2) DEFAULT 0,   -- Price per unit (with markup)
    line_total DECIMAL(14,2) DEFAULT 0,   -- Final line total
    
    -- NOTES & ATTACHMENTS
    notes TEXT,
    internal_notes TEXT,
    attachments TEXT[],  -- URLs to attached files
    
    -- PRODUCTION LIBRARY REFERENCE
    production_item_id UUID,              -- FK to production_library when built
    
    -- COMPANY BRAIN REFERENCE
    brain_suggestion_id UUID,             -- FK to brain suggestions when applicable
    brain_confidence_score DECIMAL(3,2),  -- 0.00 to 1.00
    
    -- DISPLAY OPTIONS
    is_optional BOOLEAN DEFAULT false,
    is_included BOOLEAN DEFAULT true,
    is_alternate BOOLEAN DEFAULT false,
    alternate_group TEXT,                 -- Groups alternates together
    show_quantity BOOLEAN DEFAULT true,
    show_unit_price BOOLEAN DEFAULT true,
    show_in_proposal BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 9: CREATE TENDER_VERSIONS TABLE
-- =====================================================
-- Immutable record of every submitted tender version.
-- When a tender is submitted, a snapshot is saved here.

CREATE TABLE IF NOT EXISTS tender_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Parent Tender
    tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    
    -- Version Info
    version_number INTEGER NOT NULL,
    version_label TEXT,
    
    -- Snapshot of totals at submission time
    subtotal DECIMAL(14,2),
    markup_amount DECIMAL(14,2),
    overhead_amount DECIMAL(14,2),
    profit_amount DECIMAL(14,2),
    contingency_amount DECIMAL(14,2),
    discount_amount DECIMAL(14,2),
    tax_amount DECIMAL(14,2),
    total DECIMAL(14,2),
    
    -- Full snapshot (JSON for immutability)
    line_items_snapshot JSONB,
    sections_snapshot JSONB,
    
    -- Proposal content snapshot
    scope_of_work TEXT,
    inclusions TEXT,
    exclusions TEXT,
    assumptions TEXT,
    terms_and_conditions TEXT,
    
    -- PDF
    pdf_url TEXT,
    
    -- Submission details
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_by UUID REFERENCES auth.users(id),
    submitted_to TEXT,
    submission_method TEXT,
    
    -- Outcome (for this specific version)
    outcome TEXT,  -- accepted, rejected, superseded, no_response
    outcome_date TIMESTAMPTZ,
    outcome_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 10: CREATE OPPORTUNITY_ACTIVITY TABLE
-- =====================================================
-- Complete audit trail for Opportunity workspace.

CREATE TABLE IF NOT EXISTS opportunity_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Parent Opportunity
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    
    -- Organization Scope
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Event Type
    event_type TEXT NOT NULL,
    -- Types: created, updated, status_changed, tender_created, tender_updated,
    --        tender_submitted, document_added, rfi_submitted, rfi_answered,
    --        site_visit, communication_logged, note_added, assigned, 
    --        won, lost, declined, archived, converted_to_project
    
    -- Event Details
    event_title TEXT NOT NULL,
    event_description TEXT,
    event_data JSONB DEFAULT '{}',
    
    -- Related Objects
    tender_id UUID REFERENCES tenders(id) ON DELETE SET NULL,
    document_id UUID REFERENCES opportunity_documents(id) ON DELETE SET NULL,
    rfi_id UUID REFERENCES opportunity_rfis(id) ON DELETE SET NULL,
    
    -- Actor
    performed_by UUID REFERENCES auth.users(id),
    performed_by_name TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 11: CREATE INDEXES
-- =====================================================

-- Opportunities
CREATE INDEX IF NOT EXISTS idx_opportunities_org_id ON opportunities(organization_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_opportunities_assigned ON opportunities(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_opportunities_estimator ON opportunities(assigned_estimator) WHERE assigned_estimator IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_opportunities_due_date ON opportunities(organization_id, tender_due_date) WHERE tender_due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_opportunities_client ON opportunities(organization_id, client_company);
CREATE INDEX IF NOT EXISTS idx_opportunities_created ON opportunities(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_priority ON opportunities(organization_id, priority, status);
CREATE INDEX IF NOT EXISTS idx_opportunities_tags ON opportunities USING gin(tags);

-- Documents
CREATE INDEX IF NOT EXISTS idx_opp_docs_opportunity ON opportunity_documents(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opp_docs_type ON opportunity_documents(opportunity_id, document_type);

-- Communications
CREATE INDEX IF NOT EXISTS idx_opp_comms_opportunity ON opportunity_communications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opp_comms_date ON opportunity_communications(opportunity_id, comm_date DESC);

-- RFIs
CREATE INDEX IF NOT EXISTS idx_opp_rfis_opportunity ON opportunity_rfis(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opp_rfis_status ON opportunity_rfis(opportunity_id, status);

-- Site Notes
CREATE INDEX IF NOT EXISTS idx_opp_site_notes_opportunity ON opportunity_site_notes(opportunity_id);

-- Tenders
CREATE INDEX IF NOT EXISTS idx_tenders_org_id ON tenders(organization_id);
CREATE INDEX IF NOT EXISTS idx_tenders_opportunity ON tenders(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_tenders_current ON tenders(opportunity_id, is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_tenders_status ON tenders(organization_id, status);

-- Tender Sections
CREATE INDEX IF NOT EXISTS idx_tender_sections_tender ON tender_sections(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_sections_order ON tender_sections(tender_id, sort_order);

-- Tender Line Items
CREATE INDEX IF NOT EXISTS idx_tender_items_tender ON tender_line_items(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_items_section ON tender_line_items(section_id) WHERE section_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tender_items_order ON tender_line_items(tender_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_tender_items_category ON tender_line_items(tender_id, category);
CREATE INDEX IF NOT EXISTS idx_tender_items_production ON tender_line_items(production_item_id) WHERE production_item_id IS NOT NULL;

-- Tender Versions
CREATE INDEX IF NOT EXISTS idx_tender_versions_tender ON tender_versions(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_versions_submitted ON tender_versions(tender_id, submitted_at DESC);

-- Activity
CREATE INDEX IF NOT EXISTS idx_opp_activity_opp ON opportunity_activity(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opp_activity_org ON opportunity_activity(organization_id);
CREATE INDEX IF NOT EXISTS idx_opp_activity_created ON opportunity_activity(opportunity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opp_activity_type ON opportunity_activity(opportunity_id, event_type);

-- =====================================================
-- STEP 12: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_rfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_site_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_activity ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 13: CREATE RLS POLICIES
-- =====================================================

-- Opportunities: Organization-scoped access
DROP POLICY IF EXISTS "Users view own org opportunities" ON opportunities;
CREATE POLICY "Users view own org opportunities" ON opportunities
    FOR SELECT USING (
        organization_id = ANY(get_user_organization_ids(auth.uid()))
        OR is_platform_admin(auth.uid())
    );

DROP POLICY IF EXISTS "Service role full access to opportunities" ON opportunities;
CREATE POLICY "Service role full access to opportunities" ON opportunities
    FOR ALL USING (true) WITH CHECK (true);

-- Documents: Organization-scoped access
DROP POLICY IF EXISTS "Users view own org documents" ON opportunity_documents;
CREATE POLICY "Users view own org documents" ON opportunity_documents
    FOR SELECT USING (
        organization_id = ANY(get_user_organization_ids(auth.uid()))
        OR is_platform_admin(auth.uid())
    );

DROP POLICY IF EXISTS "Service role full access to opportunity documents" ON opportunity_documents;
CREATE POLICY "Service role full access to opportunity documents" ON opportunity_documents
    FOR ALL USING (true) WITH CHECK (true);

-- Communications: Organization-scoped access
DROP POLICY IF EXISTS "Users view own org communications" ON opportunity_communications;
CREATE POLICY "Users view own org communications" ON opportunity_communications
    FOR SELECT USING (
        organization_id = ANY(get_user_organization_ids(auth.uid()))
        OR is_platform_admin(auth.uid())
    );

DROP POLICY IF EXISTS "Service role full access to opportunity communications" ON opportunity_communications;
CREATE POLICY "Service role full access to opportunity communications" ON opportunity_communications
    FOR ALL USING (true) WITH CHECK (true);

-- RFIs: Organization-scoped access
DROP POLICY IF EXISTS "Users view own org rfis" ON opportunity_rfis;
CREATE POLICY "Users view own org rfis" ON opportunity_rfis
    FOR SELECT USING (
        organization_id = ANY(get_user_organization_ids(auth.uid()))
        OR is_platform_admin(auth.uid())
    );

DROP POLICY IF EXISTS "Service role full access to opportunity rfis" ON opportunity_rfis;
CREATE POLICY "Service role full access to opportunity rfis" ON opportunity_rfis
    FOR ALL USING (true) WITH CHECK (true);

-- Site Notes: Organization-scoped access
DROP POLICY IF EXISTS "Users view own org site notes" ON opportunity_site_notes;
CREATE POLICY "Users view own org site notes" ON opportunity_site_notes
    FOR SELECT USING (
        organization_id = ANY(get_user_organization_ids(auth.uid()))
        OR is_platform_admin(auth.uid())
    );

DROP POLICY IF EXISTS "Service role full access to opportunity site notes" ON opportunity_site_notes;
CREATE POLICY "Service role full access to opportunity site notes" ON opportunity_site_notes
    FOR ALL USING (true) WITH CHECK (true);

-- Tenders: Organization-scoped access
DROP POLICY IF EXISTS "Users view own org tenders" ON tenders;
CREATE POLICY "Users view own org tenders" ON tenders
    FOR SELECT USING (
        organization_id = ANY(get_user_organization_ids(auth.uid()))
        OR is_platform_admin(auth.uid())
    );

DROP POLICY IF EXISTS "Service role full access to tenders" ON tenders;
CREATE POLICY "Service role full access to tenders" ON tenders
    FOR ALL USING (true) WITH CHECK (true);

-- Tender Sections: Access via parent tender
DROP POLICY IF EXISTS "Users view tender sections" ON tender_sections;
CREATE POLICY "Users view tender sections" ON tender_sections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tenders t 
            WHERE t.id = tender_sections.tender_id 
            AND t.organization_id = ANY(get_user_organization_ids(auth.uid()))
        )
        OR is_platform_admin(auth.uid())
    );

DROP POLICY IF EXISTS "Service role full access to tender sections" ON tender_sections;
CREATE POLICY "Service role full access to tender sections" ON tender_sections
    FOR ALL USING (true) WITH CHECK (true);

-- Tender Line Items: Access via parent tender
DROP POLICY IF EXISTS "Users view tender line items" ON tender_line_items;
CREATE POLICY "Users view tender line items" ON tender_line_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tenders t 
            WHERE t.id = tender_line_items.tender_id 
            AND t.organization_id = ANY(get_user_organization_ids(auth.uid()))
        )
        OR is_platform_admin(auth.uid())
    );

DROP POLICY IF EXISTS "Service role full access to tender line items" ON tender_line_items;
CREATE POLICY "Service role full access to tender line items" ON tender_line_items
    FOR ALL USING (true) WITH CHECK (true);

-- Tender Versions: Access via parent tender
DROP POLICY IF EXISTS "Users view tender versions" ON tender_versions;
CREATE POLICY "Users view tender versions" ON tender_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tenders t 
            WHERE t.id = tender_versions.tender_id 
            AND t.organization_id = ANY(get_user_organization_ids(auth.uid()))
        )
        OR is_platform_admin(auth.uid())
    );

DROP POLICY IF EXISTS "Service role full access to tender versions" ON tender_versions;
CREATE POLICY "Service role full access to tender versions" ON tender_versions
    FOR ALL USING (true) WITH CHECK (true);

-- Opportunity Activity: Organization-scoped access
DROP POLICY IF EXISTS "Users view own org activity" ON opportunity_activity;
CREATE POLICY "Users view own org activity" ON opportunity_activity
    FOR SELECT USING (
        organization_id = ANY(get_user_organization_ids(auth.uid()))
        OR is_platform_admin(auth.uid())
    );

DROP POLICY IF EXISTS "Service role full access to opportunity activity" ON opportunity_activity;
CREATE POLICY "Service role full access to opportunity activity" ON opportunity_activity
    FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- STEP 14: GRANTS
-- =====================================================

GRANT ALL ON opportunities TO service_role;
GRANT ALL ON opportunity_documents TO service_role;
GRANT ALL ON opportunity_communications TO service_role;
GRANT ALL ON opportunity_rfis TO service_role;
GRANT ALL ON opportunity_site_notes TO service_role;
GRANT ALL ON tenders TO service_role;
GRANT ALL ON tender_sections TO service_role;
GRANT ALL ON tender_line_items TO service_role;
GRANT ALL ON tender_versions TO service_role;
GRANT ALL ON opportunity_activity TO service_role;

GRANT SELECT ON opportunities TO authenticated;
GRANT SELECT ON opportunity_documents TO authenticated;
GRANT SELECT ON opportunity_communications TO authenticated;
GRANT SELECT ON opportunity_rfis TO authenticated;
GRANT SELECT ON opportunity_site_notes TO authenticated;
GRANT SELECT ON tenders TO authenticated;
GRANT SELECT ON tender_sections TO authenticated;
GRANT SELECT ON tender_line_items TO authenticated;
GRANT SELECT ON tender_versions TO authenticated;
GRANT SELECT ON opportunity_activity TO authenticated;

-- =====================================================
-- STEP 15: HELPER FUNCTIONS
-- =====================================================

-- Generate opportunity reference number
DROP FUNCTION IF EXISTS generate_opportunity_reference(UUID);
CREATE OR REPLACE FUNCTION generate_opportunity_reference(org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    year_part TEXT;
    sequence_num INTEGER;
    ref_number TEXT;
BEGIN
    year_part := to_char(NOW(), 'YYYY');
    
    SELECT COALESCE(MAX(
        CASE 
            WHEN reference_number ~ ('^OPP-' || year_part || '-[0-9]+$')
            THEN CAST(substring(reference_number from '[0-9]+$') AS INTEGER)
            ELSE 0
        END
    ), 0) + 1
    INTO sequence_num
    FROM opportunities
    WHERE organization_id = org_id;
    
    ref_number := 'OPP-' || year_part || '-' || LPAD(sequence_num::TEXT, 3, '0');
    RETURN ref_number;
END;
$$;

GRANT EXECUTE ON FUNCTION generate_opportunity_reference TO service_role;

-- Generate RFI number
DROP FUNCTION IF EXISTS generate_rfi_number(UUID);
CREATE OR REPLACE FUNCTION generate_rfi_number(opp_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sequence_num INTEGER;
    ref_number TEXT;
BEGIN
    SELECT COALESCE(MAX(
        CASE 
            WHEN rfi_number ~ ('^RFI-[0-9]+$')
            THEN CAST(substring(rfi_number from '[0-9]+$') AS INTEGER)
            ELSE 0
        END
    ), 0) + 1
    INTO sequence_num
    FROM opportunity_rfis
    WHERE opportunity_id = opp_id;
    
    ref_number := 'RFI-' || LPAD(sequence_num::TEXT, 3, '0');
    RETURN ref_number;
END;
$$;

GRANT EXECUTE ON FUNCTION generate_rfi_number TO service_role;

-- Calculate tender totals from line items
DROP FUNCTION IF EXISTS calculate_tender_totals(UUID);
CREATE OR REPLACE FUNCTION calculate_tender_totals(tender_uuid UUID)
RETURNS TABLE(
    calc_subtotal DECIMAL(14,2),
    calc_markup DECIMAL(14,2),
    calc_overhead DECIMAL(14,2),
    calc_profit DECIMAL(14,2),
    calc_contingency DECIMAL(14,2),
    calc_discount DECIMAL(14,2),
    calc_tax DECIMAL(14,2),
    calc_total DECIMAL(14,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    t RECORD;
    subtotal_val DECIMAL(14,2);
    pretax_total DECIMAL(14,2);
BEGIN
    -- Get tender settings
    SELECT * INTO t FROM tenders WHERE id = tender_uuid;
    
    IF t IS NULL THEN
        RETURN;
    END IF;
    
    -- Calculate subtotal from included line items
    SELECT COALESCE(SUM(line_total), 0)
    INTO subtotal_val
    FROM tender_line_items
    WHERE tender_id = tender_uuid AND is_included = true;
    
    calc_subtotal := subtotal_val;
    
    -- Calculate markup
    IF t.markup_type = 'percent' THEN
        calc_markup := ROUND(subtotal_val * (t.markup_percent / 100), 2);
    ELSE
        calc_markup := COALESCE(t.markup_amount, 0);
    END IF;
    
    -- Calculate overhead
    IF t.overhead_type = 'percent' THEN
        calc_overhead := ROUND(subtotal_val * (t.overhead_percent / 100), 2);
    ELSE
        calc_overhead := COALESCE(t.overhead_amount, 0);
    END IF;
    
    -- Calculate profit
    IF t.profit_type = 'percent' THEN
        calc_profit := ROUND(subtotal_val * (t.profit_percent / 100), 2);
    ELSE
        calc_profit := COALESCE(t.profit_amount, 0);
    END IF;
    
    -- Calculate contingency
    IF t.contingency_type = 'percent' THEN
        calc_contingency := ROUND(subtotal_val * (t.contingency_percent / 100), 2);
    ELSE
        calc_contingency := COALESCE(t.contingency_amount, 0);
    END IF;
    
    -- Calculate discount
    IF t.discount_type = 'percent' THEN
        calc_discount := ROUND(subtotal_val * (t.discount_percent / 100), 2);
    ELSE
        calc_discount := COALESCE(t.discount_amount, 0);
    END IF;
    
    -- Pre-tax total
    pretax_total := subtotal_val + calc_markup + calc_overhead + calc_profit + calc_contingency - calc_discount;
    
    -- Calculate tax
    IF NOT t.tax_included THEN
        calc_tax := ROUND(pretax_total * (t.tax_rate / 100), 2);
    ELSE
        calc_tax := 0;
    END IF;
    
    -- Final total
    calc_total := pretax_total + calc_tax;
    
    RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION calculate_tender_totals TO service_role;

-- Calculate line item totals
DROP FUNCTION IF EXISTS calculate_line_item_totals(UUID);
CREATE OR REPLACE FUNCTION calculate_line_item_totals(item_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item RECORD;
    labor_total DECIMAL(14,2);
    material_total DECIMAL(14,2);
    cost_total DECIMAL(14,2);
    waste_amount DECIMAL(14,2);
    markup_amount DECIMAL(14,2);
    overhead_amount DECIMAL(14,2);
    profit_amount DECIMAL(14,2);
    contingency_amount DECIMAL(14,2);
    line_total DECIMAL(14,2);
BEGIN
    SELECT * INTO item FROM tender_line_items WHERE id = item_uuid;
    
    IF item IS NULL THEN
        RETURN;
    END IF;
    
    -- Labor total
    labor_total := COALESCE(item.labor_hours, 0) * COALESCE(item.labor_rate, 0);
    
    -- Material total
    material_total := COALESCE(item.material_quantity, 0) * COALESCE(item.material_unit_cost, 0);
    
    -- Base cost
    cost_total := labor_total + material_total + 
                  COALESCE(item.equipment_cost, 0) + 
                  COALESCE(item.subcontractor_cost, 0);
    
    -- Waste
    waste_amount := ROUND(cost_total * (COALESCE(item.waste_percent, 0) / 100), 2);
    cost_total := cost_total + waste_amount;
    
    -- Markup
    markup_amount := ROUND(cost_total * (COALESCE(item.markup_percent, 0) / 100), 2);
    
    -- Overhead
    overhead_amount := ROUND(cost_total * (COALESCE(item.overhead_percent, 0) / 100), 2);
    
    -- Profit
    profit_amount := ROUND(cost_total * (COALESCE(item.profit_percent, 0) / 100), 2);
    
    -- Contingency
    contingency_amount := ROUND(cost_total * (COALESCE(item.contingency_percent, 0) / 100), 2);
    
    -- Line total
    line_total := cost_total + markup_amount + overhead_amount + profit_amount + contingency_amount;
    
    -- Update the line item
    UPDATE tender_line_items SET
        labor_total = labor_total,
        material_total = material_total,
        waste_amount = waste_amount,
        markup_amount = markup_amount,
        overhead_amount = overhead_amount,
        profit_amount = profit_amount,
        contingency_amount = contingency_amount,
        cost_total = cost_total,
        unit_cost = CASE WHEN COALESCE(item.quantity, 1) > 0 THEN ROUND(cost_total / item.quantity, 2) ELSE 0 END,
        unit_price = CASE WHEN COALESCE(item.quantity, 1) > 0 THEN ROUND(line_total / item.quantity, 2) ELSE 0 END,
        line_total = line_total,
        updated_at = NOW()
    WHERE id = item_uuid;
END;
$$;

GRANT EXECUTE ON FUNCTION calculate_line_item_totals TO service_role;

-- =====================================================
-- STEP 16: VERIFICATION
-- =====================================================

DO $$
DECLARE
    tables_created INTEGER;
BEGIN
    SELECT COUNT(*) INTO tables_created FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'opportunities', 
        'opportunity_documents', 
        'opportunity_communications',
        'opportunity_rfis',
        'opportunity_site_notes',
        'tenders', 
        'tender_sections', 
        'tender_line_items', 
        'tender_versions', 
        'opportunity_activity'
    );
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VERTICAL SLICE 1 - Opportunity Workspace Foundation';
    RAISE NOTICE 'Version: 2.0.0';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables Created: % of 10', tables_created;
    RAISE NOTICE '';
    RAISE NOTICE 'OPPORTUNITY WORKSPACE COMPONENTS:';
    RAISE NOTICE '  - opportunities (parent container)';
    RAISE NOTICE '  - opportunity_documents';
    RAISE NOTICE '  - opportunity_communications';
    RAISE NOTICE '  - opportunity_rfis';
    RAISE NOTICE '  - opportunity_site_notes';
    RAISE NOTICE '  - opportunity_activity';
    RAISE NOTICE '';
    RAISE NOTICE 'TENDER WORKSPACE COMPONENTS:';
    RAISE NOTICE '  - tenders';
    RAISE NOTICE '  - tender_sections';
    RAISE NOTICE '  - tender_line_items (FULL STRUCTURE)';
    RAISE NOTICE '  - tender_versions';
    RAISE NOTICE '';
    RAISE NOTICE 'WORKFLOW STAGES:';
    RAISE NOTICE '  DISCOVERED -> QUALIFYING -> TENDERING -> SUBMITTED';
    RAISE NOTICE '  -> NEGOTIATION -> AWARDED (converts to PROJECT)';
    RAISE NOTICE '  or DECLINED | LOST | ARCHIVED';
    RAISE NOTICE '';
    RAISE NOTICE 'Helper Functions:';
    RAISE NOTICE '  - generate_opportunity_reference(org_id)';
    RAISE NOTICE '  - generate_rfi_number(opportunity_id)';
    RAISE NOTICE '  - calculate_tender_totals(tender_id)';
    RAISE NOTICE '  - calculate_line_item_totals(item_id)';
    RAISE NOTICE '';
    RAISE NOTICE 'RLS: Enabled on all tables';
    RAISE NOTICE 'All tables scoped by organization_id';
    RAISE NOTICE '========================================';
END $$;

SELECT 'Vertical Slice 1 Migration (v2.0.0) completed successfully!' as status;
