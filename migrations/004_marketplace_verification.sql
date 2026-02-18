-- TradeOS Marketplace V1 - Database Migration
-- Run this in Supabase SQL Editor

-- =============================================================================
-- 1. CREATE contractor_profiles_public TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS contractor_profiles_public (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  trade TEXT NOT NULL,
  region TEXT NOT NULL,
  bio TEXT,
  years_experience INT DEFAULT 0,
  accepting_work BOOLEAN DEFAULT TRUE,
  verification_level INT DEFAULT 0 CHECK (verification_level >= 0 AND verification_level <= 4),
  rating_average DECIMAL(3,2) DEFAULT 0.00,
  rating_count INT DEFAULT 0,
  profile_image_url TEXT,
  website_url TEXT,
  phone_public TEXT,
  email_public TEXT,
  is_listed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_marketplace UNIQUE (user_id)
);

-- =============================================================================
-- 2. CREATE contractor_verification TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS contractor_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  identity_verified BOOLEAN DEFAULT FALSE,
  identity_verified_at TIMESTAMPTZ,
  trade_verified BOOLEAN DEFAULT FALSE,
  trade_verified_at TIMESTAMPTZ,
  insurance_verified BOOLEAN DEFAULT FALSE,
  insurance_verified_at TIMESTAMPTZ,
  insurance_expiry_date DATE,
  insurance_document_url TEXT,
  performance_verified BOOLEAN DEFAULT FALSE,
  performance_verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  last_reviewed_at TIMESTAMPTZ,
  last_reviewed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_verification UNIQUE (user_id)
);

-- =============================================================================
-- 3. INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_marketplace_trade ON contractor_profiles_public(trade);
CREATE INDEX IF NOT EXISTS idx_marketplace_region ON contractor_profiles_public(region);
CREATE INDEX IF NOT EXISTS idx_marketplace_verification ON contractor_profiles_public(verification_level DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_listed ON contractor_profiles_public(is_listed) WHERE is_listed = TRUE;
CREATE INDEX IF NOT EXISTS idx_marketplace_accepting ON contractor_profiles_public(accepting_work) WHERE accepting_work = TRUE;

-- =============================================================================
-- 4. ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE contractor_profiles_public ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_verification ENABLE ROW LEVEL SECURITY;

-- Public can read listed profiles
DROP POLICY IF EXISTS "Public can view listed contractors" ON contractor_profiles_public;
CREATE POLICY "Public can view listed contractors" ON contractor_profiles_public
  FOR SELECT USING (is_listed = TRUE);

-- Users can manage their own profile
DROP POLICY IF EXISTS "Users can manage own marketplace profile" ON contractor_profiles_public;
CREATE POLICY "Users can manage own marketplace profile" ON contractor_profiles_public
  FOR ALL USING (auth.uid() = user_id);

-- Service role full access
DROP POLICY IF EXISTS "Service role full access marketplace" ON contractor_profiles_public;
CREATE POLICY "Service role full access marketplace" ON contractor_profiles_public
  FOR ALL USING (auth.role() = 'service_role');

-- Verification table - users can read own, service role manages
DROP POLICY IF EXISTS "Users can view own verification" ON contractor_verification;
CREATE POLICY "Users can view own verification" ON contractor_verification
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages verification" ON contractor_verification;
CREATE POLICY "Service role manages verification" ON contractor_verification
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- 5. FUNCTION TO CALCULATE VERIFICATION LEVEL
-- =============================================================================

CREATE OR REPLACE FUNCTION calculate_verification_level(p_user_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_level INT := 0;
  v_identity BOOLEAN;
  v_trade BOOLEAN;
  v_insurance BOOLEAN;
  v_performance BOOLEAN;
BEGIN
  SELECT 
    identity_verified,
    trade_verified,
    insurance_verified,
    performance_verified
  INTO v_identity, v_trade, v_insurance, v_performance
  FROM contractor_verification
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  IF v_identity THEN v_level := 1; END IF;
  IF v_identity AND v_trade THEN v_level := 2; END IF;
  IF v_identity AND v_trade AND v_insurance THEN v_level := 3; END IF;
  IF v_identity AND v_trade AND v_insurance AND v_performance THEN v_level := 4; END IF;
  
  -- Update the marketplace profile
  UPDATE contractor_profiles_public
  SET verification_level = v_level, updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN v_level;
END;
$$;

-- =============================================================================
-- 6. TRIGGER TO AUTO-UPDATE VERIFICATION LEVEL
-- =============================================================================

CREATE OR REPLACE FUNCTION trigger_update_verification_level()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM calculate_verification_level(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_verification_level_trigger ON contractor_verification;
CREATE TRIGGER update_verification_level_trigger
  AFTER INSERT OR UPDATE ON contractor_verification
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_verification_level();

-- =============================================================================
-- 7. FUNCTION TO GET PUBLIC CONTRACTORS
-- =============================================================================

CREATE OR REPLACE FUNCTION get_public_contractors(
  p_trade TEXT DEFAULT NULL,
  p_region TEXT DEFAULT NULL,
  p_min_verification INT DEFAULT 0,
  p_accepting_only BOOLEAN DEFAULT FALSE,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  company_name TEXT,
  trade TEXT,
  region TEXT,
  bio TEXT,
  years_experience INT,
  accepting_work BOOLEAN,
  verification_level INT,
  rating_average DECIMAL,
  rating_count INT,
  profile_image_url TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    c.user_id,
    c.company_name,
    c.trade,
    c.region,
    c.bio,
    c.years_experience,
    c.accepting_work,
    c.verification_level,
    c.rating_average,
    c.rating_count,
    c.profile_image_url
  FROM contractor_profiles_public c
  WHERE c.is_listed = TRUE
    AND (p_trade IS NULL OR c.trade ILIKE '%' || p_trade || '%')
    AND (p_region IS NULL OR c.region ILIKE '%' || p_region || '%')
    AND c.verification_level >= p_min_verification
    AND (NOT p_accepting_only OR c.accepting_work = TRUE)
  ORDER BY c.verification_level DESC, c.rating_average DESC, c.company_name ASC
  LIMIT p_limit
  OFFSET p_offset;
$$;

GRANT EXECUTE ON FUNCTION get_public_contractors TO anon;
GRANT EXECUTE ON FUNCTION get_public_contractors TO authenticated;

-- =============================================================================
-- DONE
-- =============================================================================
