-- TradeOS Database Schema v2 - Milestone Approval Engine & Marketplace Foundation
-- Run this SQL in your Supabase SQL Editor AFTER running the initial schema

-- =====================================================
-- 1. UPDATE USERS PROFILE - Add User Role
-- =====================================================
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'contractor' CHECK (user_role IN ('contractor', 'customer', 'admin'));

ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS skills TEXT[], -- Array of skill tags
ADD COLUMN IF NOT EXISTS certifications TEXT[], -- Array of certification names
ADD COLUMN IF NOT EXISTS years_experience INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS service_areas TEXT[], -- Array of regions served
ADD COLUMN IF NOT EXISTS portfolio_urls TEXT[], -- Array of portfolio image URLs
ADD COLUMN IF NOT EXISTS rating_avg NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- =====================================================
-- 2. PROJECT MILESTONES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  
  -- Milestone Info
  name TEXT NOT NULL,
  description TEXT,
  percentage_of_contract NUMERIC DEFAULT 0 CHECK (percentage_of_contract >= 0 AND percentage_of_contract <= 100),
  milestone_value NUMERIC DEFAULT 0,
  target_date DATE,
  
  -- Status Tracking
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'paid')),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  
  -- Client Interaction
  client_comment TEXT,
  internal_notes TEXT,
  
  -- Ordering
  sort_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_user_id ON project_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON project_milestones(status);

-- RLS for project_milestones
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own milestones" ON project_milestones
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own milestones" ON project_milestones
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own milestones" ON project_milestones
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own milestones" ON project_milestones
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON project_milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. CLIENT APPROVAL TOKENS TABLE
-- For secure shareable links
-- =====================================================
CREATE TABLE IF NOT EXISTS client_approval_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Token Info
  token TEXT UNIQUE NOT NULL,
  client_name TEXT,
  client_email TEXT,
  
  -- Access Control
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days'),
  is_active BOOLEAN DEFAULT true,
  last_accessed_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_approval_tokens_token ON client_approval_tokens(token);
CREATE INDEX IF NOT EXISTS idx_approval_tokens_project_id ON client_approval_tokens(project_id);

-- RLS for client_approval_tokens
ALTER TABLE client_approval_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tokens" ON client_approval_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tokens" ON client_approval_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens" ON client_approval_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tokens" ON client_approval_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Allow public read for valid tokens (for client access)
CREATE POLICY "Anyone can read valid tokens" ON client_approval_tokens
  FOR SELECT USING (is_active = true AND expires_at > NOW());

-- =====================================================
-- 4. MILESTONE APPROVAL LOG TABLE
-- Track all approval actions
-- =====================================================
CREATE TABLE IF NOT EXISTS milestone_approval_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_id UUID REFERENCES project_milestones(id) ON DELETE CASCADE NOT NULL,
  token_id UUID REFERENCES client_approval_tokens(id) ON DELETE SET NULL,
  
  -- Action Info
  action TEXT NOT NULL CHECK (action IN ('viewed', 'approved', 'comment_added', 'reopened')),
  comment TEXT,
  client_name TEXT,
  client_ip TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_approval_log_milestone_id ON milestone_approval_log(milestone_id);

-- RLS - Allow inserts from anyone (for client approvals)
ALTER TABLE milestone_approval_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert approval logs" ON milestone_approval_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view logs for their milestones" ON milestone_approval_log
  FOR SELECT USING (
    milestone_id IN (
      SELECT id FROM project_milestones WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- 5. PUBLIC ACCESS FUNCTIONS (for client approval without auth)
-- =====================================================

-- Function to get project milestones by token
CREATE OR REPLACE FUNCTION get_milestones_by_token(approval_token TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  percentage_of_contract NUMERIC,
  milestone_value NUMERIC,
  target_date DATE,
  status TEXT,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  client_comment TEXT,
  project_name TEXT,
  contractor_name TEXT,
  contractor_company TEXT
) AS $$
DECLARE
  token_record client_approval_tokens%ROWTYPE;
BEGIN
  -- Get and validate token
  SELECT * INTO token_record 
  FROM client_approval_tokens 
  WHERE token = approval_token 
    AND is_active = true 
    AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Update access stats
  UPDATE client_approval_tokens 
  SET last_accessed_at = NOW(), access_count = access_count + 1
  WHERE token = approval_token;
  
  -- Return milestones with project info
  RETURN QUERY
  SELECT 
    pm.id,
    pm.name,
    pm.description,
    pm.percentage_of_contract,
    pm.milestone_value,
    pm.target_date,
    pm.status,
    pm.submitted_at,
    pm.approved_at,
    pm.client_comment,
    p.name as project_name,
    up.name as contractor_name,
    up.company_name as contractor_company
  FROM project_milestones pm
  JOIN projects p ON p.id = pm.project_id
  JOIN users_profile up ON up.user_id = pm.user_id
  WHERE pm.project_id = token_record.project_id
    AND pm.status IN ('submitted', 'approved', 'paid')
  ORDER BY pm.sort_order, pm.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve a milestone by token
CREATE OR REPLACE FUNCTION approve_milestone_by_token(
  approval_token TEXT,
  milestone_uuid UUID,
  client_comment_text TEXT DEFAULT NULL,
  client_name_input TEXT DEFAULT 'Client'
)
RETURNS JSONB AS $$
DECLARE
  token_record client_approval_tokens%ROWTYPE;
  milestone_record project_milestones%ROWTYPE;
BEGIN
  -- Validate token
  SELECT * INTO token_record 
  FROM client_approval_tokens 
  WHERE token = approval_token 
    AND is_active = true 
    AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired link');
  END IF;
  
  -- Get milestone and verify it belongs to this project
  SELECT * INTO milestone_record 
  FROM project_milestones 
  WHERE id = milestone_uuid 
    AND project_id = token_record.project_id
    AND status = 'submitted';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Milestone not found or not available for approval');
  END IF;
  
  -- Update milestone
  UPDATE project_milestones 
  SET 
    status = 'approved',
    approved_at = NOW(),
    client_comment = COALESCE(client_comment_text, client_comment)
  WHERE id = milestone_uuid;
  
  -- Log the approval
  INSERT INTO milestone_approval_log (milestone_id, token_id, action, comment, client_name)
  VALUES (milestone_uuid, token_record.id, 'approved', client_comment_text, client_name_input);
  
  RETURN jsonb_build_object('success', true, 'message', 'Milestone approved successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_milestones_by_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION approve_milestone_by_token(TEXT, UUID, TEXT, TEXT) TO anon, authenticated;

-- =====================================================
-- 6. UPDATE PROJECTS TABLE - Add client link field
-- =====================================================
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS client_approval_token TEXT;

-- =====================================================
-- 7. HELPFUL VIEW FOR DASHBOARD STATS
-- =====================================================
CREATE OR REPLACE VIEW milestone_stats AS
SELECT 
  user_id,
  COUNT(*) FILTER (WHERE status = 'submitted') as pending_approval_count,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
  COUNT(*) FILTER (WHERE status = 'paid') as paid_count,
  COALESCE(SUM(milestone_value) FILTER (WHERE status = 'submitted'), 0) as pending_approval_value,
  COALESCE(SUM(milestone_value) FILTER (WHERE status = 'approved'), 0) as approved_value,
  COALESCE(SUM(milestone_value) FILTER (WHERE status = 'paid'), 0) as paid_value,
  COALESCE(SUM(milestone_value), 0) as total_milestone_value
FROM project_milestones
GROUP BY user_id;

-- Note: Views in Supabase inherit the RLS of underlying tables
