-- PART 1: Add missing columns to users_profile
-- Run this first

ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'contractor';
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS skills TEXT[];
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS certifications TEXT[];
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS years_experience INTEGER DEFAULT 0;
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS service_areas TEXT[];
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS portfolio_urls TEXT[];
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS rating_avg NUMERIC DEFAULT 0;
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_approval_token TEXT;
