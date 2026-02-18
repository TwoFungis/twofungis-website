-- PART 3: Create lifetime_purchases table
-- Run this third

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
