-- =====================================================
-- TRADEOS PHASE 1A - Organization Foundation (Revised)
-- Version: 1.1.0
-- Date: July 12, 2026
-- =====================================================
--
-- REVISION NOTES (v1.1.0):
-- - Removed "TradeOS Platform" as an organization
-- - Platform administration is now a separate system context
-- - Added platform_admins table for platform-level roles
-- - Updated Province to British Columbia
-- - Updated Timezone to America/Vancouver
--
-- ARCHITECTURAL PRINCIPLE:
-- Platform exists ABOVE organizations, not alongside them.
-- Organizations are tenant companies. Platform is the system itself.
--
-- =====================================================

-- =====================================================
-- STEP 1: CREATE ORGANIZATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Info
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    
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
    subscription_tier TEXT DEFAULT 'free',
    subscription_status TEXT DEFAULT 'active',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- STEP 2: CREATE ORGANIZATION_MEMBERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core Relationship
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Role (company roles only, not platform roles)
    -- Valid: owner, admin, estimator, project_manager, foreman, office_admin, accounting, employee
    -- External: client, builder, subcontractor, architect, consultant, inspector
    role TEXT NOT NULL,
    
    -- User Display Info (cached for performance)
    user_email TEXT,
    user_name TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,
    
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
    primary_color TEXT DEFAULT '#10b981',
    secondary_color TEXT DEFAULT '#0a0a0a',
    
    -- Document Branding
    letterhead_url TEXT,
    proposal_footer TEXT,
    invoice_footer TEXT,
    email_signature TEXT,
    
    -- Business Defaults
    default_tax_rate DECIMAL(5,2) DEFAULT 12.00,  -- BC PST+GST
    default_markup_percent DECIMAL(5,2) DEFAULT 25.00,
    default_overhead_percent DECIMAL(5,2) DEFAULT 10.00,
    default_contingency_percent DECIMAL(5,2) DEFAULT 5.00,
    
    -- Preferences
    timezone TEXT DEFAULT 'America/Vancouver',
    currency TEXT DEFAULT 'CAD',
    date_format TEXT DEFAULT 'YYYY-MM-DD',
    
    -- Feature Flags (per-org overrides)
    features_enabled JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 4: CREATE PLATFORM_ADMINS TABLE
-- =====================================================
-- Platform administration is a SYSTEM context, not an organization.
-- This table tracks users with platform-level access.

CREATE TABLE IF NOT EXISTS platform_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Role: platform_admin, platform_support, platform_developer
    role TEXT NOT NULL DEFAULT 'platform_admin',
    
    -- User Info (cached)
    user_email TEXT,
    user_name TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Audit
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES auth.users(id),
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 5: CREATE INDEXES
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

CREATE INDEX IF NOT EXISTS idx_platform_admins_user_id ON platform_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_admins_active ON platform_admins(is_active) WHERE is_active = true;

-- =====================================================
-- STEP 6: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 7: CREATE HELPER FUNCTIONS
-- =====================================================

-- Check if user is platform admin (simplified - no org join needed)
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
        FROM platform_admins 
        WHERE user_id = check_user_id 
        AND is_active = true
    );
END;
$$;

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
    SELECT organization_id INTO primary_org_id
    FROM organization_members
    WHERE user_id = check_user_id
    AND is_primary = true
    AND is_active = true
    LIMIT 1;
    
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

-- Get user's platform role (if any)
DROP FUNCTION IF EXISTS get_platform_role(UUID);
CREATE OR REPLACE FUNCTION get_platform_role(check_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    admin_role TEXT;
BEGIN
    SELECT role INTO admin_role
    FROM platform_admins
    WHERE user_id = check_user_id
    AND is_active = true
    LIMIT 1;
    RETURN admin_role;
END;
$$;

-- =====================================================
-- STEP 8: CREATE RLS POLICIES
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

-- Platform Admins: Only platform admins can view this table
DROP POLICY IF EXISTS "Platform admins view platform_admins" ON platform_admins;
CREATE POLICY "Platform admins view platform_admins" ON platform_admins
    FOR SELECT USING (
        is_platform_admin(auth.uid())
        OR user_id = auth.uid()  -- Users can see their own platform status
    );

DROP POLICY IF EXISTS "Service role full access to platform_admins" ON platform_admins;
CREATE POLICY "Service role full access to platform_admins" ON platform_admins
    FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- STEP 9: GRANTS
-- =====================================================

GRANT ALL ON organizations TO service_role;
GRANT ALL ON organization_members TO service_role;
GRANT ALL ON organization_settings TO service_role;
GRANT ALL ON platform_admins TO service_role;

GRANT SELECT ON organizations TO authenticated;
GRANT SELECT ON organization_members TO authenticated;
GRANT SELECT ON organization_settings TO authenticated;
GRANT SELECT ON platform_admins TO authenticated;

GRANT EXECUTE ON FUNCTION is_platform_admin TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_organization_ids TO authenticated;
GRANT EXECUTE ON FUNCTION is_org_member TO authenticated;
GRANT EXECUTE ON FUNCTION get_org_role TO authenticated;
GRANT EXECUTE ON FUNCTION get_primary_organization TO authenticated;
GRANT EXECUTE ON FUNCTION get_platform_role TO authenticated;

-- =====================================================
-- STEP 10: SEED INITIAL DATA
-- =====================================================

-- Create Two Fungis Finishing organization
INSERT INTO organizations (id, name, slug, primary_trade, province, country, subscription_tier, subscription_status, created_at)
VALUES (
    'a0000000-0000-0000-0000-000000000002',
    'Two Fungis Finishing',
    'two-fungis',
    'Finishing',
    'British Columbia',
    'CA',
    'founding_lifetime',
    'active',
    NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- Create settings for Two Fungis
INSERT INTO organization_settings (organization_id, primary_color, secondary_color, default_tax_rate, timezone, currency)
VALUES (
    'a0000000-0000-0000-0000-000000000002',
    '#10b981',
    '#0a0a0a',
    12.00,  -- BC PST+GST
    'America/Vancouver',
    'CAD'
)
ON CONFLICT (organization_id) DO NOTHING;

-- =====================================================
-- STEP 11: VERIFICATION
-- =====================================================

DO $$
DECLARE
    twofungis_org_exists BOOLEAN;
    tables_created INTEGER;
BEGIN
    SELECT EXISTS(SELECT 1 FROM organizations WHERE slug = 'two-fungis') INTO twofungis_org_exists;
    SELECT COUNT(*) INTO tables_created FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('organizations', 'organization_members', 'organization_settings', 'platform_admins');
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TRADEOS PHASE 1A - Organization Foundation Complete';
    RAISE NOTICE 'Version: 1.1.0 (Revised Architecture)';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables Created: % of 4', tables_created;
    RAISE NOTICE '  - organizations';
    RAISE NOTICE '  - organization_members';
    RAISE NOTICE '  - organization_settings';
    RAISE NOTICE '  - platform_admins';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Two Fungis Organization: %', CASE WHEN twofungis_org_exists THEN 'CREATED' ELSE 'MISSING' END;
    RAISE NOTICE '  Province: British Columbia';
    RAISE NOTICE '  Timezone: America/Vancouver';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ARCHITECTURE NOTE:';
    RAISE NOTICE 'Platform exists ABOVE organizations as a system context.';
    RAISE NOTICE 'Platform admins are tracked in platform_admins table.';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Run assign_scott_marshall_roles() to set up roles';
    RAISE NOTICE '2. Existing TFCS system remains functional';
    RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- STEP 12: USER ASSIGNMENT FUNCTION
-- =====================================================

DROP FUNCTION IF EXISTS assign_scott_marshall_roles();
CREATE OR REPLACE FUNCTION assign_scott_marshall_roles()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    scott_user_id UUID;
    twofungis_org_id UUID := 'a0000000-0000-0000-0000-000000000002';
    result_message TEXT := '';
BEGIN
    -- Find Scott's user ID by email
    SELECT id INTO scott_user_id
    FROM auth.users
    WHERE email = 'inbox@twofungis.ca'
    LIMIT 1;
    
    IF scott_user_id IS NULL THEN
        RETURN 'ERROR: User inbox@twofungis.ca not found. Please ensure the user has logged in at least once.';
    END IF;
    
    -- 1. Assign Platform Administrator role (system-level)
    INSERT INTO platform_admins (
        user_id, role, user_email, user_name,
        is_active, granted_at, created_at
    )
    VALUES (
        scott_user_id, 'platform_admin', 'inbox@twofungis.ca', 'Scott Marshall',
        true, NOW(), NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        role = 'platform_admin',
        is_active = true,
        updated_at = NOW();
    
    result_message := result_message || 'Platform Admin: ASSIGNED' || chr(10);
    
    -- 2. Assign Company Owner role for Two Fungis
    INSERT INTO organization_members (
        organization_id, user_id, role, user_email, user_name,
        is_active, is_primary, accepted_at, created_at
    )
    VALUES (
        twofungis_org_id, scott_user_id, 'owner', 'inbox@twofungis.ca', 'Scott Marshall',
        true, true, NOW(), NOW()
    )
    ON CONFLICT (organization_id, user_id) DO UPDATE SET
        role = 'owner',
        is_active = true,
        is_primary = true,
        updated_at = NOW();
    
    result_message := result_message || 'Two Fungis Owner: ASSIGNED (Primary Workspace)' || chr(10);
    
    RETURN 'SUCCESS:' || chr(10) || result_message || chr(10) || 
           'Scott Marshall now has:' || chr(10) ||
           '  - Platform Administrator access (system-level)' || chr(10) ||
           '  - Company Owner role at Two Fungis Finishing (primary workspace)';
END;
$$;

GRANT EXECUTE ON FUNCTION assign_scott_marshall_roles TO service_role;

-- =====================================================
-- OUTPUT
-- =====================================================

SELECT 'Phase 1A Migration (v1.1.0) completed successfully!' as status;
