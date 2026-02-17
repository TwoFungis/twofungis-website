-- TradeOS Database Schema v3 - Contractor Hub & Reviews
-- Run this SQL in your Supabase SQL Editor AFTER running v2 schema

-- =====================================================
-- 1. CONTRACTOR REVIEWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS contractor_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Review Info
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  client_name TEXT,
  project_name TEXT,
  
  -- Verification
  is_verified BOOLEAN DEFAULT false, -- True if from an actual TradeOS project
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_contractor_id ON contractor_reviews(contractor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON contractor_reviews(rating);

-- RLS for contractor_reviews
ALTER TABLE contractor_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view reviews
CREATE POLICY "Anyone can view reviews" ON contractor_reviews
  FOR SELECT USING (true);

-- Only authenticated users can insert reviews
CREATE POLICY "Authenticated users can insert reviews" ON contractor_reviews
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews" ON contractor_reviews
  FOR UPDATE USING (auth.uid() = reviewer_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews" ON contractor_reviews
  FOR DELETE USING (auth.uid() = reviewer_id);

-- Trigger for updated_at
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON contractor_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. FUNCTION TO UPDATE CONTRACTOR RATING
-- =====================================================
CREATE OR REPLACE FUNCTION update_contractor_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the contractor's average rating and count
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

-- Trigger to update ratings after review changes
DROP TRIGGER IF EXISTS update_rating_on_review ON contractor_reviews;
CREATE TRIGGER update_rating_on_review
  AFTER INSERT OR UPDATE OR DELETE ON contractor_reviews
  FOR EACH ROW EXECUTE FUNCTION update_contractor_rating();

-- =====================================================
-- 3. CONTRACTOR VERIFICATION BADGES
-- =====================================================
CREATE TABLE IF NOT EXISTS contractor_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Badge Info
  badge_type TEXT NOT NULL CHECK (badge_type IN (
    'verified_contractor',
    'top_rated',
    'elite_member',
    'fast_responder',
    'early_adopter',
    'milestone_master',
    'project_pro'
  )),
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  
  -- Validity
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- Index
CREATE INDEX IF NOT EXISTS idx_badges_contractor_id ON contractor_badges(contractor_id);

-- RLS for badges
ALTER TABLE contractor_badges ENABLE ROW LEVEL SECURITY;

-- Anyone can view badges
CREATE POLICY "Anyone can view badges" ON contractor_badges
  FOR SELECT USING (true);

-- Only system can manage badges (via service role)
CREATE POLICY "Only system can insert badges" ON contractor_badges
  FOR INSERT WITH CHECK (false);

-- =====================================================
-- 4. PORTFOLIO IMAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS portfolio_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Image Info
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  category TEXT, -- 'before', 'during', 'after', 'general'
  
  -- Ordering
  sort_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_contractor_id ON portfolio_images(contractor_id);

-- RLS for portfolio_images
ALTER TABLE portfolio_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view portfolio images
CREATE POLICY "Anyone can view portfolio" ON portfolio_images
  FOR SELECT USING (true);

-- Contractors can manage their own portfolio
CREATE POLICY "Users can insert own portfolio" ON portfolio_images
  FOR INSERT WITH CHECK (auth.uid() = contractor_id);

CREATE POLICY "Users can update own portfolio" ON portfolio_images
  FOR UPDATE USING (auth.uid() = contractor_id);

CREATE POLICY "Users can delete own portfolio" ON portfolio_images
  FOR DELETE USING (auth.uid() = contractor_id);

-- =====================================================
-- 5. FUNCTION TO CHECK IF USER IS TOP RATED
-- =====================================================
CREATE OR REPLACE FUNCTION check_top_rated_badge()
RETURNS TRIGGER AS $$
DECLARE
  current_rating NUMERIC;
  current_count INTEGER;
BEGIN
  -- Get current rating stats
  SELECT rating_avg, rating_count INTO current_rating, current_count
  FROM users_profile
  WHERE user_id = NEW.user_id;
  
  -- Award badge if rating >= 4.5 and has at least 5 reviews
  IF current_rating >= 4.5 AND current_count >= 5 THEN
    -- Check if badge already exists
    IF NOT EXISTS (
      SELECT 1 FROM contractor_badges 
      WHERE contractor_id = NEW.user_id 
      AND badge_type = 'top_rated' 
      AND is_active = true
    ) THEN
      INSERT INTO contractor_badges (contractor_id, badge_type, badge_name, badge_description)
      VALUES (
        NEW.user_id, 
        'top_rated', 
        'Top Rated',
        'Maintained a 4.5+ rating with 5+ reviews'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to check for top rated badge
DROP TRIGGER IF EXISTS check_top_rated ON users_profile;
CREATE TRIGGER check_top_rated
  AFTER UPDATE OF rating_avg, rating_count ON users_profile
  FOR EACH ROW EXECUTE FUNCTION check_top_rated_badge();

-- =====================================================
-- 6. PUBLIC PROFILE VIEW
-- =====================================================
CREATE OR REPLACE VIEW public_contractor_profiles AS
SELECT 
  up.user_id,
  up.name,
  up.company_name,
  up.bio,
  up.trade_type,
  up.region,
  up.years_experience,
  up.skills,
  up.certifications,
  up.service_areas,
  up.avatar_url,
  up.rating_avg,
  up.rating_count,
  up.verified,
  up.created_at,
  (SELECT COUNT(*) FROM projects p WHERE p.user_id = up.user_id AND p.status = 'completed') as completed_projects_count,
  (SELECT json_agg(cb.*) FROM contractor_badges cb WHERE cb.contractor_id = up.user_id AND cb.is_active = true) as badges
FROM users_profile up
WHERE up.user_role = 'contractor';

-- Grant access to the view
GRANT SELECT ON public_contractor_profiles TO anon, authenticated;
