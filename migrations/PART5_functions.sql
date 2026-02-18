-- PART 5: Create functions for atomic operations
-- Run this fifth

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
  SELECT f.seats_sold, f.max_seats, f.is_active 
  INTO v_current_seats, v_max_seats, v_is_active
  FROM founding_lifetime f
  WHERE f.id = 1
  FOR UPDATE;
  
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
  
  UPDATE founding_lifetime 
  SET 
    seats_sold = seats_sold + 1,
    is_active = CASE WHEN seats_sold + 1 >= max_seats THEN FALSE ELSE TRUE END,
    updated_at = NOW()
  WHERE id = 1;
  
  RETURN QUERY SELECT 
    TRUE,
    v_current_seats + 1,
    v_max_seats - v_current_seats - 1,
    NULL::TEXT;
END;
$$;

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

GRANT EXECUTE ON FUNCTION get_lifetime_seats_status() TO authenticated;
GRANT EXECUTE ON FUNCTION get_lifetime_seats_status() TO anon;
GRANT EXECUTE ON FUNCTION increment_lifetime_seat() TO service_role;
