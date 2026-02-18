-- PART 1: Add columns to users_profile
-- Run this first

ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'TRIAL';
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS plan_status TEXT DEFAULT 'inactive';
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS lifetime_purchased_at TIMESTAMPTZ;
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
