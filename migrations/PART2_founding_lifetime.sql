-- PART 2: Create founding_lifetime table
-- Run this second

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

INSERT INTO founding_lifetime (id, max_seats, seats_sold, is_active, region_lock)
VALUES (1, 100, 0, TRUE, 'CA')
ON CONFLICT (id) DO NOTHING;
