-- =====================================================
-- TRADEOS PHASE 1A - Organization Foundation
-- Version: 1.0.0
-- Date: July 12, 2026
-- =====================================================
--
-- This migration establishes the multi-tenant organization layer.
-- It is ADDITIVE and maintains backward compatibility with existing TFCS tables.
--
-- WHAT THIS CREATES:
-- 1. organizations - Company/tenant records
-- 2. organization_members - User-to-organization relationships with roles
-- 3. organization_settings - Per-organization configuration (branding, etc.)
--
-- COMPATIBILITY:
-- - Existing tfcs_user_roles table remains functional
-- - Existing application continues to work
-- - New organization tables operate alongside existing system
--
-- =====================================================

-- =====================================================
-- STEP 1: CREATE ORGANIZATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Info
    name TEXT NOT NULL,
    slug TEXT UNIQUE,  -- URL-friendly identifier (optional, not used in URLs per Constitution)
    
    -- Business Details
    primary_trade TEXT,
    company_size TEXT,
    province TEXT,
    country TEXT DEFAULT 'CA',
    
    -- Contact
    email TEXT,
    phone TEXT,
    website TEXT,
    
    -- Address
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    postal_code TEXT,
    
    -- Subscription
    subscription_tier TEXT DEFAULT 'free',  -- free, pro, elite, lifetime, enterprise
    subscription_status TEXT DEFAULT 'active',  -- active, past_due, canceled, trialing
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    
    -- Platform Flags
    is_platform BOOLEAN DEFAULT false,  -- True only for TradeOS Platform org
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- STEP 2: CREATE ORGANIZATION_MEMBERS TABLE
-- =====================================================

-- Organization Roles (expanded from TFCS roles)
-- Platform Roles: platform_admin, platform_support
-- Company Roles: owner, admin, estimator, project_manager, foreman, office_admin, accounting, employee
-- External Roles: client, builder, subcontractor, architect, consultant, inspector

CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core Relationship
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Role
    role TEXT NOT NULL,
    
    -- User Display Info (cached for performance)
    user_email TEXT,
    user_name TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,  -- User's default/primary organization
    
    -- Assignment Tracking
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    
    -- Deactivation Tracking
    deactivated_at TIMESTAMPTZ,
    deactivated_by UUID REFERENCES auth.users(id),
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(organization_id, user_id)
);

-- =====================================================
-- STEP 3: CREATE ORGANIZATION_SETTINGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS organization_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
    
    -- Branding
    logo_url TEXT,
    primary_color TEXT DEFAULT '#10b981',  -- Emerald green default
    secondary_color TEXT DEFAULT '#0a0a0a',  -- Black default
    
    -- Document Branding
    letterhead_url TEXT,
    proposal_footer TEXT,
    invoice_footer TEXT,
    email_signature TEXT,
    
    -- Business Defaults
    default_tax_rate DECIMAL(5,2) DEFAULT 13.00,  -- Ontario HST
    default_markup_percent DECIMAL(5,2) DEFAULT 25.00,
    default_overhead_percent DECIMAL(5,2) DEFAULT 10.00,
    default_contingency_percent DECIMAL(5,2) DEFAULT 5.00,
    
    -- Preferences
    timezone TEXT DEFAULT 'America/Toronto',
    currency TEXT DEFAULT 'CAD',
    date_format TEXT DEFAULT 'YYYY-MM-DD',
    
    -- Feature Flags (per-org overrides)
    features_enabled JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 4: CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON organizations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_organizations_subscription ON organizations(subscription_tier, subscription_status);

CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(role);
CREATE INDEX IF NOT EXISTS idx_org_members_active ON organization_members(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_org_members_primary ON organization_members(user_id, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_org_members_org_user ON organization_members(organization_id, user_id);

CREATE INDEX IF NOT EXISTS idx_org_settings_org_id ON organization_settings(organization_id);

-- =====================================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 6: CREATE HELPER FUNCTIONS
-- =====================================================

-- Get user's organization IDs
DROP FUNCTION IF EXISTS get_user_organization_ids(UUID);
CREATE OR REPLACE FUNCTION get_user_organization_ids(check_user_id UUID)
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN ARRAY(
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = check_user_id 
        AND is_active = true
    );
END;
$$;

-- Check if user is member of organization
DROP FUNCTION IF EXISTS is_org_member(UUID, UUID);
CREATE OR REPLACE FUNCTION is_org_member(check_user_id UUID, check_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM organization_members 
        WHERE user_id = check_user_id 
        AND organization_id = check_org_id
        AND is_active = true
    );
END;
$$;

-- Get user's role in organization
DROP FUNCTION IF EXISTS get_org_role(UUID, UUID);
CREATE OR REPLACE FUNCTION get_org_role(check_user_id UUID, check_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    member_role TEXT;
BEGIN
    SELECT role INTO member_role
    FROM organization_members
    WHERE user_id = check_user_id
    AND organization_id = check_org_id
    AND is_active = true
    LIMIT 1;
    RETURN member_role;
END;
$$;

-- Check if user has platform admin role
DROP FUNCTION IF EXISTS is_platform_admin(UUID);
CREATE OR REPLACE FUNCTION is_platform_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM organization_members om
        JOIN organizations o ON o.id = om.organization_id
        WHERE om.user_id = check_user_id 
        AND o.is_platform = true
        AND om.role = 'platform_admin'
        AND om.is_active = true
    );
END;
$$;

-- Get user's primary organization
DROP FUNCTION IF EXISTS get_primary_organization(UUID);
CREATE OR REPLACE FUNCTION get_primary_organization(check_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    primary_org_id UUID;
BEGIN
    -- First try to get explicitly marked primary
    SELECT organization_id INTO primary_org_id
    FROM organization_members
    WHERE user_id = check_user_id
    AND is_primary = true
    AND is_active = true
    LIMIT 1;
    
    -- If no primary marked, return most recently active
    IF primary_org_id IS NULL THEN
        SELECT organization_id INTO primary_org_id
        FROM organization_members
        WHERE user_id = check_user_id
        AND is_active = true
        ORDER BY created_at ASC
        LIMIT 1;
    END IF;
    
    RETURN primary_org_id;
END;
$$;

-- =====================================================
-- STEP 7: CREATE RLS POLICIES
-- =====================================================

-- Organizations: Members can view their organizations, platform admins see all
DROP POLICY IF EXISTS "Users view own organizations" ON organizations;
CREATE POLICY "Users view own organizations" ON organizations
    FOR SELECT USING (
        id = ANY(get_user_organization_ids(auth.uid()))
        OR is_platform_admin(auth.uid())
    );

DROP POLICY IF EXISTS "Service role full access to organizations" ON organizations;
CREATE POLICY "Service role full access to organizations" ON organizations
    FOR ALL USING (true) WITH CHECK (true);

-- Organization Members: Members can view members of their orgs
DROP POLICY IF EXISTS "Users view org members" ON organization_members;
CREATE POLICY "Users view org members" ON organization_members
    FOR SELECT USING (
        organization_id = ANY(get_user_organization_ids(auth.uid()))
        OR is_platform_admin(auth.uid())
    );

DROP POLICY IF EXISTS "Service role full access to org members" ON organization_members;
CREATE POLICY "Service role full access to org members" ON organization_members
    FOR ALL USING (true) WITH CHECK (true);

-- Organization Settings: Members can view their org's settings
DROP POLICY IF EXISTS "Users view org settings" ON organization_settings;
CREATE POLICY "Users view org settings" ON organization_settings
    FOR SELECT USING (
        organization_id = ANY(get_user_organization_ids(auth.uid()))
        OR is_platform_admin(auth.uid())
    );

DROP POLICY IF EXISTS "Service role full access to org settings" ON organization_settings;
CREATE POLICY "Service role full access to org settings" ON organization_settings
    FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- STEP 8: GRANTS
-- =====================================================

GRANT ALL ON organizations TO service_role;
GRANT ALL ON organization_members TO service_role;
GRANT ALL ON organization_settings TO service_role;

GRANT SELECT ON organizations TO authenticated;
GRANT SELECT ON organization_members TO authenticated;
GRANT SELECT ON organization_settings TO authenticated;

GRANT EXECUTE ON FUNCTION get_user_organization_ids TO authenticated;
GRANT EXECUTE ON FUNCTION is_org_member TO authenticated;
GRANT EXECUTE ON FUNCTION get_org_role TO authenticated;
GRANT EXECUTE ON FUNCTION is_platform_admin TO authenticated;
GRANT EXECUTE ON FUNCTION get_primary_organization TO authenticated;

-- =====================================================
-- STEP 9: SEED INITIAL DATA
-- =====================================================

-- Create TradeOS Platform organization (for platform administration)
INSERT INTO organizations (id, name, slug, is_platform, subscription_tier, subscription_status, created_at)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'TradeOS Platform',
    'tradeos-platform',
    true,
    'enterprise',
    'active',
    NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- Create Two Fungis Finishing organization
INSERT INTO organizations (id, name, slug, primary_trade, province, country, subscription_tier, subscription_status, created_at)
VALUES (
    'a0000000-0000-0000-0000-000000000002',
    'Two Fungis Finishing',
    'two-fungis',
    'Finishing',
    'Ontario',
    'CA',
    'founding_lifetime',
    'active',
    NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- Create settings for Two Fungis
INSERT INTO organization_settings (organization_id, primary_color, secondary_color, timezone, currency)
VALUES (
    'a0000000-0000-0000-0000-000000000002',
    '#10b981',  -- Emerald green
    '#0a0a0a',  -- Black
    'America/Toronto',
    'CAD'
)
ON CONFLICT (organization_id) DO NOTHING;

-- =====================================================
-- STEP 10: VERIFICATION
-- =====================================================

DO $$
DECLARE
    platform_org_exists BOOLEAN;
    twofungis_org_exists BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM organizations WHERE slug = 'tradeos-platform') INTO platform_org_exists;
    SELECT EXISTS(SELECT 1 FROM organizations WHERE slug = 'two-fungis') INTO twofungis_org_exists;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TRADEOS PHASE 1A - Organization Foundation Complete';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables Created: organizations, organization_members, organization_settings';
    RAISE NOTICE 'Functions: get_user_organization_ids, is_org_member, get_org_role, is_platform_admin, get_primary_organization';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Platform Organization: %', CASE WHEN platform_org_exists THEN 'CREATED' ELSE 'MISSING' END;
    RAISE NOTICE 'Two Fungis Organization: %', CASE WHEN twofungis_org_exists THEN 'CREATED' ELSE 'MISSING' END;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Run assign_scott_marshall_roles() to set up dual identity';
    RAISE NOTICE '2. The existing TFCS system remains functional';
    RAISE NOTICE '3. New organization-based features will use these tables';
    RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- STEP 11: USER ASSIGNMENT FUNCTION
-- =====================================================
-- This function assigns Scott Marshall to both organizations
-- Run this AFTER confirming his user_id exists in auth.users

DROP FUNCTION IF EXISTS assign_scott_marshall_roles();
CREATE OR REPLACE FUNCTION assign_scott_marshall_roles()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    scott_user_id UUID;
    platform_org_id UUID := 'a0000000-0000-0000-0000-000000000001';
    twofungis_org_id UUID := 'a0000000-0000-0000-0000-000000000002';
BEGIN
    -- Find Scott's user ID by email
    SELECT id INTO scott_user_id
    FROM auth.users
    WHERE email = 'inbox@twofungis.ca'
    LIMIT 1;
    
    IF scott_user_id IS NULL THEN
        RETURN 'ERROR: User inbox@twofungis.ca not found. Please ensure the user has logged in at least once.';
    END IF;
    
    -- Assign Platform Administrator role
    INSERT INTO organization_members (
        organization_id, user_id, role, user_email, user_name, 
        is_active, is_primary, accepted_at, created_at
    )
    VALUES (
        platform_org_id, scott_user_id, 'platform_admin', 'inbox@twofungis.ca', 'Scott Marshall',
        true, false, NOW(), NOW()
    )
    ON CONFLICT (organization_id, user_id) DO UPDATE SET
        role = 'platform_admin',
        is_active = true,
        updated_at = NOW();
    
    -- Assign Company Owner role (this is the PRIMARY workspace)
    INSERT INTO organization_members (
        organization_id, user_id, role, user_email, user_name,
        is_active, is_primary, accepted_at, created_at
    )
    VALUES (
        twofungis_org_id, scott_user_id, 'owner', 'inbox@twofungis.ca', 'Scott Marshall',
        true, true, NOW(), NOW()  -- is_primary = true (default workspace)
    )
    ON CONFLICT (organization_id, user_id) DO UPDATE SET
        role = 'owner',
        is_active = true,
        is_primary = true,
        updated_at = NOW();
    
    RETURN 'SUCCESS: Scott Marshall assigned as Platform Admin and Two Fungis Owner. Primary workspace: Two Fungis.';
END;
$$;

GRANT EXECUTE ON FUNCTION assign_scott_marshall_roles TO service_role;

-- Output verification
SELECT 'Phase 1A Migration completed successfully!' as status;
