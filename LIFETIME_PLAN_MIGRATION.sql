-- ============================================================
-- TradeOS: Founding Lifetime (Elite) Plan Migration
-- ============================================================
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add new columns to users_profile for plan management
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'trial' CHECK (plan_type IN ('trial', 'pro', 'elite', 'lifetime_elite'));
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS plan_status TEXT DEFAULT 'active' CHECK (plan_status IN ('active', 'inactive'));
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS lifetime_purchased_at TIMESTAMPTZ;
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'CA';

-- 2. Create the founding lifetime counter table (single row for seat tracking)
CREATE TABLE IF NOT EXISTS founding_lifetime_counter (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  max_seats INTEGER NOT NULL DEFAULT 100,
  seats_sold INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  region_lock TEXT NOT NULL DEFAULT 'CA',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the initial row if it doesn't exist
INSERT INTO founding_lifetime_counter (id, max_seats, seats_sold, is_active, region_lock)
VALUES (1, 100, 0, true, 'CA')
ON CONFLICT (id) DO NOTHING;

-- 3. Create lifetime_purchases table for audit trail
CREATE TABLE IF NOT EXISTS lifetime_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_intent_id TEXT NOT NULL,
  stripe_session_id TEXT,
  amount NUMERIC NOT NULL DEFAULT 599,
  currency TEXT NOT NULL DEFAULT 'CAD',
  country TEXT NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_lifetime UNIQUE (user_id)
);

-- 4. RLS Policies

-- Enable RLS
ALTER TABLE founding_lifetime_counter ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifetime_purchases ENABLE ROW LEVEL SECURITY;

-- founding_lifetime_counter: Anyone can read (to see seats remaining), but no one can modify directly
CREATE POLICY "Anyone can view lifetime counter" ON founding_lifetime_counter
  FOR SELECT USING (true);

-- lifetime_purchases: Users can only view their own purchase
CREATE POLICY "Users can view own lifetime purchase" ON lifetime_purchases
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert/update (handled by backend)
-- Note: For Supabase, we'll use the service role key for backend operations

-- 5. Create a function to safely increment seats (atomic operation)
CREATE OR REPLACE FUNCTION increment_lifetime_seats()
RETURNS TABLE (success BOOLEAN, seats_remaining INTEGER, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_seats INTEGER;
  max_allowed INTEGER;
  active_status BOOLEAN;
BEGIN
  -- Lock the row for update
  SELECT seats_sold, max_seats, is_active 
  INTO current_seats, max_allowed, active_status
  FROM founding_lifetime_counter
  WHERE id = 1
  FOR UPDATE;
  
  -- Check if still active
  IF NOT active_status THEN
    RETURN QUERY SELECT false, 0, 'Lifetime offer is no longer available'::TEXT;
    RETURN;
  END IF;
  
  -- Check if seats available
  IF current_seats >= max_allowed THEN
    -- Deactivate the offer
    UPDATE founding_lifetime_counter SET is_active = false, updated_at = NOW() WHERE id = 1;
    RETURN QUERY SELECT false, 0, 'All founding memberships have been claimed'::TEXT;
    RETURN;
  END IF;
  
  -- Increment seats
  UPDATE founding_lifetime_counter 
  SET seats_sold = seats_sold + 1, 
      updated_at = NOW(),
      is_active = CASE WHEN seats_sold + 1 >= max_seats THEN false ELSE true END
  WHERE id = 1;
  
  RETURN QUERY SELECT true, (max_allowed - current_seats - 1), NULL::TEXT;
END;
$$;

-- 6. Create function to check seats availability
CREATE OR REPLACE FUNCTION get_lifetime_seats_status()
RETURNS TABLE (seats_remaining INTEGER, is_available BOOLEAN, region_lock TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (max_seats - seats_sold)::INTEGER as seats_remaining,
    (is_active AND seats_sold < max_seats) as is_available,
    founding_lifetime_counter.region_lock
  FROM founding_lifetime_counter
  WHERE id = 1;
END;
$$;

-- ============================================================
-- DONE! Run this SQL in Supabase SQL Editor
-- ============================================================
