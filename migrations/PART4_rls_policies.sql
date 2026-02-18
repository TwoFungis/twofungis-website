-- PART 4: Enable RLS and create policies
-- Run this fourth

ALTER TABLE founding_lifetime ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifetime_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read founding_lifetime" ON founding_lifetime;
DROP POLICY IF EXISTS "Service role can manage founding_lifetime" ON founding_lifetime;
DROP POLICY IF EXISTS "Users can read own lifetime_purchases" ON lifetime_purchases;
DROP POLICY IF EXISTS "Service role can manage lifetime_purchases" ON lifetime_purchases;

CREATE POLICY "Anyone can read founding_lifetime" ON founding_lifetime
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage founding_lifetime" ON founding_lifetime
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can read own lifetime_purchases" ON lifetime_purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage lifetime_purchases" ON lifetime_purchases
  FOR ALL USING (auth.role() = 'service_role');
