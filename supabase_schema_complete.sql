-- TradeOS Database Schema - Backward Compatible Update
-- This script safely adds new columns without breaking existing data
-- Run this ONCE in your Supabase SQL Editor

-- =====================================================
-- STEP 1: ADD NEW COLUMNS TO users_profile (SAFE)
-- Using IF NOT EXISTS pattern for safety
-- =====================================================

DO $$ 
BEGIN
    -- Add user_role column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'user_role') THEN
        ALTER TABLE users_profile ADD COLUMN user_role TEXT DEFAULT 'contractor';
    END IF;
    
    -- Add bio column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'bio') THEN
        ALTER TABLE users_profile ADD COLUMN bio TEXT;
    END IF;
    
    -- Add avatar_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'avatar_url') THEN
        ALTER TABLE users_profile ADD COLUMN avatar_url TEXT;
    END IF;
    
    -- Add skills column (array)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'skills') THEN
        ALTER TABLE users_profile ADD COLUMN skills TEXT[];
    END IF;
    
    -- Add certifications column (array)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'certifications') THEN
        ALTER TABLE users_profile ADD COLUMN certifications TEXT[];
    END IF;
    
    -- Add years_experience column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'years_experience') THEN
        ALTER TABLE users_profile ADD COLUMN years_experience INTEGER DEFAULT 0;
    END IF;
    
    -- Add service_areas column (array)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'service_areas') THEN
        ALTER TABLE users_profile ADD COLUMN service_areas TEXT[];
    END IF;
    
    -- Add portfolio_urls column (array)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'portfolio_urls') THEN
        ALTER TABLE users_profile ADD COLUMN portfolio_urls TEXT[];
    END IF;
    
    -- Add rating columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'rating_avg') THEN
        ALTER TABLE users_profile ADD COLUMN rating_avg NUMERIC DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'rating_count') THEN
        ALTER TABLE users_profile ADD COLUMN rating_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add verified column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'verified') THEN
        ALTER TABLE users_profile ADD COLUMN verified BOOLEAN DEFAULT false;
    END IF;
END $$;

-- =====================================================
-- STEP 2: PROJECT MILESTONES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  percentage_of_contract NUMERIC DEFAULT 0,
  milestone_value NUMERIC DEFAULT 0,
  target_date DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'paid')),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  client_comment TEXT,
  internal_notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for milestones
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "milestone_select" ON project_milestones;
DROP POLICY IF EXISTS "milestone_insert" ON project_milestones;
DROP POLICY IF EXISTS "milestone_update" ON project_milestones;
DROP POLICY IF EXISTS "milestone_delete" ON project_milestones;

CREATE POLICY "milestone_select" ON project_milestones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "milestone_insert" ON project_milestones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "milestone_update" ON project_milestones FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "milestone_delete" ON project_milestones FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- STEP 3: CLIENT APPROVAL TOKENS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS client_approval_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  client_name TEXT,
  client_email TEXT,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days'),
  is_active BOOLEAN DEFAULT true,
  last_accessed_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE client_approval_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "token_select_owner" ON client_approval_tokens;
DROP POLICY IF EXISTS "token_select_public" ON client_approval_tokens;
DROP POLICY IF EXISTS "token_insert" ON client_approval_tokens;
DROP POLICY IF EXISTS "token_update" ON client_approval_tokens;

CREATE POLICY "token_select_owner" ON client_approval_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "token_select_public" ON client_approval_tokens FOR SELECT USING (is_active = true AND expires_at > NOW());
CREATE POLICY "token_insert" ON client_approval_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "token_update" ON client_approval_tokens FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- STEP 4: CONTRACTOR REVIEWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS contractor_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  client_name TEXT,
  project_name TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE contractor_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "review_select" ON contractor_reviews;
DROP POLICY IF EXISTS "review_insert" ON contractor_reviews;

CREATE POLICY "review_select" ON contractor_reviews FOR SELECT USING (true);
CREATE POLICY "review_insert" ON contractor_reviews FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- STEP 5: FUNCTION TO GET MILESTONES BY TOKEN
-- =====================================================
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
  SELECT * INTO token_record 
  FROM client_approval_tokens 
  WHERE token = approval_token AND is_active = true AND expires_at > NOW();
  
  IF NOT FOUND THEN RETURN; END IF;
  
  UPDATE client_approval_tokens 
  SET last_accessed_at = NOW(), access_count = access_count + 1
  WHERE token = approval_token;
  
  RETURN QUERY
  SELECT pm.id, pm.name, pm.description, pm.percentage_of_contract, pm.milestone_value,
         pm.target_date, pm.status, pm.submitted_at, pm.approved_at, pm.client_comment,
         p.name as project_name, up.name as contractor_name, up.company_name as contractor_company
  FROM project_milestones pm
  JOIN projects p ON p.id = pm.project_id
  JOIN users_profile up ON up.user_id = pm.user_id
  WHERE pm.project_id = token_record.project_id AND pm.status IN ('submitted', 'approved', 'paid')
  ORDER BY pm.sort_order, pm.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 6: FUNCTION TO APPROVE MILESTONE
-- =====================================================
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
  SELECT * INTO token_record 
  FROM client_approval_tokens 
  WHERE token = approval_token AND is_active = true AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired link');
  END IF;
  
  SELECT * INTO milestone_record 
  FROM project_milestones 
  WHERE id = milestone_uuid AND project_id = token_record.project_id AND status = 'submitted';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Milestone not available for approval');
  END IF;
  
  UPDATE project_milestones 
  SET status = 'approved', approved_at = NOW(), client_comment = COALESCE(client_comment_text, client_comment)
  WHERE id = milestone_uuid;
  
  RETURN jsonb_build_object('success', true, 'message', 'Milestone approved');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_milestones_by_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION approve_milestone_by_token(TEXT, UUID, TEXT, TEXT) TO anon, authenticated;

-- =====================================================
-- DONE! All tables and columns created safely.
-- =====================================================
