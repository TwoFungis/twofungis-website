# Production Library Architecture Specification
## TradeOS Company Knowledge Engine
### Version 1.0 | July 12, 2026

---

## Executive Summary

The Production Library is the **operational knowledge engine** of TradeOS. It is not a module—it is foundational infrastructure that every other system consumes.

**Design Principles:**
1. **Knowledge belongs to the company, not to estimates**
2. **Every completed project makes the next project smarter**
3. **Company Brain is a first-class consumer, not an afterthought**
4. **Design for 250,000+ production items, not today's demo**
5. **Immutable history enables AI learning**

---

## Table of Contents

1. [Entity Relationship Diagram](#1-entity-relationship-diagram)
2. [Core Entities](#2-core-entities)
3. [Database Schema](#3-database-schema)
4. [Entity Relationships](#4-entity-relationships)
5. [Company Brain Integration](#5-company-brain-integration)
6. [Versioning Strategy](#6-versioning-strategy)
7. [Search & Discovery](#7-search--discovery)
8. [API Architecture](#8-api-architecture)
9. [Permission Model](#9-permission-model)
10. [Import Strategy](#10-import-strategy)
11. [Scale Considerations](#11-scale-considerations)
12. [Future Extensibility](#12-future-extensibility)

---

## 1. Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          COMPANY KNOWLEDGE ENGINE                                │
│                                                                                  │
│  ┌──────────────────┐         ┌──────────────────┐                              │
│  │   ORGANIZATION   │◄────────│     CATEGORY     │                              │
│  │                  │         │                  │                              │
│  │  (Multi-Tenant)  │         │  - Hierarchical  │                              │
│  └────────┬─────────┘         │  - Unlimited     │                              │
│           │                   │    Depth         │                              │
│           │                   └────────┬─────────┘                              │
│           │                            │                                        │
│           ▼                            ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐      │
│  │                        PRODUCTION ITEM                                │      │
│  │  ════════════════════════════════════════════════════════════════════ │      │
│  │  The atomic unit of company knowledge                                 │      │
│  │                                                                       │      │
│  │  • Category/Subcategory        • Labour Configuration                 │      │
│  │  • Unit of Measure             • Material Requirements                │      │
│  │  • Production Rates            • AI Metadata                          │      │
│  │  • Crew Configuration          • Revision History                     │      │
│  └───────────────────────────────────┬──────────────────────────────────┘      │
│                                      │                                          │
│           ┌──────────────────────────┼──────────────────────────┐              │
│           │                          │                          │              │
│           ▼                          ▼                          ▼              │
│  ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐        │
│  │    ASSEMBLY     │      │  SCOPE LIBRARY  │      │ LABOUR STANDARD │        │
│  │    ──────────   │      │   ──────────    │      │   ──────────    │        │
│  │ Combines items  │      │ Reusable scope  │      │ Rates, crews,   │        │
│  │ into reusable   │      │ descriptions    │      │ productivity    │        │
│  │ groups          │      │ with pricing    │      │ standards       │        │
│  └────────┬────────┘      └────────┬────────┘      └────────┬────────┘        │
│           │                        │                        │                  │
│           └────────────────────────┼────────────────────────┘                  │
│                                    │                                            │
│                                    ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐      │
│  │                           ESTIMATE                                    │      │
│  │  ════════════════════════════════════════════════════════════════════ │      │
│  │  CONSUMES knowledge from Production Library                           │      │
│  │  Does NOT own knowledge                                               │      │
│  │                                                                       │      │
│  │  • References Production Items (does not copy)                        │      │
│  │  • Locks pricing at creation (point-in-time snapshot)                 │      │
│  │  • Tracks deviations from library                                     │      │
│  └───────────────────────────────────┬──────────────────────────────────┘      │
│                                      │                                          │
│                                      ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐      │
│  │                           PROJECT                                     │      │
│  │  ════════════════════════════════════════════════════════════════════ │      │
│  │  IMPROVES knowledge through actuals                                   │      │
│  │                                                                       │      │
│  │  • Records actual labour hours vs estimated                           │      │
│  │  • Records actual material costs vs estimated                         │      │
│  │  • Feeds back into Production Library                                 │      │
│  └───────────────────────────────────┬──────────────────────────────────┘      │
│                                      │                                          │
│                                      ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐      │
│  │                      HISTORICAL RECORD                                │      │
│  │  ════════════════════════════════════════════════════════════════════ │      │
│  │  IMMUTABLE learning data for Company Brain                            │      │
│  │                                                                       │      │
│  │  • Estimated vs Actual (labour, material, cost)                       │      │
│  │  • Project context (type, size, region, conditions)                   │      │
│  │  • Variance analysis                                                  │      │
│  │  • Never deleted, only appended                                       │      │
│  └──────────────────────────────────────────────────────────────────────┘      │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐      │
│  │                        COMPANY BRAIN                                  │      │
│  │  ════════════════════════════════════════════════════════════════════ │      │
│  │  LEARNS from all knowledge                                            │      │
│  │                                                                       │      │
│  │  • Consumes Production Library for recommendations                    │      │
│  │  • Analyzes Historical Records for pricing intelligence               │      │
│  │  • Identifies patterns across projects                                │      │
│  │  • Generates proactive suggestions                                    │      │
│  └──────────────────────────────────────────────────────────────────────┘      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Entities

### 2.1 Production Item (The Atomic Unit)

The Production Item is the fundamental building block of company knowledge. Every piece of estimating intelligence originates here.

**What a Production Item represents:**
- A specific type of work the company performs
- The knowledge accumulated from performing that work
- The intelligence that improves over time

**Examples:**
- "1/2" Drywall Installation - Level 4 Finish"
- "T-Bar Ceiling Grid Installation"
- "Electrical Rough-In - Residential"
- "Concrete Pour - 4" Slab on Grade"

### 2.2 Assembly (Grouped Knowledge)

Assemblies combine multiple Production Items into reusable groups that represent complete work packages.

**Examples:**
- "Standard Office Bathroom" = Drywall + Tile + Plumbing + Electrical + Paint
- "Commercial Kitchen Rough-In" = Plumbing + Electrical + HVAC + Fire Suppression
- "Exterior Wall Assembly - R22" = Framing + Insulation + Vapor Barrier + Siding

### 2.3 Scope Library (Language Knowledge)

The Scope Library stores the company's standard language for describing work. These are not pricing—they are descriptions that can be pulled into estimates.

**Examples:**
- "Supply and install 1/2" Type X fire-rated drywall to all walls in accordance with..."
- "Patch and repair existing drywall including taping, mudding, and sanding..."

### 2.4 Labour Standards (People Knowledge)

Labour Standards define how the company's workforce is structured and priced.

**Includes:**
- Role definitions (Journeyman, Apprentice, Foreman, etc.)
- Hourly rates (base, burden, fully-loaded)
- Crew configurations (2-man crew, 4-man crew, etc.)
- Productivity standards (SF/hour, LF/day, etc.)

### 2.5 Historical Pricing (Learning Data)

Immutable records of what actually happened on completed projects. This is the data that makes Company Brain intelligent.

---

## 3. Database Schema

### 3.1 Categories (Hierarchical)

```sql
-- ============================================
-- CATEGORIES
-- Unlimited depth hierarchical categorization
-- ============================================

CREATE TABLE production_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Hierarchy
    parent_id UUID REFERENCES production_categories(id) ON DELETE CASCADE,
    path LTREE NOT NULL,  -- Materialized path for fast hierarchical queries
    depth INTEGER NOT NULL DEFAULT 0,
    
    -- Identity
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20),  -- Optional code (e.g., "01.01.01")
    description TEXT,
    
    -- Display
    sort_order INTEGER DEFAULT 0,
    icon VARCHAR(50),
    color VARCHAR(20),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    UNIQUE(organization_id, parent_id, name)
);

-- Index for hierarchical queries
CREATE INDEX idx_categories_path ON production_categories USING GIST (path);
CREATE INDEX idx_categories_org_parent ON production_categories(organization_id, parent_id);
```

### 3.2 Production Items (Core Entity)

```sql
-- ============================================
-- PRODUCTION ITEMS
-- The atomic unit of company knowledge
-- ============================================

CREATE TABLE production_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Identity
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),  -- Company's internal code
    description TEXT,
    
    -- Classification
    category_id UUID REFERENCES production_categories(id),
    item_type VARCHAR(50) DEFAULT 'standard',  -- standard, material, equipment, subcontract
    
    -- Units
    primary_unit VARCHAR(20) NOT NULL DEFAULT 'EA',  -- EA, SF, LF, HR, CY, etc.
    secondary_unit VARCHAR(20),  -- Alternative unit for conversions
    unit_conversion_factor DECIMAL(12,4),  -- primary_unit * factor = secondary_unit
    
    -- Labour Configuration
    default_labour_rate_id UUID REFERENCES labour_rates(id),
    default_crew_id UUID REFERENCES crew_configurations(id),
    estimated_hours_per_unit DECIMAL(10,4),  -- Default production rate
    min_hours_per_unit DECIMAL(10,4),
    max_hours_per_unit DECIMAL(10,4),
    
    -- Pricing
    default_unit_price DECIMAL(12,2),
    min_price DECIMAL(12,2),
    max_price DECIMAL(12,2),
    cost_type VARCHAR(20) DEFAULT 'calculated',  -- calculated, fixed, market
    
    -- Material Component
    has_material BOOLEAN DEFAULT false,
    material_cost_per_unit DECIMAL(12,2),
    material_markup_pct DECIMAL(5,2) DEFAULT 0,
    
    -- Equipment Component
    has_equipment BOOLEAN DEFAULT false,
    equipment_cost_per_unit DECIMAL(12,2),
    
    -- Subcontract Component
    is_subcontracted BOOLEAN DEFAULT false,
    default_subcontractor_id UUID,
    
    -- AI Metadata (Company Brain learning)
    ai_confidence_score DECIMAL(5,4) DEFAULT 0,  -- 0.0000 to 1.0000
    ai_last_trained_at TIMESTAMPTZ,
    ai_sample_count INTEGER DEFAULT 0,  -- How many historical records
    ai_variance_avg DECIMAL(8,4),  -- Average variance from estimates
    ai_tags JSONB DEFAULT '[]'::jsonb,  -- AI-generated classification tags
    
    -- Search & Discovery
    search_vector TSVECTOR,  -- Full-text search
    tags TEXT[] DEFAULT '{}',  -- User-defined tags
    synonyms TEXT[] DEFAULT '{}',  -- Alternative names for search
    
    -- Revision Control
    version INTEGER DEFAULT 1,
    is_current BOOLEAN DEFAULT true,
    previous_version_id UUID REFERENCES production_items(id),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',  -- active, deprecated, archived
    is_template BOOLEAN DEFAULT false,  -- System-provided template
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT valid_unit CHECK (primary_unit IN ('EA', 'SF', 'LF', 'SY', 'CY', 'HR', 'DAY', 'WK', 'LS', 'GAL', 'TON', 'LB', 'BF', 'MBF', 'PC', 'SET', 'PR', 'LOT'))
);

-- Indexes for scale (250,000+ items)
CREATE INDEX idx_production_items_org ON production_items(organization_id) WHERE is_current = true;
CREATE INDEX idx_production_items_category ON production_items(organization_id, category_id) WHERE is_current = true;
CREATE INDEX idx_production_items_search ON production_items USING GIN(search_vector);
CREATE INDEX idx_production_items_tags ON production_items USING GIN(tags);
CREATE INDEX idx_production_items_ai_confidence ON production_items(organization_id, ai_confidence_score DESC) WHERE is_current = true;
CREATE INDEX idx_production_items_code ON production_items(organization_id, code) WHERE code IS NOT NULL;

-- Full-text search trigger
CREATE FUNCTION update_production_item_search_vector() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.code, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.synonyms, ' '), '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER production_items_search_update
    BEFORE INSERT OR UPDATE ON production_items
    FOR EACH ROW EXECUTE FUNCTION update_production_item_search_vector();
```

### 3.3 Production Item Revision History

```sql
-- ============================================
-- PRODUCTION ITEM REVISIONS
-- Immutable audit trail of all changes
-- ============================================

CREATE TABLE production_item_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_item_id UUID NOT NULL REFERENCES production_items(id) ON DELETE CASCADE,
    
    -- Snapshot of the item at this version
    version INTEGER NOT NULL,
    snapshot JSONB NOT NULL,  -- Complete item state
    
    -- Change metadata
    change_type VARCHAR(20) NOT NULL,  -- created, updated, deprecated, restored
    change_reason TEXT,
    changed_fields TEXT[],  -- Which fields were modified
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    UNIQUE(production_item_id, version)
);

CREATE INDEX idx_revisions_item ON production_item_revisions(production_item_id, version DESC);
```

### 3.4 Assemblies

```sql
-- ============================================
-- ASSEMBLIES
-- Grouped production items
-- ============================================

CREATE TABLE assemblies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Identity
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    
    -- Classification
    category_id UUID REFERENCES production_categories(id),
    assembly_type VARCHAR(50) DEFAULT 'standard',  -- standard, template, system
    
    -- Calculated Totals (denormalized for performance)
    total_labour_hours DECIMAL(12,2) DEFAULT 0,
    total_material_cost DECIMAL(12,2) DEFAULT 0,
    total_equipment_cost DECIMAL(12,2) DEFAULT 0,
    total_cost DECIMAL(12,2) DEFAULT 0,
    item_count INTEGER DEFAULT 0,
    
    -- AI Metadata
    ai_confidence_score DECIMAL(5,4) DEFAULT 0,
    ai_last_trained_at TIMESTAMPTZ,
    ai_sample_count INTEGER DEFAULT 0,
    ai_tags JSONB DEFAULT '[]'::jsonb,
    
    -- Search
    search_vector TSVECTOR,
    tags TEXT[] DEFAULT '{}',
    
    -- Revision Control
    version INTEGER DEFAULT 1,
    is_current BOOLEAN DEFAULT true,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Assembly Items (junction table)
CREATE TABLE assembly_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assembly_id UUID NOT NULL REFERENCES assemblies(id) ON DELETE CASCADE,
    production_item_id UUID NOT NULL REFERENCES production_items(id),
    
    -- Quantity and Units
    quantity DECIMAL(12,4) NOT NULL DEFAULT 1,
    unit VARCHAR(20) NOT NULL,
    
    -- Overrides (optional - defaults come from production_item)
    unit_price_override DECIMAL(12,2),
    labour_hours_override DECIMAL(10,4),
    
    -- Position
    sort_order INTEGER DEFAULT 0,
    group_name VARCHAR(100),  -- Optional grouping within assembly
    
    -- Notes
    notes TEXT,
    
    UNIQUE(assembly_id, production_item_id)
);

CREATE INDEX idx_assembly_items_assembly ON assembly_items(assembly_id);
CREATE INDEX idx_assembly_items_production ON assembly_items(production_item_id);
```

### 3.5 Scope Library

```sql
-- ============================================
-- SCOPE LIBRARY
-- Reusable scope descriptions
-- ============================================

CREATE TABLE scope_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Identity
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    
    -- Content
    short_description TEXT,  -- One-liner
    full_description TEXT,  -- Complete scope text
    inclusions TEXT[],  -- What's included
    exclusions TEXT[],  -- What's not included
    assumptions TEXT[],  -- Key assumptions
    
    -- Classification
    category_id UUID REFERENCES production_categories(id),
    
    -- Linked Production Items (optional)
    default_production_item_id UUID REFERENCES production_items(id),
    
    -- Pricing (optional defaults)
    default_unit VARCHAR(20),
    default_quantity DECIMAL(12,4),
    default_unit_price DECIMAL(12,2),
    
    -- Search
    search_vector TSVECTOR,
    tags TEXT[] DEFAULT '{}',
    
    -- Usage Tracking
    use_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_scope_items_org ON scope_items(organization_id);
CREATE INDEX idx_scope_items_search ON scope_items USING GIN(search_vector);
CREATE INDEX idx_scope_items_category ON scope_items(organization_id, category_id);
```

### 3.6 Labour Standards

```sql
-- ============================================
-- LABOUR RATES
-- Role-based hourly rates
-- ============================================

CREATE TABLE labour_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Identity
    role_name VARCHAR(100) NOT NULL,  -- Journeyman, Apprentice, Foreman, etc.
    role_code VARCHAR(20),
    description TEXT,
    
    -- Rate Components
    base_hourly_rate DECIMAL(10,2) NOT NULL,  -- Base wage
    burden_rate DECIMAL(10,2) DEFAULT 0,  -- Benefits, taxes, insurance
    fully_loaded_rate DECIMAL(10,2),  -- Calculated: base + burden
    
    -- Overtime
    overtime_multiplier DECIMAL(4,2) DEFAULT 1.5,
    double_time_multiplier DECIMAL(4,2) DEFAULT 2.0,
    
    -- Effective Dates (for rate changes over time)
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,  -- NULL = current
    
    -- Status
    is_current BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'active',
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    UNIQUE(organization_id, role_code, effective_from)
);

-- ============================================
-- CREW CONFIGURATIONS
-- Standard crew makeups
-- ============================================

CREATE TABLE crew_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Identity
    name VARCHAR(100) NOT NULL,  -- "2-Man Drywall Crew"
    code VARCHAR(20),
    description TEXT,
    
    -- Calculated Rate (denormalized)
    blended_hourly_rate DECIMAL(10,2),  -- Average rate of crew
    total_workers INTEGER,
    
    -- Status
    is_default BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active',
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Crew Members (junction)
CREATE TABLE crew_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crew_id UUID NOT NULL REFERENCES crew_configurations(id) ON DELETE CASCADE,
    labour_rate_id UUID NOT NULL REFERENCES labour_rates(id),
    
    count INTEGER NOT NULL DEFAULT 1,  -- How many of this role
    
    UNIQUE(crew_id, labour_rate_id)
);

-- ============================================
-- PRODUCTIVITY STANDARDS
-- How fast work gets done
-- ============================================

CREATE TABLE productivity_standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Links
    production_item_id UUID REFERENCES production_items(id),
    category_id UUID REFERENCES production_categories(id),
    
    -- Standard
    name VARCHAR(255) NOT NULL,
    output_per_hour DECIMAL(12,4),  -- Units per hour
    hours_per_unit DECIMAL(12,4),  -- Hours per unit (inverse)
    unit VARCHAR(20) NOT NULL,
    
    -- Conditions
    condition_type VARCHAR(50) DEFAULT 'standard',  -- standard, optimal, difficult
    condition_notes TEXT,
    
    -- Crew
    crew_id UUID REFERENCES crew_configurations(id),
    
    -- AI Learning
    ai_calculated BOOLEAN DEFAULT false,
    ai_sample_count INTEGER DEFAULT 0,
    ai_confidence DECIMAL(5,4) DEFAULT 0,
    
    -- Source
    source VARCHAR(50) DEFAULT 'manual',  -- manual, historical, ai_calculated
    source_project_id UUID,  -- If derived from a project
    
    -- Status
    is_current BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'active',
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_productivity_item ON productivity_standards(production_item_id) WHERE is_current = true;
CREATE INDEX idx_productivity_category ON productivity_standards(organization_id, category_id) WHERE is_current = true;
```

### 3.7 Historical Records (AI Learning Data)

```sql
-- ============================================
-- HISTORICAL PRODUCTION RECORDS
-- Immutable learning data for Company Brain
-- ============================================

CREATE TABLE historical_production_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Source Links
    project_id UUID NOT NULL,  -- Which project
    estimate_id UUID,  -- Which estimate (if applicable)
    estimate_line_id UUID,  -- Specific line item
    production_item_id UUID REFERENCES production_items(id),
    
    -- Item Identification (snapshot - item may change)
    item_name VARCHAR(255) NOT NULL,
    item_code VARCHAR(50),
    item_category_path TEXT,  -- "Division 09 / Drywall / Installation"
    
    -- Project Context (critical for AI learning)
    project_type VARCHAR(100),  -- Commercial, Residential, Industrial
    project_size_sf DECIMAL(12,2),
    project_region VARCHAR(100),
    project_complexity VARCHAR(20),  -- simple, standard, complex
    project_conditions JSONB,  -- Weather, site access, etc.
    
    -- Estimated Values (what we thought)
    estimated_quantity DECIMAL(12,4),
    estimated_unit VARCHAR(20),
    estimated_unit_price DECIMAL(12,2),
    estimated_labour_hours DECIMAL(12,2),
    estimated_material_cost DECIMAL(12,2),
    estimated_total DECIMAL(12,2),
    
    -- Actual Values (what really happened)
    actual_quantity DECIMAL(12,4),
    actual_unit_price DECIMAL(12,2),
    actual_labour_hours DECIMAL(12,2),
    actual_material_cost DECIMAL(12,2),
    actual_total DECIMAL(12,2),
    
    -- Calculated Variances
    quantity_variance DECIMAL(12,4),
    price_variance DECIMAL(12,2),
    labour_variance DECIMAL(12,2),
    material_variance DECIMAL(12,2),
    total_variance DECIMAL(12,2),
    variance_percentage DECIMAL(8,4),  -- (actual - estimated) / estimated
    
    -- Dates
    work_started_at DATE,
    work_completed_at DATE,
    duration_days INTEGER,
    
    -- Crew Information
    crew_size INTEGER,
    crew_composition JSONB,  -- Snapshot of who worked
    
    -- Notes and Context
    variance_reason TEXT,  -- Why the variance occurred
    notes TEXT,
    
    -- AI Processing Status
    ai_processed BOOLEAN DEFAULT false,
    ai_processed_at TIMESTAMPTZ,
    ai_quality_score DECIMAL(5,4),  -- Data quality for training
    ai_anomaly_flag BOOLEAN DEFAULT false,  -- Unusual data point
    
    -- Immutable Record
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    recorded_by UUID REFERENCES auth.users(id),
    
    -- DO NOT allow updates or deletes - this is learning data
    CONSTRAINT immutable_record CHECK (true)
);

-- Indexes for AI queries at scale (millions of records)
CREATE INDEX idx_historical_org_item ON historical_production_records(organization_id, production_item_id);
CREATE INDEX idx_historical_project_type ON historical_production_records(organization_id, project_type);
CREATE INDEX idx_historical_region ON historical_production_records(organization_id, project_region);
CREATE INDEX idx_historical_dates ON historical_production_records(organization_id, recorded_at DESC);
CREATE INDEX idx_historical_variance ON historical_production_records(organization_id, variance_percentage) 
    WHERE variance_percentage IS NOT NULL;
CREATE INDEX idx_historical_ai_unprocessed ON historical_production_records(organization_id) 
    WHERE ai_processed = false;

-- Partitioning for scale (by year)
-- In production, partition this table by recorded_at year
```

### 3.8 Estimate Templates

```sql
-- ============================================
-- ESTIMATE TEMPLATES
-- Reusable estimate structures
-- ============================================

CREATE TABLE estimate_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Identity
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    
    -- Classification
    category_id UUID REFERENCES production_categories(id),
    project_type VARCHAR(100),  -- Type of project this template is for
    
    -- Default Settings
    default_markup_pct DECIMAL(5,2),
    default_contingency_pct DECIMAL(5,2),
    default_payment_terms VARCHAR(100),
    default_validity_days INTEGER,
    
    -- Template Structure (stored as JSONB for flexibility)
    structure JSONB NOT NULL,  -- Sections, subsections, line items
    
    -- Usage Tracking
    use_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    
    -- Status
    is_system BOOLEAN DEFAULT false,  -- System-provided template
    status VARCHAR(20) DEFAULT 'active',
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Template Sections (for more structured templates)
CREATE TABLE estimate_template_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES estimate_templates(id) ON DELETE CASCADE,
    
    -- Hierarchy
    parent_section_id UUID REFERENCES estimate_template_sections(id),
    
    -- Identity
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Position
    sort_order INTEGER DEFAULT 0,
    
    -- Default Markup (can override template default)
    section_markup_pct DECIMAL(5,2)
);

-- Template Line Items
CREATE TABLE estimate_template_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES estimate_template_sections(id) ON DELETE CASCADE,
    
    -- Source
    production_item_id UUID REFERENCES production_items(id),
    assembly_id UUID REFERENCES assemblies(id),
    scope_item_id UUID REFERENCES scope_items(id),
    
    -- Defaults
    default_quantity DECIMAL(12,4),
    quantity_formula TEXT,  -- e.g., "{project_sf} * 1.1"
    
    -- Position
    sort_order INTEGER DEFAULT 0,
    
    -- Optional/Required
    is_required BOOLEAN DEFAULT true,
    is_optional BOOLEAN DEFAULT false
);
```

### 3.9 AI Metadata Tables

```sql
-- ============================================
-- AI LEARNING METADATA
-- Company Brain's knowledge store
-- ============================================

CREATE TABLE ai_item_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    production_item_id UUID NOT NULL REFERENCES production_items(id) ON DELETE CASCADE,
    
    -- Pricing Intelligence
    recommended_price DECIMAL(12,2),
    price_confidence DECIMAL(5,4),
    price_range_low DECIMAL(12,2),
    price_range_high DECIMAL(12,2),
    price_trend VARCHAR(20),  -- increasing, stable, decreasing
    
    -- Labour Intelligence
    recommended_hours_per_unit DECIMAL(10,4),
    labour_confidence DECIMAL(5,4),
    labour_range_low DECIMAL(10,4),
    labour_range_high DECIMAL(10,4),
    
    -- Context-Specific Recommendations
    recommendations_by_context JSONB,  -- { "commercial": {...}, "residential": {...} }
    
    -- Learning Stats
    sample_count INTEGER DEFAULT 0,
    last_trained_at TIMESTAMPTZ,
    model_version VARCHAR(50),
    
    -- Patterns Detected
    seasonal_patterns JSONB,  -- Price/productivity by season
    regional_patterns JSONB,  -- By region
    complexity_factors JSONB,  -- Adjustments by complexity
    
    UNIQUE(production_item_id)
);

-- AI-Generated Tags (for discovery)
CREATE TABLE ai_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Tag Identity
    tag_name VARCHAR(100) NOT NULL,
    tag_type VARCHAR(50) NOT NULL,  -- category, material, method, condition
    
    -- Confidence
    ai_generated BOOLEAN DEFAULT true,
    confidence DECIMAL(5,4),
    
    UNIQUE(organization_id, tag_name, tag_type)
);

-- Tag Assignments (many-to-many)
CREATE TABLE ai_tag_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_id UUID NOT NULL REFERENCES ai_tags(id) ON DELETE CASCADE,
    
    -- Can tag multiple entity types
    production_item_id UUID REFERENCES production_items(id) ON DELETE CASCADE,
    assembly_id UUID REFERENCES assemblies(id) ON DELETE CASCADE,
    scope_item_id UUID REFERENCES scope_items(id) ON DELETE CASCADE,
    
    confidence DECIMAL(5,4),
    assigned_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Entity Relationships

### 4.1 Relationship Diagram

```
                    ┌─────────────────────┐
                    │    ORGANIZATION     │
                    │     (Tenant)        │
                    └──────────┬──────────┘
                               │
           ┌───────────────────┼───────────────────┐
           │                   │                   │
           ▼                   ▼                   ▼
    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
    │  CATEGORIES  │   │   LABOUR     │   │   CREWS      │
    │  (Tree)      │   │   RATES      │   │              │
    └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
           │                  │                  │
           │                  └──────┬───────────┘
           │                         │
           ▼                         ▼
    ┌──────────────────────────────────────────┐
    │           PRODUCTION ITEMS               │
    │  ══════════════════════════════════════  │
    │  • Belongs to Category                   │
    │  • Has default Labour Rate               │
    │  • Has default Crew                      │
    │  • Has Revision History                  │
    │  • Has AI Insights                       │
    └─────────────────┬────────────────────────┘
                      │
        ┌─────────────┼─────────────┬─────────────┐
        │             │             │             │
        ▼             ▼             ▼             ▼
    ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐
    │ASSEMBLY│   │ SCOPE  │   │TEMPLATE│   │ESTIMATE│
    │ ITEMS  │   │ ITEMS  │   │ ITEMS  │   │ LINES  │
    └────┬───┘   └────────┘   └────────┘   └────┬───┘
         │                                      │
         ▼                                      ▼
    ┌────────────┐                        ┌────────────┐
    │ ASSEMBLIES │                        │  ESTIMATE  │
    └────────────┘                        └─────┬──────┘
                                                │
                                                ▼
                                          ┌────────────┐
                                          │  PROJECT   │
                                          └─────┬──────┘
                                                │
                                                ▼
                                    ┌──────────────────────┐
                                    │  HISTORICAL RECORDS  │
                                    │  ══════════════════  │
                                    │  Estimated vs Actual │
                                    │  (Immutable)         │
                                    └──────────┬───────────┘
                                               │
                                               ▼
                                    ┌──────────────────────┐
                                    │    COMPANY BRAIN     │
                                    │    AI INSIGHTS       │
                                    └──────────────────────┘
```

### 4.2 Key Relationships

| From | To | Relationship | Description |
|------|-----|--------------|-------------|
| Organization | Production Item | 1:N | Multi-tenant isolation |
| Category | Production Item | 1:N | Hierarchical classification |
| Category | Category | Self-referential | Unlimited depth tree |
| Production Item | Assembly Item | 1:N | Items can be in multiple assemblies |
| Assembly | Assembly Item | 1:N | Assembly contains items |
| Production Item | Revision | 1:N | Version history |
| Production Item | AI Insights | 1:1 | AI learning data |
| Labour Rate | Production Item | 1:N | Default labour assignment |
| Crew | Production Item | 1:N | Default crew assignment |
| Estimate Line | Production Item | N:1 | Line references item |
| Historical Record | Production Item | N:1 | Learning data links back |

---

## 5. Company Brain Integration

### 5.1 How Company Brain Learns

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     COMPANY BRAIN LEARNING CYCLE                        │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────────┐
    │  PRODUCTION      │ ◄─── User creates/updates items
    │  LIBRARY         │      Manual knowledge entry
    └────────┬─────────┘
             │
             │ Reference
             ▼
    ┌──────────────────┐
    │    ESTIMATE      │ ◄─── User creates estimate
    │                  │      Pulls items from library
    └────────┬─────────┘
             │
             │ Becomes
             ▼
    ┌──────────────────┐
    │    PROJECT       │ ◄─── Estimate wins, becomes project
    │                  │      Work begins
    └────────┬─────────┘
             │
             │ Records
             ▼
    ┌──────────────────┐
    │   HISTORICAL     │ ◄─── Actual vs Estimated recorded
    │   RECORDS        │      IMMUTABLE learning data
    └────────┬─────────┘
             │
             │ Feeds
             ▼
    ┌──────────────────┐
    │  COMPANY BRAIN   │ ◄─── AI processes historical data
    │  AI PROCESSING   │      Generates insights
    └────────┬─────────┘
             │
             │ Updates
             ▼
    ┌──────────────────┐
    │  AI INSIGHTS     │ ◄─── Confidence scores, recommendations
    │                  │      Context-aware pricing
    └────────┬─────────┘
             │
             │ Improves
             ▼
    ┌──────────────────┐
    │  PRODUCTION      │ ◄─── Library items get smarter
    │  LIBRARY         │      Cycle continues
    └──────────────────┘
```

### 5.2 AI Metadata on Every Entity

Every significant entity carries AI metadata:

```javascript
// Example: Production Item AI Fields
{
  ai_confidence_score: 0.8750,      // 0-1 confidence in recommendations
  ai_last_trained_at: "2026-07-12", // When AI last processed
  ai_sample_count: 247,             // Historical records used
  ai_variance_avg: 0.0342,          // Average deviation from estimates
  ai_tags: ["drywall", "interior", "standard-height", "commercial"]
}
```

### 5.3 AI Query Patterns

**"What should I price this at?"**
```sql
-- AI-assisted pricing query
SELECT 
    pi.name,
    pi.default_unit_price,
    ai.recommended_price,
    ai.price_confidence,
    ai.price_range_low,
    ai.price_range_high,
    ai.recommendations_by_context->>'commercial' as commercial_recommendation
FROM production_items pi
JOIN ai_item_insights ai ON ai.production_item_id = pi.id
WHERE pi.id = :item_id;
```

**"How long will this take?"**
```sql
-- Labour estimation with AI
SELECT 
    pi.name,
    pi.estimated_hours_per_unit as manual_estimate,
    ai.recommended_hours_per_unit as ai_estimate,
    ai.labour_confidence,
    ps.output_per_hour,
    ps.condition_type
FROM production_items pi
LEFT JOIN ai_item_insights ai ON ai.production_item_id = pi.id
LEFT JOIN productivity_standards ps ON ps.production_item_id = pi.id AND ps.is_current = true
WHERE pi.id = :item_id;
```

**"What patterns exist?"**
```sql
-- Pattern discovery for Company Brain
SELECT 
    project_type,
    project_region,
    AVG(variance_percentage) as avg_variance,
    COUNT(*) as sample_count,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY variance_percentage) as median_variance
FROM historical_production_records
WHERE organization_id = :org_id
  AND production_item_id = :item_id
  AND ai_processed = true
GROUP BY project_type, project_region
HAVING COUNT(*) >= 5;
```

### 5.4 Company Brain Recommendations

Company Brain can generate recommendations like:

- "Your drywall installation pricing is 12% below historical actuals. Consider increasing to $2.45/SF."
- "Projects in the GTA region typically run 8% over estimated labour. Apply a regional factor."
- "This assembly has been used 47 times. Average variance is -3.2% (you're estimating slightly high)."
- "Winter projects in this category average 15% more labour hours. Consider seasonal adjustment."

---

## 6. Versioning Strategy

### 6.1 Version Control Model

Every change to a Production Item creates a new version:

```
Version 1 (Created) ─► Version 2 (Price Update) ─► Version 3 (Labour Update)
     │                      │                           │
     │                      │                           │
     ▼                      ▼                           ▼
[Revision 1]          [Revision 2]                [Revision 3]
 snapshot              snapshot                    snapshot
```

### 6.2 How Versioning Works

```sql
-- Creating a new version
-- 1. Mark current version as not current
UPDATE production_items SET is_current = false WHERE id = :current_id;

-- 2. Create new version with reference to previous
INSERT INTO production_items (
    ...,
    version,
    is_current,
    previous_version_id
) VALUES (
    ...,
    (SELECT version + 1 FROM production_items WHERE id = :current_id),
    true,
    :current_id
);

-- 3. Create revision record
INSERT INTO production_item_revisions (
    production_item_id,
    version,
    snapshot,
    change_type,
    change_reason,
    changed_fields
) VALUES (
    :new_id,
    :new_version,
    :full_item_json,
    'updated',
    'Price adjustment based on supplier increase',
    ARRAY['default_unit_price', 'material_cost_per_unit']
);
```

### 6.3 Estimates Reference Versions

When an estimate is created, it references the **current version** of each item. This creates a point-in-time snapshot:

```sql
CREATE TABLE estimate_lines (
    id UUID PRIMARY KEY,
    estimate_id UUID NOT NULL,
    
    -- Reference to specific version
    production_item_id UUID NOT NULL REFERENCES production_items(id),
    production_item_version INTEGER NOT NULL,  -- Which version was used
    
    -- Point-in-time snapshot of pricing
    unit_price_at_creation DECIMAL(12,2),
    labour_hours_at_creation DECIMAL(10,4),
    
    -- User overrides
    quantity DECIMAL(12,4),
    unit_price_override DECIMAL(12,2),  -- NULL = use library price
    
    ...
);
```

---

## 7. Search & Discovery

### 7.1 Full-Text Search

Every searchable entity has a `search_vector` column using PostgreSQL's built-in full-text search:

```sql
-- Search production items
SELECT 
    id, 
    name, 
    code,
    ts_rank(search_vector, query) as rank
FROM production_items,
     to_tsquery('english', 'drywall & installation') query
WHERE organization_id = :org_id
  AND is_current = true
  AND search_vector @@ query
ORDER BY rank DESC
LIMIT 20;
```

### 7.2 Tag-Based Discovery

```sql
-- Find items by tags
SELECT * FROM production_items
WHERE organization_id = :org_id
  AND is_current = true
  AND tags && ARRAY['drywall', 'commercial'];

-- Find similar items via AI tags
SELECT pi.*, array_agg(at.tag_name) as ai_tags
FROM production_items pi
JOIN ai_tag_assignments ata ON ata.production_item_id = pi.id
JOIN ai_tags at ON at.id = ata.tag_id
WHERE pi.organization_id = :org_id
  AND at.tag_name = 'drywall'
GROUP BY pi.id;
```

### 7.3 Category Navigation

```sql
-- Get category tree
WITH RECURSIVE category_tree AS (
    SELECT id, name, parent_id, path, depth, 0 as level
    FROM production_categories
    WHERE organization_id = :org_id AND parent_id IS NULL
    
    UNION ALL
    
    SELECT c.id, c.name, c.parent_id, c.path, c.depth, ct.level + 1
    FROM production_categories c
    JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT * FROM category_tree ORDER BY path;

-- Get items in category and all subcategories
SELECT * FROM production_items
WHERE organization_id = :org_id
  AND is_current = true
  AND category_id IN (
      SELECT id FROM production_categories
      WHERE path <@ (SELECT path FROM production_categories WHERE id = :category_id)
  );
```

### 7.4 Synonym Support

Production items support synonyms for improved search:

```sql
-- Item: "1/2" Drywall Installation"
-- Synonyms: ["gypsum board", "sheetrock", "wallboard", "gypboard"]

-- Search finds it via synonym
SELECT * FROM production_items
WHERE organization_id = :org_id
  AND ('sheetrock' = ANY(synonyms) OR search_vector @@ to_tsquery('sheetrock'));
```

---

## 8. API Architecture

### 8.1 RESTful Endpoints

```
/api/v2/production-library/
├── items/
│   ├── GET    /                    # List items (paginated, filterable)
│   ├── POST   /                    # Create item
│   ├── GET    /:id                 # Get item
│   ├── PUT    /:id                 # Update item (creates new version)
│   ├── DELETE /:id                 # Soft delete (deprecate)
│   ├── GET    /:id/versions        # Get version history
│   ├── GET    /:id/versions/:v     # Get specific version
│   ├── POST   /:id/restore/:v      # Restore to version
│   └── GET    /:id/insights        # Get AI insights
│
├── assemblies/
│   ├── GET    /                    # List assemblies
│   ├── POST   /                    # Create assembly
│   ├── GET    /:id                 # Get assembly with items
│   ├── PUT    /:id                 # Update assembly
│   ├── DELETE /:id                 # Soft delete
│   ├── POST   /:id/items           # Add item to assembly
│   ├── DELETE /:id/items/:itemId   # Remove item
│   └── POST   /:id/duplicate       # Duplicate assembly
│
├── scopes/
│   ├── GET    /                    # List scope items
│   ├── POST   /                    # Create scope
│   ├── GET    /:id                 # Get scope
│   ├── PUT    /:id                 # Update scope
│   └── DELETE /:id                 # Soft delete
│
├── labour/
│   ├── rates/
│   │   ├── GET    /                # List rates
│   │   ├── POST   /                # Create rate
│   │   └── GET    /:id/history     # Rate history over time
│   │
│   ├── crews/
│   │   ├── GET    /                # List crews
│   │   ├── POST   /                # Create crew
│   │   └── GET    /:id             # Get crew with members
│   │
│   └── productivity/
│       ├── GET    /                # List standards
│       └── POST   /                # Create standard
│
├── categories/
│   ├── GET    /                    # Get full tree
│   ├── POST   /                    # Create category
│   ├── PUT    /:id                 # Update category
│   ├── DELETE /:id                 # Delete (cascade children)
│   └── POST   /:id/move            # Move in tree
│
├── templates/
│   ├── GET    /                    # List templates
│   ├── POST   /                    # Create template
│   ├── GET    /:id                 # Get template with structure
│   └── POST   /:id/instantiate     # Create estimate from template
│
├── search/
│   ├── GET    /items               # Search items
│   ├── GET    /assemblies          # Search assemblies
│   ├── GET    /scopes              # Search scopes
│   └── GET    /all                 # Global search
│
├── import/
│   ├── POST   /items               # Import items from CSV
│   ├── POST   /assemblies          # Import assemblies
│   ├── POST   /scopes              # Import scopes
│   ├── POST   /labour-rates        # Import labour rates
│   └── GET    /templates           # Download import templates
│
└── ai/
    ├── GET    /insights/:itemId    # Get AI insights for item
    ├── POST   /recommend-price     # Get price recommendation
    ├── POST   /recommend-labour    # Get labour recommendation
    └── POST   /similar-items       # Find similar items
```

### 8.2 Query Parameters

```
# Pagination
?page=1&per_page=50

# Filtering
?category_id=uuid&status=active&item_type=standard

# Sorting
?sort=name&order=asc
?sort=ai_confidence_score&order=desc

# Search
?q=drywall+installation

# Include relationships
?include=category,labour_rate,ai_insights

# Fields selection
?fields=id,name,default_unit_price
```

### 8.3 Response Format

```json
{
  "data": [...],
  "meta": {
    "total": 1250,
    "page": 1,
    "per_page": 50,
    "total_pages": 25
  },
  "links": {
    "self": "/api/v2/production-library/items?page=1",
    "next": "/api/v2/production-library/items?page=2",
    "last": "/api/v2/production-library/items?page=25"
  }
}
```

---

## 9. Permission Model

### 9.1 Role-Based Access

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       PERMISSION HIERARCHY                               │
└─────────────────────────────────────────────────────────────────────────┘

ORGANIZATION OWNER
    │
    ├── Full access to all Production Library features
    ├── Can delete items permanently
    ├── Can manage categories
    ├── Can approve imports
    │
    ▼
ORGANIZATION ADMIN
    │
    ├── Create, update, deprecate items
    ├── Manage assemblies and templates
    ├── View all pricing
    ├── Cannot permanently delete
    │
    ▼
ESTIMATOR
    │
    ├── View all items
    ├── Use items in estimates
    ├── Create personal assemblies
    ├── Cannot modify library items
    │
    ▼
PROJECT MANAGER
    │
    ├── View items used in their projects
    ├── Record actuals (feeds historical data)
    ├── Cannot modify library
    │
    ▼
FIELD USER
    │
    ├── View items on mobile
    ├── Record production data
    ├── No library modification access
```

### 9.2 Permission Matrix

| Action | Owner | Admin | Estimator | PM | Field |
|--------|-------|-------|-----------|-----|-------|
| View Items | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create Items | ✓ | ✓ | - | - | - |
| Update Items | ✓ | ✓ | - | - | - |
| Delete Items | ✓ | - | - | - | - |
| View Pricing | ✓ | ✓ | ✓ | - | - |
| Manage Categories | ✓ | ✓ | - | - | - |
| Import Data | ✓ | ✓ | - | - | - |
| View AI Insights | ✓ | ✓ | ✓ | ✓ | - |
| Record Actuals | ✓ | ✓ | - | ✓ | ✓ |

### 9.3 Row-Level Security

```sql
-- RLS Policy for production_items
CREATE POLICY production_items_org_isolation ON production_items
    FOR ALL
    USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- RLS Policy for read-only field users
CREATE POLICY production_items_field_read ON production_items
    FOR SELECT
    USING (
        organization_id = current_setting('app.current_organization_id')::uuid
        AND current_setting('app.user_role') IN ('owner', 'admin', 'estimator', 'pm', 'field')
    );

-- RLS Policy for write access
CREATE POLICY production_items_write ON production_items
    FOR INSERT UPDATE DELETE
    USING (
        organization_id = current_setting('app.current_organization_id')::uuid
        AND current_setting('app.user_role') IN ('owner', 'admin')
    );
```

---

## 10. Import Strategy

### 10.1 CSV Import Format

**Production Items:**
```csv
code,name,description,category_path,unit,default_unit_price,labour_hours_per_unit,material_cost,tags
DW-001,"1/2"" Drywall Install","Standard drywall installation",Division 09/Drywall/Installation,SF,2.35,0.015,0.85,"drywall,interior"
DW-002,"5/8"" Drywall Install","Fire-rated drywall installation",Division 09/Drywall/Installation,SF,2.75,0.018,1.15,"drywall,interior,fire-rated"
```

**Labour Rates:**
```csv
role_code,role_name,base_hourly_rate,burden_rate,effective_from
JM,Journeyman,45.00,18.50,2024-01-01
AP1,Apprentice Year 1,25.00,10.00,2024-01-01
FM,Foreman,55.00,22.00,2024-01-01
```

### 10.2 Import Process

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Upload CSV     │────►│  Validation     │────►│  Preview        │
│                 │     │  & Parsing      │     │  Changes        │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         │ Approve
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Import         │◄────│  Transaction    │◄────│  Create         │
│  Complete       │     │  Commit         │     │  Categories     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 10.3 Import Validation Rules

1. **Required fields** must be present
2. **Unique constraints** validated (code within org)
3. **Category paths** auto-create if missing
4. **Units** must be from allowed list
5. **Numeric fields** validated for format
6. **Duplicates** identified and flagged
7. **References** validated (labour rates, crews)

### 10.4 Import API

```
POST /api/v2/production-library/import/items
Content-Type: multipart/form-data

{
  "file": [CSV file],
  "options": {
    "update_existing": true,
    "create_categories": true,
    "dry_run": false
  }
}

Response:
{
  "status": "preview",  // or "complete" if not dry_run
  "summary": {
    "total_rows": 500,
    "valid": 485,
    "errors": 15,
    "new_items": 400,
    "updates": 85,
    "categories_created": 12
  },
  "errors": [
    { "row": 23, "field": "unit", "message": "Invalid unit: SQFT" },
    ...
  ],
  "preview": [...]  // First 10 items to be imported
}
```

---

## 11. Scale Considerations

### 11.1 Target Scale

| Entity | Target Volume | Growth Rate |
|--------|---------------|-------------|
| Production Items | 250,000+ | 5,000/month |
| Assemblies | 18,000+ | 500/month |
| Scope Items | 50,000+ | 1,000/month |
| Historical Records | Millions | 50,000/month |
| Categories | 5,000+ | 100/month |

### 11.2 Performance Strategies

**1. Indexing Strategy**
- Composite indexes for common query patterns
- Partial indexes for filtered queries (`WHERE is_current = true`)
- GIN indexes for array and full-text search
- GIST indexes for hierarchical data (LTREE)

**2. Denormalization**
- Calculated totals on assemblies
- Category paths materialized
- Search vectors pre-computed

**3. Caching Layer**
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Client     │────►│   Redis      │────►│  PostgreSQL  │
│   Request    │     │   Cache      │     │   Database   │
└──────────────┘     └──────────────┘     └──────────────┘

Cache Keys:
- org:{id}:items:list:{hash}
- org:{id}:item:{id}
- org:{id}:categories:tree
- org:{id}:search:{query}
```

**4. Pagination**
- All list endpoints paginated (max 100/page)
- Cursor-based pagination for large result sets
- Total counts cached separately

**5. Background Processing**
- AI processing runs asynchronously
- Large imports processed in batches
- Historical record aggregation nightly

### 11.3 Database Partitioning

For historical_production_records (millions of rows):

```sql
-- Partition by year
CREATE TABLE historical_production_records (
    ...
) PARTITION BY RANGE (recorded_at);

CREATE TABLE historical_production_records_2024 
    PARTITION OF historical_production_records
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE historical_production_records_2025 
    PARTITION OF historical_production_records
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Continue for each year
```

---

## 12. Future Extensibility

### 12.1 Planned Extensions

| Feature | Timeline | Dependencies |
|---------|----------|--------------|
| AI Price Recommendations | Phase 3 | Historical data |
| Automated Productivity Learning | Phase 3 | Project actuals |
| Material Price Integration | Phase 4 | Supplier APIs |
| Photo/Document Attachments | Phase 4 | Storage service |
| Mobile Offline Sync | Phase 5 | Sync service |
| Multi-Language Support | Phase 6 | i18n framework |

### 12.2 Extension Points

**Custom Fields**
```sql
-- Future: Organization-defined custom fields
CREATE TABLE production_item_custom_fields (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    field_type VARCHAR(50) NOT NULL,  -- text, number, date, select
    options JSONB,  -- For select fields
    is_required BOOLEAN DEFAULT false,
    sort_order INTEGER
);

CREATE TABLE production_item_custom_values (
    id UUID PRIMARY KEY,
    production_item_id UUID NOT NULL,
    custom_field_id UUID NOT NULL,
    value JSONB NOT NULL
);
```

**Integrations**
```sql
-- Future: External system mappings
CREATE TABLE external_mappings (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    integration_type VARCHAR(50) NOT NULL,  -- quickbooks, procore, etc.
    local_item_id UUID NOT NULL,
    external_id VARCHAR(255) NOT NULL,
    external_data JSONB,
    last_synced_at TIMESTAMPTZ
);
```

### 12.3 API Versioning

The API is versioned to allow future breaking changes:

```
/api/v2/production-library/...  # Current
/api/v3/production-library/...  # Future with breaking changes
```

Old versions deprecated but maintained for transition period.

---

## Appendix A: Unit of Measure Reference

| Code | Name | Description |
|------|------|-------------|
| EA | Each | Individual items |
| SF | Square Foot | Area measurement |
| LF | Linear Foot | Length measurement |
| SY | Square Yard | Area (carpet, etc.) |
| CY | Cubic Yard | Volume (concrete, etc.) |
| HR | Hour | Time-based |
| DAY | Day | Daily rate |
| WK | Week | Weekly rate |
| LS | Lump Sum | Fixed price |
| GAL | Gallon | Liquid volume |
| TON | Ton | Weight |
| LB | Pound | Weight |
| BF | Board Foot | Lumber measurement |
| MBF | Thousand Board Feet | Lumber bulk |
| PC | Piece | Individual pieces |
| SET | Set | Grouped items |
| PR | Pair | Two items |
| LOT | Lot | Bulk quantity |

---

## Appendix B: Status Values

**Production Item Status:**
- `active` - Available for use
- `deprecated` - Hidden from new estimates, visible in existing
- `archived` - Completely hidden, retained for history

**Assembly Status:**
- `active` - Available for use
- `draft` - Work in progress
- `archived` - No longer available

**Labour Rate Status:**
- `active` - Current rate
- `superseded` - Replaced by newer rate
- `inactive` - No longer used

---

## Approval

This specification defines the architectural foundation of the Production Library / Company Knowledge Engine for TradeOS.

Once approved, implementation will proceed in the following order:

1. Database schema creation
2. Core API endpoints
3. Frontend integration
4. Import functionality
5. AI processing pipeline
6. Search optimization

---

*Document Version: 1.0*
*Last Updated: July 12, 2026*
*Author: TradeOS Engineering*
