-- =====================================================
-- TFCS MAINFRAME - Foundation Database Schema
-- Version: 1.0.0
-- Run this in Supabase SQL Editor
-- =====================================================
-- 
-- ARCHITECTURE OVERVIEW:
-- TFCS Mainframe is an internal operational system for Two Fungis Finishing.
-- It tracks ALL meaningful business actions across TradeOS and TFCS itself.
-- 
-- ROLES:
-- - Owner: Full access to everything, can manage users and view private events
-- - Manager: Operational access, can manage projects/employees, limited visibility
-- - Employee: Restricted access, can view assigned work and log own activities
--
-- ACTIVITY EVENTS: Permanent operational history
-- NOTIFICATIONS: Temporary alerts derived from events
-- =====================================================

-- 1. TFCS USER ROLES
-- Stores role assignments for Mainframe access
-- Each user can only have ONE role (enforced by UNIQUE constraint)
CREATE TABLE IF NOT EXISTS tfcs_user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'employee')),
    
    -- Assignment metadata
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    deactivated_at TIMESTAMPTZ,
    deactivated_by UUID REFERENCES auth.users(id),
    
    -- Profile cache (for quick lookups without joins)
    user_email TEXT,
    user_name TEXT,
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. TFCS ACTIVITY EVENTS
-- Permanent operational history - every significant action creates an event
-- This is the CORE of TFCS Mainframe - the single source of truth for what happened
--
-- CATEGORIES (Business domains):
-- - opportunities: Lead tracking, client inquiries
-- - estimates: Quote drafts, pricing calculations
-- - quotes: Formal client quotes, proposals
-- - projects: Active jobs, milestones
-- - production: Production library, templates, rates
-- - documents: Files, contracts, attachments
-- - expenses: Cost tracking, receipts
-- - invoices: Billing, payments
-- - materials: Material requests, inventory
-- - tools: Tool requests, equipment
-- - reports: Daily reports, progress updates
-- - team: User management, role changes
-- - settings: System configuration
--
-- ACTION TYPES:
-- create, update, delete, send, approve, reject, complete, assign, upload, download, view
CREATE TABLE IF NOT EXISTS tfcs_activity_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- WHO performed the action
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_role TEXT NOT NULL,           -- Role at time of action (owner/manager/employee)
    user_name TEXT,                     -- Display name at time of action
    user_email TEXT,                    -- Email at time of action
    
    -- WHAT happened (the action)
    action TEXT NOT NULL,               -- Human-readable: "Created quote #Q-0001"
    action_type TEXT NOT NULL CHECK (action_type IN (
        'create', 'update', 'delete', 'send', 'approve', 'reject', 
        'complete', 'assign', 'upload', 'download', 'view', 'login',
        'status_change', 'payment', 'reminder', 'archive', 'restore'
    )),
    
    -- WHAT was affected (the object)
    object_type TEXT NOT NULL CHECK (object_type IN (
        'opportunity', 'estimate', 'quote', 'project', 'milestone',
        'production_item', 'document', 'expense', 'invoice', 'payment',
        'material_request', 'tool_request', 'daily_report', 'user', 
        'role', 'setting', 'notification'
    )),
    object_id UUID,                     -- ID of the affected object
    object_name TEXT,                   -- Display name: "Kitchen Renovation - Johnson"
    object_reference TEXT,              -- Short reference: "Q-0001", "INV-0042"
    
    -- CATEGORY (business domain)
    category TEXT NOT NULL CHECK (category IN (
        'opportunities', 'estimates', 'quotes', 'projects', 'production',
        'documents', 'expenses', 'invoices', 'materials', 'tools',
        'reports', 'team', 'settings'
    )),
    
    -- CONTEXT (optional details)
    reason TEXT,                        -- Why: "Client requested changes"
    previous_value TEXT,                -- For updates: old status/value
    new_value TEXT,                     -- For updates: new status/value
    details JSONB,                      -- Additional structured data
    
    -- RELATED OBJECTS (for cross-referencing)
    related_project_id UUID,            -- Parent project if applicable
    related_user_id UUID,               -- If action involves another user
    
    -- PRIVACY & VISIBILITY
    is_private BOOLEAN DEFAULT false,   -- Owner-only visibility
    
    -- SOURCE TRACKING
    source TEXT DEFAULT 'tradeos',      -- 'tradeos' or 'mainframe'
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TFCS NOTIFICATIONS
-- Temporary alerts derived from Activity Events
-- Notifications are transient - they can be dismissed, archived, or expire
-- Activity Events remain permanent for historical record
CREATE TABLE IF NOT EXISTS tfcs_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- WHO should see this
    recipient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_role TEXT,                -- Role at time of notification creation
    
    -- SOURCE (link to the activity that triggered this)
    activity_event_id UUID REFERENCES tfcs_activity_events(id) ON DELETE SET NULL,
    
    -- CONTENT
    title TEXT NOT NULL,                -- "New Quote Created"
    message TEXT,                       -- "Marshall created Quote #Q-0001 for Johnson Kitchen"
    icon TEXT,                          -- Icon identifier for UI
    
    -- TYPE & PRIORITY
    notification_type TEXT DEFAULT 'info' CHECK (notification_type IN (
        'info',           -- General information
        'success',        -- Positive outcome
        'warning',        -- Needs attention
        'error',          -- Problem occurred
        'action_required' -- User must take action
    )),
    priority INTEGER DEFAULT 0,         -- 0=normal, 1=important, 2=urgent
    
    -- CATEGORY (matches activity event categories for filtering)
    category TEXT,
    
    -- STATUS
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    is_dismissed BOOLEAN DEFAULT false,
    dismissed_at TIMESTAMPTZ,
    
    -- NAVIGATION
    action_url TEXT,                    -- Where to navigate when clicked
    action_label TEXT,                  -- "View Quote", "Open Project"
    
    -- LIFECYCLE
    expires_at TIMESTAMPTZ,             -- Auto-dismiss after this time
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TFCS SETTINGS
-- System-wide configuration for Mainframe
-- Only Owners can modify these settings
CREATE TABLE IF NOT EXISTS tfcs_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB,
    description TEXT,
    category TEXT DEFAULT 'general',    -- general, notifications, permissions, appearance
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TFCS NOTIFICATION PREFERENCES
-- Per-user notification settings
CREATE TABLE IF NOT EXISTS tfcs_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Which categories to receive notifications for
    categories_enabled JSONB DEFAULT '["quotes", "invoices", "projects", "team"]'::jsonb,
    
    -- Delivery preferences
    in_app_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT false,
    email_frequency TEXT DEFAULT 'instant' CHECK (email_frequency IN ('instant', 'daily', 'weekly', 'never')),
    
    -- Quiet hours
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- =====================================================
-- INDEXES
-- Optimized for common query patterns
-- =====================================================

-- User Roles indexes
CREATE INDEX IF NOT EXISTS idx_tfcs_user_roles_user_id ON tfcs_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_tfcs_user_roles_role ON tfcs_user_roles(role);
CREATE INDEX IF NOT EXISTS idx_tfcs_user_roles_active ON tfcs_user_roles(is_active) WHERE is_active = true;

-- Activity Events indexes (heavily queried)
CREATE INDEX IF NOT EXISTS idx_tfcs_activity_events_user_id ON tfcs_activity_events(user_id);
CREATE INDEX IF NOT EXISTS idx_tfcs_activity_events_category ON tfcs_activity_events(category);
CREATE INDEX IF NOT EXISTS idx_tfcs_activity_events_object ON tfcs_activity_events(object_type, object_id);
CREATE INDEX IF NOT EXISTS idx_tfcs_activity_events_created ON tfcs_activity_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tfcs_activity_events_action_type ON tfcs_activity_events(action_type);
CREATE INDEX IF NOT EXISTS idx_tfcs_activity_events_project ON tfcs_activity_events(related_project_id) WHERE related_project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tfcs_activity_events_source ON tfcs_activity_events(source);
CREATE INDEX IF NOT EXISTS idx_tfcs_activity_events_private ON tfcs_activity_events(is_private) WHERE is_private = true;

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_tfcs_notifications_recipient ON tfcs_notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_tfcs_notifications_unread ON tfcs_notifications(recipient_user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_tfcs_notifications_category ON tfcs_notifications(category);
CREATE INDEX IF NOT EXISTS idx_tfcs_notifications_expires ON tfcs_notifications(expires_at) WHERE expires_at IS NOT NULL;

-- Notification preferences index
CREATE INDEX IF NOT EXISTS idx_tfcs_notification_prefs_user ON tfcs_notification_preferences(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Implements role-based access control
-- =====================================================

ALTER TABLE tfcs_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tfcs_activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tfcs_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tfcs_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tfcs_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user has a specific role
CREATE OR REPLACE FUNCTION tfcs_has_role(check_user_id UUID, check_role TEXT)
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

-- Helper function: Check if user has any mainframe role
CREATE OR REPLACE FUNCTION tfcs_has_any_role(check_user_id UUID)
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

-- Helper function: Get user's role
CREATE OR REPLACE FUNCTION tfcs_get_role(check_user_id UUID)
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
-- USER ROLES POLICIES
-- =====================================================

-- Everyone with a role can view all active roles (for team visibility)
CREATE POLICY "Mainframe users can view all roles" ON tfcs_user_roles
    FOR SELECT USING (
        tfcs_has_any_role(auth.uid()) AND is_active = true
    );

-- Service role has full access (for backend operations)
CREATE POLICY "Service role full access to roles" ON tfcs_user_roles
    FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- ACTIVITY EVENTS POLICIES
-- =====================================================

-- Activity visibility based on role hierarchy
-- Owners: See everything including private events
-- Managers: See non-private events
-- Employees: See their own events and non-private events
CREATE POLICY "Activity visibility by role" ON tfcs_activity_events
    FOR SELECT USING (
        -- User can always see their own events
        auth.uid() = user_id
        OR
        -- Owners see everything
        tfcs_has_role(auth.uid(), 'owner')
        OR
        -- Managers and Employees see non-private events if they have a role
        (is_private = false AND tfcs_has_any_role(auth.uid()))
    );

-- Only service role can insert events (via backend)
CREATE POLICY "Service role full access to events" ON tfcs_activity_events
    FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- NOTIFICATIONS POLICIES
-- =====================================================

-- Users can only see their own notifications
CREATE POLICY "Users view own notifications" ON tfcs_notifications
    FOR SELECT USING (auth.uid() = recipient_user_id);

-- Users can update their own notifications (mark read, dismiss)
CREATE POLICY "Users update own notifications" ON tfcs_notifications
    FOR UPDATE USING (auth.uid() = recipient_user_id);

-- Service role has full access
CREATE POLICY "Service role full access to notifications" ON tfcs_notifications
    FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- SETTINGS POLICIES
-- =====================================================

-- All mainframe users can view settings
CREATE POLICY "Mainframe users view settings" ON tfcs_settings
    FOR SELECT USING (tfcs_has_any_role(auth.uid()));

-- Only owners can modify settings (via backend service role)
CREATE POLICY "Service role full access to settings" ON tfcs_settings
    FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- NOTIFICATION PREFERENCES POLICIES
-- =====================================================

-- Users can view and update their own preferences
CREATE POLICY "Users manage own notification prefs" ON tfcs_notification_preferences
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Service role has full access
CREATE POLICY "Service role full access to notification prefs" ON tfcs_notification_preferences
    FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- GRANTS
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

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION tfcs_has_role TO authenticated;
GRANT EXECUTE ON FUNCTION tfcs_has_any_role TO authenticated;
GRANT EXECUTE ON FUNCTION tfcs_get_role TO authenticated;

-- =====================================================
-- INITIAL DATA SEEDING
-- =====================================================

-- Insert default settings
INSERT INTO tfcs_settings (key, value, description, category) VALUES
    ('company_name', '"Two Fungis Finishing"', 'Company name for Mainframe', 'general'),
    ('activity_retention_days', '365', 'Days to retain activity events (0 = forever)', 'general'),
    ('notification_auto_dismiss_days', '30', 'Days before notifications auto-dismiss', 'notifications'),
    ('default_notification_categories', '["quotes", "invoices", "projects", "team"]', 'Default enabled notification categories for new users', 'notifications')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- ASSIGN INITIAL OWNER
-- This assigns inbox@twofungis.ca as the Owner
-- Must be run AFTER the user has registered in Supabase Auth
-- =====================================================

-- Create function to assign owner role by email
CREATE OR REPLACE FUNCTION tfcs_assign_owner_by_email(owner_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_user_id UUID;
    result_message TEXT;
BEGIN
    -- Find user by email in auth.users
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = owner_email
    LIMIT 1;
    
    IF target_user_id IS NULL THEN
        RETURN 'User not found: ' || owner_email;
    END IF;
    
    -- Insert or update role
    INSERT INTO tfcs_user_roles (user_id, role, user_email, notes, assigned_at)
    VALUES (target_user_id, 'owner', owner_email, 'Initial owner assignment', NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        role = 'owner',
        is_active = true,
        updated_at = NOW(),
        notes = 'Role updated to owner';
    
    RETURN 'Owner role assigned to: ' || owner_email;
END;
$$;

GRANT EXECUTE ON FUNCTION tfcs_assign_owner_by_email TO service_role;

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 'TFCS Mainframe foundation schema created successfully!' as status;
SELECT 'Tables created: tfcs_user_roles, tfcs_activity_events, tfcs_notifications, tfcs_settings, tfcs_notification_preferences' as tables;
SELECT 'Helper functions: tfcs_has_role, tfcs_has_any_role, tfcs_get_role, tfcs_assign_owner_by_email' as functions;
SELECT '---' as separator;
SELECT 'IMPORTANT: Run the following to assign the initial owner:' as instruction;
SELECT 'SELECT tfcs_assign_owner_by_email(''inbox@twofungis.ca'');' as command;
