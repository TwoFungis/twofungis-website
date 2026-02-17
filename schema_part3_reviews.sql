-- PART 3: Create reviews table
-- Run this after Part 2

CREATE TABLE IF NOT EXISTS contractor_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL,
  comment TEXT,
  client_name TEXT,
  project_name TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE contractor_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select" ON contractor_reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON contractor_reviews FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "reviews_update" ON contractor_reviews FOR UPDATE USING (auth.uid() = reviewer_id);
CREATE POLICY "reviews_delete" ON contractor_reviews FOR DELETE USING (auth.uid() = reviewer_id);
