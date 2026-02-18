-- TradeOS Stripe Integration & Lifetime Plan Migration
-- Run this in Supabase SQL Editor

-- =============================================================================
-- 1. UPDATE users_profile TABLE
-- =============================================================================

-- Add subscription/plan columns to users_profile
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'TRIAL' 
  CHECK (plan_type IN ('TRIAL', 'PRO', 'ELITE', 'LIFETIME_ELITE'));

ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS plan_status TEXT DEFAULT 'inactive' 
  CHECK (plan_status IN ('active', 'inactive', 'past_due', 'canceled', 'trialing'));

ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS country TEXT;

ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS lifetime_purchased_at TIMESTAMPTZ;

ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Set default trial period for new users (7 days from now)
-- UPDATE users_profile SET trial_ends_at = NOW() + INTERVAL '7 days' WHERE trial_ends_at IS NULL;

-- =============================================================================
-- 2. CREATE founding_lifetime TABLE (Single-row control table)
-- =============================================================================

CREATE TABLE IF NOT EXISTS founding_lifetime (
  id INT PRIMARY KEY DEFAULT 1,
  max_seats INT NOT NULL DEFAULT 100,
  seats_sold INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  region_lock TEXT NOT NULL DEFAULT 'CA',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1),
  CONSTRAINT valid_seats CHECK (seats_sold >= 0 AND seats_sold <= max_seats)
);

-- Insert the single control row if not exists
INSERT INTO founding_lifetime (id, max_seats, seats_sold, is_active, region_lock)
VALUES (1, 100, 0, TRUE, 'CA')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 3. CREATE lifetime_purchases TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS lifetime_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT NOT NULL,
  stripe_session_id TEXT,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 599.00,
  currency TEXT NOT NULL DEFAULT 'CAD',
  billing_country TEXT,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_lifetime UNIQUE (user_id),
  CONSTRAINT unique_payment_intent UNIQUE (stripe_payment_intent_id)
);

-- =============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on new tables
ALTER TABLE founding_lifetime ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifetime_purchases ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Service role can manage founding_lifetime" ON founding_lifetime;
DROP POLICY IF EXISTS "Anyone can read founding_lifetime" ON founding_lifetime;
DROP POLICY IF EXISTS "Service role can manage lifetime_purchases" ON lifetime_purchases;
DROP POLICY IF EXISTS "Users can read own lifetime_purchases" ON lifetime_purchases;

-- Founding lifetime: Read-only for everyone, service role for writes
CREATE POLICY "Anyone can read founding_lifetime" ON founding_lifetime
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage founding_lifetime" ON founding_lifetime
  FOR ALL USING (auth.role() = 'service_role');

-- Lifetime purchases: Users can read their own, service role manages
CREATE POLICY "Users can read own lifetime_purchases" ON lifetime_purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage lifetime_purchases" ON lifetime_purchases
  FOR ALL USING (auth.role() = 'service_role');

-- Protect plan_type and plan_status from direct user updates
-- Drop existing policy first
DROP POLICY IF EXISTS "Users can update own profile limited" ON users_profile;

-- Users cannot directly update plan fields (must go through server)
-- This policy allows updates except for protected fields
-- Note: We'll rely on the API using service role for plan updates

-- =============================================================================
-- 5. FUNCTIONS FOR ATOMIC OPERATIONS
-- =============================================================================

-- Function to safely increment lifetime seats (atomic)
CREATE OR REPLACE FUNCTION increment_lifetime_seat()
RETURNS TABLE (
  success BOOLEAN,
  seats_sold INT,
  seats_remaining INT,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_seats INT;
  v_max_seats INT;
  v_is_active BOOLEAN;
BEGIN
  -- Lock the row for update to prevent race conditions
  SELECT f.seats_sold, f.max_seats, f.is_active 
  INTO v_current_seats, v_max_seats, v_is_active
  FROM founding_lifetime f
  WHERE f.id = 1
  FOR UPDATE;
  
  -- Check if available
  IF NOT v_is_active THEN
    RETURN QUERY SELECT 
      FALSE,
      v_current_seats,
      v_max_seats - v_current_seats,
      'Founding Lifetime is no longer available'::TEXT;
    RETURN;
  END IF;
  
  IF v_current_seats >= v_max_seats THEN
    RETURN QUERY SELECT 
      FALSE,
      v_current_seats,
      0,
      'All Founding Lifetime seats have been sold'::TEXT;
    RETURN;
  END IF;
  
  -- Increment seats
  UPDATE founding_lifetime 
  SET 
    seats_sold = seats_sold + 1,
    is_active = CASE WHEN seats_sold + 1 >= max_seats THEN FALSE ELSE TRUE END,
    updated_at = NOW()
  WHERE id = 1;
  
  -- Return success
  RETURN QUERY SELECT 
    TRUE,
    v_current_seats + 1,
    v_max_seats - v_current_seats - 1,
    NULL::TEXT;
END;
$$;

-- Function to get lifetime seats status
CREATE OR REPLACE FUNCTION get_lifetime_seats_status()
RETURNS TABLE (
  max_seats INT,
  seats_sold INT,
  seats_remaining INT,
  is_available BOOLEAN,
  region_lock TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    f.max_seats,
    f.seats_sold,
    f.max_seats - f.seats_sold AS seats_remaining,
    f.is_active AND (f.seats_sold < f.max_seats) AS is_available,
    f.region_lock
  FROM founding_lifetime f
  WHERE f.id = 1;
$$;

-- =============================================================================
-- 6. GRANT PERMISSIONS
-- =============================================================================

-- Grant execute on functions to authenticated users (for reading status)
GRANT EXECUTE ON FUNCTION get_lifetime_seats_status() TO authenticated;
GRANT EXECUTE ON FUNCTION get_lifetime_seats_status() TO anon;

-- Only service role can increment seats (called from backend)
GRANT EXECUTE ON FUNCTION increment_lifetime_seat() TO service_role;

-- =============================================================================
-- DONE
-- =============================================================================
-- After running this migration:
-- 1. Backend will use increment_lifetime_seat() for atomic seat claiming
-- 2. Frontend can read founding_lifetime for seats remaining
-- 3. Users cannot modify plan_type/plan_status directly
