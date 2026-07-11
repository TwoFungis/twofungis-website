-- =====================================================
-- TFCS MAINFRAME - Foundation Database Schema
-- Version: 1.0.1 (Corrected - Idempotent)
-- Run this in Supabase SQL Editor
-- =====================================================
-- 
-- This migration is IDEMPOTENT - safe to run multiple times
-- It will drop and recreate policies/functions to ensure consistency
--
-- ARCHITECTURE OVERVIEW:
-- TFCS Mainframe is an internal operational system for Two Fungis Finishing.
-- It tracks ALL meaningful business actions across TradeOS and TFCS itself.
-- =====================================================

-- =====================================================
-- STEP 1: CREATE TABLES (IF NOT EXISTS)
-- =====================================================

-- 1. TFCS USER ROLES
CREATE TABLE IF NOT EXISTS tfcs_user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'employee')),
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    deactivated_at TIMESTAMPTZ,
    deactivated_by UUID REFERENCES auth.users(id),
    user_email TEXT,
    user_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. TFCS ACTIVITY EVENTS
CREATE TABLE IF NOT EXISTS tfcs_activity_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_role TEXT NOT NULL,
    user_name TEXT,
    user_email TEXT,
    action TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN (
        'create', 'update', 'delete', 'send', 'approve', 'reject', 
        'complete', 'assign', 'upload', 'download', 'view', 'login',
        'status_change', 'payment', 'reminder', 'archive', 'restore'
    )),
    object_type TEXT NOT NULL CHECK (object_type IN (
        'opportunity', 'estimate', 'quote', 'project', 'milestone',
        'production_item', 'document', 'expense', 'invoice', 'payment',
        'material_request', 'tool_request', 'daily_report', 'user', 
        'role', 'setting', 'notification'
    )),
    object_id UUID,
    object_name TEXT,
    object_reference TEXT,
    category TEXT NOT NULL CHECK (category IN (
        'opportunities', 'estimates', 'quotes', 'projects', 'production',
        'documents', 'expenses', 'invoices', 'materials', 'tools',
        'reports', 'team', 'settings'
    )),
    reason TEXT,
    previous_value TEXT,
    new_value TEXT,
    details JSONB,
    related_project_id UUID,
    related_user_id UUID,
    is_private BOOLEAN DEFAULT false,
    source TEXT DEFAULT 'tradeos',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TFCS NOTIFICATIONS
CREATE TABLE IF NOT EXISTS tfcs_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_role TEXT,
    activity_event_id UUID REFERENCES tfcs_activity_events(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    message TEXT,
    icon TEXT,
    notification_type TEXT DEFAULT 'info' CHECK (notification_type IN (
        'info', 'success', 'warning', 'error', 'action_required'
    )),
    priority INTEGER DEFAULT 0,
    category TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    is_dismissed BOOLEAN DEFAULT false,
    dismissed_at TIMESTAMPTZ,
    action_url TEXT,
    action_label TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TFCS SETTINGS
CREATE TABLE IF NOT EXISTS tfcs_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB,
    description TEXT,
    category TEXT DEFAULT 'general',
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TFCS NOTIFICATION PREFERENCES
CREATE TABLE IF NOT EXISTS tfcs_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    categories_enabled JSONB DEFAULT '["quotes", "invoices", "projects", "team"]'::jsonb,
    in_app_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT false,
    email_frequency TEXT DEFAULT 'instant' CHECK (email_frequency IN ('instant', 'daily', 'weekly', 'never')),
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- =====================================================
-- STEP 2: CREATE INDEXES (IF NOT EXISTS)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_tfcs_user_roles_user_id ON tfcs_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_tfcs_user_roles_role ON tfcs_user_roles(role);
CREATE INDEX IF NOT EXISTS idx_tfcs_user_roles_active ON tfcs_user_roles(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_tfcs_activity_events_user_id ON tfcs_activity_events(user_id);
CREATE INDEX IF NOT EXISTS idx_tfcs_activity_events_category ON tfcs_activity_events(category);
CREATE INDEX IF NOT EXISTS idx_tfcs_activity_events_object ON tfcs_activity_events(object_type, object_id);
CREATE INDEX IF NOT EXISTS idx_tfcs_activity_events_created ON tfcs_activity_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tfcs_activity_events_action_type ON tfcs_activity_events(action_type);
CREATE INDEX IF NOT EXISTS idx_tfcs_activity_events_project ON tfcs_activity_events(related_project_id) WHERE related_project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tfcs_activity_events_source ON tfcs_activity_events(source);
CREATE INDEX IF NOT EXISTS idx_tfcs_activity_events_private ON tfcs_activity_events(is_private) WHERE is_private = true;

CREATE INDEX IF NOT EXISTS idx_tfcs_notifications_recipient ON tfcs_notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_tfcs_notifications_unread ON tfcs_notifications(recipient_user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_tfcs_notifications_category ON tfcs_notifications(category);
CREATE INDEX IF NOT EXISTS idx_tfcs_notifications_expires ON tfcs_notifications(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tfcs_notification_prefs_user ON tfcs_notification_preferences(user_id);

-- =====================================================
-- STEP 3: ENABLE RLS
-- =====================================================

ALTER TABLE tfcs_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tfcs_activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tfcs_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tfcs_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tfcs_notification_preferences ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: CREATE HELPER FUNCTIONS (DROP FIRST FOR IDEMPOTENCY)
-- =====================================================

DROP FUNCTION IF EXISTS tfcs_has_role(UUID, TEXT);
CREATE FUNCTION tfcs_has_role(check_user_id UUID, check_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM tfcs_user_roles 
        WHERE user_id = check_user_id 
        AND role = check_role 
        AND is_active = true
    );
END;
$$;

DROP FUNCTION IF EXISTS tfcs_has_any_role(UUID);
CREATE FUNCTION tfcs_has_any_role(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM tfcs_user_roles 
        WHERE user_id = check_user_id 
        AND is_active = true
    );
END;
$$;

DROP FUNCTION IF EXISTS tfcs_get_role(UUID);
CREATE FUNCTION tfcs_get_role(check_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role 
    FROM tfcs_user_roles 
    WHERE user_id = check_user_id 
    AND is_active = true
    LIMIT 1;
    RETURN user_role;
END;
$$;

-- =====================================================
-- STEP 5: DROP AND RECREATE RLS POLICIES (IDEMPOTENT)
-- =====================================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Mainframe users can view all roles" ON tfcs_user_roles;
DROP POLICY IF EXISTS "Service role full access to roles" ON tfcs_user_roles;
DROP POLICY IF EXISTS "Activity visibility by role" ON tfcs_activity_events;
DROP POLICY IF EXISTS "Service role full access to events" ON tfcs_activity_events;
DROP POLICY IF EXISTS "Users view own notifications" ON tfcs_notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON tfcs_notifications;
DROP POLICY IF EXISTS "Service role full access to notifications" ON tfcs_notifications;
DROP POLICY IF EXISTS "Mainframe users view settings" ON tfcs_settings;
DROP POLICY IF EXISTS "Service role full access to settings" ON tfcs_settings;
DROP POLICY IF EXISTS "Users manage own notification prefs" ON tfcs_notification_preferences;
DROP POLICY IF EXISTS "Service role full access to notification prefs" ON tfcs_notification_preferences;

-- User Roles Policies
CREATE POLICY "Mainframe users can view all roles" ON tfcs_user_roles
    FOR SELECT USING (
        tfcs_has_any_role(auth.uid()) AND is_active = true
    );

CREATE POLICY "Service role full access to roles" ON tfcs_user_roles
    FOR ALL USING (true) WITH CHECK (true);

-- Activity Events Policies
CREATE POLICY "Activity visibility by role" ON tfcs_activity_events
    FOR SELECT USING (
        auth.uid() = user_id
        OR
        tfcs_has_role(auth.uid(), 'owner')
        OR
        (is_private = false AND tfcs_has_any_role(auth.uid()))
    );

CREATE POLICY "Service role full access to events" ON tfcs_activity_events
    FOR ALL USING (true) WITH CHECK (true);

-- Notifications Policies
CREATE POLICY "Users view own notifications" ON tfcs_notifications
    FOR SELECT USING (auth.uid() = recipient_user_id);

CREATE POLICY "Users update own notifications" ON tfcs_notifications
    FOR UPDATE USING (auth.uid() = recipient_user_id);

CREATE POLICY "Service role full access to notifications" ON tfcs_notifications
    FOR ALL USING (true) WITH CHECK (true);

-- Settings Policies
CREATE POLICY "Mainframe users view settings" ON tfcs_settings
    FOR SELECT USING (tfcs_has_any_role(auth.uid()));

CREATE POLICY "Service role full access to settings" ON tfcs_settings
    FOR ALL USING (true) WITH CHECK (true);

-- Notification Preferences Policies
CREATE POLICY "Users manage own notification prefs" ON tfcs_notification_preferences
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to notification prefs" ON tfcs_notification_preferences
    FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- STEP 6: GRANTS
-- =====================================================

GRANT ALL ON tfcs_user_roles TO service_role;
GRANT ALL ON tfcs_activity_events TO service_role;
GRANT ALL ON tfcs_notifications TO service_role;
GRANT ALL ON tfcs_settings TO service_role;
GRANT ALL ON tfcs_notification_preferences TO service_role;

GRANT SELECT ON tfcs_user_roles TO authenticated;
GRANT SELECT, INSERT ON tfcs_activity_events TO authenticated;
GRANT SELECT, UPDATE ON tfcs_notifications TO authenticated;
GRANT SELECT ON tfcs_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON tfcs_notification_preferences TO authenticated;

GRANT EXECUTE ON FUNCTION tfcs_has_role TO authenticated;
GRANT EXECUTE ON FUNCTION tfcs_has_any_role TO authenticated;
GRANT EXECUTE ON FUNCTION tfcs_get_role TO authenticated;

-- =====================================================
-- STEP 7: SEED DEFAULT SETTINGS
-- =====================================================

INSERT INTO tfcs_settings (key, value, description, category) VALUES
    ('company_name', '"Two Fungis Finishing"', 'Company name for Mainframe', 'general'),
    ('activity_retention_days', '365', 'Days to retain activity events (0 = forever)', 'general'),
    ('notification_auto_dismiss_days', '30', 'Days before notifications auto-dismiss', 'notifications'),
    ('default_notification_categories', '["quotes", "invoices", "projects", "team"]', 'Default enabled notification categories for new users', 'notifications')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- STEP 8: CREATE OWNER ASSIGNMENT FUNCTION
-- =====================================================

DROP FUNCTION IF EXISTS tfcs_assign_owner_by_email(TEXT);

CREATE OR REPLACE FUNCTION tfcs_assign_owner_by_email(owner_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Find user by email in auth.users
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = owner_email
    LIMIT 1;
    
    IF target_user_id IS NULL THEN
        RETURN 'ERROR: User not found with email: ' || owner_email;
    END IF;
    
    -- Insert or update role
    INSERT INTO tfcs_user_roles (user_id, role, user_email, notes, assigned_at)
    VALUES (target_user_id, 'owner', owner_email, 'Initial owner assignment', NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        role = 'owner',
        is_active = true,
        updated_at = NOW(),
        notes = 'Role updated to owner';
    
    RETURN 'SUCCESS: Owner role assigned to ' || owner_email || ' (user_id: ' || target_user_id || ')';
END;
$$;

GRANT EXECUTE ON FUNCTION tfcs_assign_owner_by_email TO service_role;

-- =====================================================
-- STEP 9: VERIFICATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TFCS Mainframe Foundation - Migration Complete';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables: tfcs_user_roles, tfcs_activity_events, tfcs_notifications, tfcs_settings, tfcs_notification_preferences';
    RAISE NOTICE 'Functions: tfcs_has_role, tfcs_has_any_role, tfcs_get_role, tfcs_assign_owner_by_email';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'NEXT STEP: Run the following to assign the initial owner:';
    RAISE NOTICE 'SELECT tfcs_assign_owner_by_email(''inbox@twofungis.ca'');';
    RAISE NOTICE '========================================';
END $$;

-- Output verification
SELECT 'Migration completed successfully!' as status;
