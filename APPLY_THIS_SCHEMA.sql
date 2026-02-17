-- ============================================================
-- TradeOS CONSOLIDATED Database Migration
-- ============================================================
-- This script is SAFE to run multiple times (uses IF NOT EXISTS)
-- Copy and paste this ENTIRE script into your Supabase SQL Editor
-- Go to: Supabase Dashboard > SQL Editor > New Query > Paste > Run
-- ============================================================

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- STEP 1: ADD MISSING COLUMNS TO users_profile
-- ============================================================
-- These columns are needed for onboarding and contractor profiles

ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'contractor';
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS skills TEXT[];
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS certifications TEXT[];
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS years_experience INTEGER DEFAULT 0;
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS service_areas TEXT[];
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS portfolio_urls TEXT[];
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS rating_avg NUMERIC DEFAULT 0;
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- Add constraint to user_role if it doesn't exist
DO $$ BEGIN
  ALTER TABLE users_profile ADD CONSTRAINT users_profile_user_role_check 
    CHECK (user_role IN ('contractor', 'customer', 'admin'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- STEP 2: ADD client_approval_token TO projects TABLE
-- ============================================================
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_approval_token TEXT;

-- ============================================================
-- STEP 3: CREATE project_milestones TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  percentage_of_contract NUMERIC DEFAULT 0 CHECK (percentage_of_contract >= 0 AND percentage_of_contract <= 100),
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

-- Indexes for milestones
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_user_id ON project_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON project_milestones(status);

-- RLS for project_milestones
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own milestones" ON project_milestones FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own milestones" ON project_milestones FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own milestones" ON project_milestones FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own milestones" ON project_milestones FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Trigger for updated_at (create function first if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_milestones_updated_at ON project_milestones;
CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON project_milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STEP 4: CREATE client_approval_tokens TABLE
-- ============================================================
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

CREATE INDEX IF NOT EXISTS idx_approval_tokens_token ON client_approval_tokens(token);
CREATE INDEX IF NOT EXISTS idx_approval_tokens_project_id ON client_approval_tokens(project_id);

ALTER TABLE client_approval_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own tokens" ON client_approval_tokens FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own tokens" ON client_approval_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own tokens" ON client_approval_tokens FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own tokens" ON client_approval_tokens FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can read valid tokens" ON client_approval_tokens FOR SELECT USING (is_active = true AND expires_at > NOW());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- STEP 5: CREATE milestone_approval_log TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS milestone_approval_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_id UUID REFERENCES project_milestones(id) ON DELETE CASCADE NOT NULL,
  token_id UUID REFERENCES client_approval_tokens(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('viewed', 'approved', 'comment_added', 'reopened')),
  comment TEXT,
  client_name TEXT,
  client_ip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_log_milestone_id ON milestone_approval_log(milestone_id);

ALTER TABLE milestone_approval_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can insert approval logs" ON milestone_approval_log FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view logs for their milestones" ON milestone_approval_log FOR SELECT USING (
    milestone_id IN (SELECT id FROM project_milestones WHERE user_id = auth.uid())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- STEP 6: CREATE contractor_reviews TABLE
-- ============================================================
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

CREATE INDEX IF NOT EXISTS idx_reviews_contractor_id ON contractor_reviews(contractor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON contractor_reviews(rating);

ALTER TABLE contractor_reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can view reviews" ON contractor_reviews FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert reviews" ON contractor_reviews FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own reviews" ON contractor_reviews FOR UPDATE USING (auth.uid() = reviewer_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own reviews" ON contractor_reviews FOR DELETE USING (auth.uid() = reviewer_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP TRIGGER IF EXISTS update_reviews_updated_at ON contractor_reviews;
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON contractor_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STEP 7: CREATE contractor_badges TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS contractor_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_type TEXT NOT NULL CHECK (badge_type IN (
    'verified_contractor', 'top_rated', 'elite_member', 
    'fast_responder', 'early_adopter', 'milestone_master', 'project_pro'
  )),
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_badges_contractor_id ON contractor_badges(contractor_id);

ALTER TABLE contractor_badges ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can view badges" ON contractor_badges FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- STEP 8: CREATE portfolio_images TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS portfolio_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  category TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_contractor_id ON portfolio_images(contractor_id);

ALTER TABLE portfolio_images ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can view portfolio" ON portfolio_images FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own portfolio" ON portfolio_images FOR INSERT WITH CHECK (auth.uid() = contractor_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own portfolio" ON portfolio_images FOR UPDATE USING (auth.uid() = contractor_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own portfolio" ON portfolio_images FOR DELETE USING (auth.uid() = contractor_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- STEP 9: HELPER FUNCTIONS FOR CLIENT APPROVAL
-- ============================================================

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
  SELECT * INTO token_record 
  FROM client_approval_tokens 
  WHERE token = approval_token 
    AND is_active = true 
    AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  UPDATE client_approval_tokens 
  SET last_accessed_at = NOW(), access_count = access_count + 1
  WHERE token = approval_token;
  
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
  SELECT * INTO token_record 
  FROM client_approval_tokens 
  WHERE token = approval_token 
    AND is_active = true 
    AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired link');
  END IF;
  
  SELECT * INTO milestone_record 
  FROM project_milestones 
  WHERE id = milestone_uuid 
    AND project_id = token_record.project_id
    AND status = 'submitted';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Milestone not found or not available for approval');
  END IF;
  
  UPDATE project_milestones 
  SET 
    status = 'approved',
    approved_at = NOW(),
    client_comment = COALESCE(client_comment_text, client_comment)
  WHERE id = milestone_uuid;
  
  INSERT INTO milestone_approval_log (milestone_id, token_id, action, comment, client_name)
  VALUES (milestone_uuid, token_record.id, 'approved', client_comment_text, client_name_input);
  
  RETURN jsonb_build_object('success', true, 'message', 'Milestone approved successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update contractor rating automatically
CREATE OR REPLACE FUNCTION update_contractor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users_profile
  SET 
    rating_avg = (
      SELECT COALESCE(AVG(rating)::NUMERIC, 0)
      FROM contractor_reviews
      WHERE contractor_id = COALESCE(NEW.contractor_id, OLD.contractor_id)
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM contractor_reviews
      WHERE contractor_id = COALESCE(NEW.contractor_id, OLD.contractor_id)
    )
  WHERE user_id = COALESCE(NEW.contractor_id, OLD.contractor_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_rating_on_review ON contractor_reviews;
CREATE TRIGGER update_rating_on_review
  AFTER INSERT OR UPDATE OR DELETE ON contractor_reviews
  FOR EACH ROW EXECUTE FUNCTION update_contractor_rating();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_milestones_by_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION approve_milestone_by_token(TEXT, UUID, TEXT, TEXT) TO anon, authenticated;

-- ============================================================
-- DONE! Your database is now ready for TradeOS
-- ============================================================
