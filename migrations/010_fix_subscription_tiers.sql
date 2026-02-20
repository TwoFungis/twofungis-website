-- MIGRATION: Fix subscription_tier constraint to include lifetime tiers
-- TradeOS - Allow founding_lifetime and lifetime tiers
-- Safe to run multiple times
-- =====================================================

-- Step 1: Drop the existing constraint
ALTER TABLE users_profile DROP CONSTRAINT IF EXISTS users_profile_subscription_tier_check;

-- Step 2: Add new constraint with all valid tiers
ALTER TABLE users_profile ADD CONSTRAINT users_profile_subscription_tier_check 
  CHECK (subscription_tier IN ('trial', 'pro', 'elite', 'lifetime', 'founding_lifetime', 'lifetime_elite'));

-- Step 3: Verify constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'users_profile'::regclass AND contype = 'c';
