-- PART 2: Create milestone tables
-- Run this after Part 1

CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  percentage_of_contract NUMERIC DEFAULT 0,
  milestone_value NUMERIC DEFAULT 0,
  target_date DATE,
  status TEXT DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  client_comment TEXT,
  internal_notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "milestone_select" ON project_milestones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "milestone_insert" ON project_milestones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "milestone_update" ON project_milestones FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "milestone_delete" ON project_milestones FOR DELETE USING (auth.uid() = user_id);
