-- TradeOS Trial + Locked Access Model Migration
-- Run this in Supabase SQL Editor

-- Add trial and locked mode columns to users_profile
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS grandfathered_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS locked_project_created BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS locked_quote_created BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS locked_invoice_created BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_daily_usage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_usage_reset_at TIMESTAMPTZ;

-- Backfill: Mark all existing users (without trial dates) as grandfathered
UPDATE users_profile
SET grandfathered_active = true
WHERE trial_started_at IS NULL 
  AND trial_ends_at IS NULL
  AND grandfathered_active IS NOT true;

-- Create index for efficient access state queries
CREATE INDEX IF NOT EXISTS idx_users_profile_trial_ends_at ON users_profile(trial_ends_at);
CREATE INDEX IF NOT EXISTS idx_users_profile_grandfathered ON users_profile(grandfathered_active);

-- Verification query (run after migration):
-- SELECT 
--   COUNT(*) as total_users,
--   COUNT(CASE WHEN grandfathered_active = true THEN 1 END) as grandfathered_users,
--   COUNT(CASE WHEN trial_started_at IS NOT NULL THEN 1 END) as trial_users
-- FROM users_profile;
