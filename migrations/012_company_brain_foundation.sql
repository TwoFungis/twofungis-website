-- =====================================================
-- COMPANY BRAIN FOUNDATION - DATABASE MIGRATION
-- Specification 1.2
-- =====================================================
-- This migration creates the database structure for Company Brain.
-- The permanent conversation and action architecture.
--
-- Tables:
-- 1. company_brain_threads - Conversation threads with context
-- 2. company_brain_messages - Messages within threads
-- 3. company_brain_actions - Action execution history
-- =====================================================

-- =====================================================
-- 1. CONVERSATION THREADS
-- =====================================================
-- Each thread is tied to a context (general, project, opportunity, etc.)
-- The Brain maintains one continuous company conversation
-- while automatically creating context threads.

CREATE TABLE IF NOT EXISTS company_brain_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Context identification
    context_type TEXT NOT NULL DEFAULT 'general',
    context_id TEXT,  -- e.g., project UUID, client UUID
    context_name TEXT,  -- Human-readable: "East Peak Project"
    
    -- Metadata
    message_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique thread per user per context
    UNIQUE(user_id, context_type, context_id)
);

-- Index for fast thread lookup
CREATE INDEX IF NOT EXISTS idx_brain_threads_user ON company_brain_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_brain_threads_context ON company_brain_threads(context_type, context_id);
CREATE INDEX IF NOT EXISTS idx_brain_threads_updated ON company_brain_threads(updated_at DESC);


-- =====================================================
-- 2. CONVERSATION MESSAGES
-- =====================================================
-- Messages within each thread.
-- Supports user, brain, and system messages.
-- Stores context snapshot at time of message.

CREATE TABLE IF NOT EXISTS company_brain_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES company_brain_threads(id) ON DELETE CASCADE,
    
    -- Message content
    role TEXT NOT NULL CHECK (role IN ('user', 'brain', 'system')),
    content TEXT NOT NULL,
    
    -- Context at time of message (JSON)
    -- Stores: current page, selected record, etc.
    context_snapshot JSONB,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- For future: AI processing metadata
    ai_model TEXT,
    ai_tokens_used INTEGER,
    processing_time_ms INTEGER
);

-- Index for message retrieval
CREATE INDEX IF NOT EXISTS idx_brain_messages_thread ON company_brain_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_brain_messages_created ON company_brain_messages(created_at);


-- =====================================================
-- 3. ACTION HISTORY
-- =====================================================
-- Every Company Brain action follows the pipeline:
-- Intent → Plan → Permission Check → Execute → Activity Log → Result → Undo Window

CREATE TABLE IF NOT EXISTS company_brain_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    thread_id UUID REFERENCES company_brain_threads(id) ON DELETE SET NULL,
    
    -- Action details
    module TEXT NOT NULL,  -- projects, financial, crm, etc.
    action TEXT NOT NULL,  -- create, update, delete, etc.
    parameters JSONB DEFAULT '{}',
    
    -- Pipeline state
    state TEXT NOT NULL DEFAULT 'intent',
    -- States: intent, planning, pending_permission, executing, completed, failed, cancelled, undone
    
    -- Permission tracking
    requires_permission BOOLEAN DEFAULT true,
    permission_granted_at TIMESTAMPTZ,
    permission_granted_by UUID REFERENCES auth.users(id),
    
    -- Execution tracking
    created_at TIMESTAMPTZ DEFAULT NOW(),
    executed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Results
    result JSONB,
    error TEXT,
    
    -- Undo capability
    can_undo BOOLEAN DEFAULT false,
    undo_window_seconds INTEGER DEFAULT 300,  -- 5 minutes
    undone_at TIMESTAMPTZ,
    undo_reason TEXT
);

-- Indexes for action queries
CREATE INDEX IF NOT EXISTS idx_brain_actions_user ON company_brain_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_brain_actions_state ON company_brain_actions(state);
CREATE INDEX IF NOT EXISTS idx_brain_actions_created ON company_brain_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_brain_actions_module ON company_brain_actions(module, action);


-- =====================================================
-- 4. TRIGGER: UPDATE THREAD TIMESTAMP
-- =====================================================
-- Automatically update thread's updated_at when messages are added.

CREATE OR REPLACE FUNCTION update_thread_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE company_brain_threads 
    SET 
        updated_at = NOW(),
        message_count = message_count + 1
    WHERE id = NEW.thread_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_thread_timestamp ON company_brain_messages;
CREATE TRIGGER trigger_update_thread_timestamp
    AFTER INSERT ON company_brain_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_thread_timestamp();


-- =====================================================
-- 5. ROW LEVEL SECURITY
-- =====================================================
-- Users can only access their own threads, messages, and actions.

ALTER TABLE company_brain_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_brain_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_brain_actions ENABLE ROW LEVEL SECURITY;

-- Threads: Users see only their own
DROP POLICY IF EXISTS threads_user_policy ON company_brain_threads;
CREATE POLICY threads_user_policy ON company_brain_threads
    FOR ALL
    USING (auth.uid() = user_id);

-- Messages: Users see messages in their threads
DROP POLICY IF EXISTS messages_user_policy ON company_brain_messages;
CREATE POLICY messages_user_policy ON company_brain_messages
    FOR ALL
    USING (
        thread_id IN (
            SELECT id FROM company_brain_threads WHERE user_id = auth.uid()
        )
    );

-- Actions: Users see only their own
DROP POLICY IF EXISTS actions_user_policy ON company_brain_actions;
CREATE POLICY actions_user_policy ON company_brain_actions
    FOR ALL
    USING (auth.uid() = user_id);


-- =====================================================
-- 6. SERVICE ROLE BYPASS
-- =====================================================
-- Allow service role full access for backend operations.

DROP POLICY IF EXISTS threads_service_policy ON company_brain_threads;
CREATE POLICY threads_service_policy ON company_brain_threads
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS messages_service_policy ON company_brain_messages;
CREATE POLICY messages_service_policy ON company_brain_messages
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS actions_service_policy ON company_brain_actions;
CREATE POLICY actions_service_policy ON company_brain_actions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);


-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Run this migration in Supabase SQL Editor.
-- Company Brain foundation tables are now ready.
