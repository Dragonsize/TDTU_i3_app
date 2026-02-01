-- ============================================
-- SUPABASE SETUP SCRIPT
-- Project Scheduling & Collaboration Platform
-- ============================================

-- Run this entire script in Supabase SQL Editor

-- ============================================
-- 1. CREATE TABLES
-- ============================================

-- Profiles table (enhanced from original)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  fullname TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Project members with roles
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Workflows within projects
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Workflow member assignments
CREATE TABLE IF NOT EXISTS workflow_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(workflow_id, user_id)
);

-- User busy/free times
CREATE TABLE IF NOT EXISTS busy_times (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Document storage metadata
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Deadlines for workflows
CREATE TABLE IF NOT EXISTS deadlines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_date TIMESTAMP NOT NULL,
  assigned_to UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications system
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  related_id UUID,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_workflows_project ON workflows(project_id);
CREATE INDEX IF NOT EXISTS idx_workflow_members_workflow ON workflow_members(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_members_user ON workflow_members(user_id);
CREATE INDEX IF NOT EXISTS idx_busy_times_user ON busy_times(user_id);
CREATE INDEX IF NOT EXISTS idx_busy_times_start ON busy_times(start_time);
CREATE INDEX IF NOT EXISTS idx_deadlines_assigned ON deadlines(assigned_to);
CREATE INDEX IF NOT EXISTS idx_deadlines_due_date ON deadlines(due_date);
CREATE INDEX IF NOT EXISTS idx_deadlines_status ON deadlines(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_workflow ON documents(workflow_id);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE busy_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES
-- ============================================

-- Profiles: Users can read all profiles but only update their own
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Projects: Users can only see projects they're members of
CREATE POLICY "Users can view their projects"
  ON projects FOR SELECT
  USING (
    id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Project Members: Can view members of their projects
CREATE POLICY "Users can view project members"
  ON project_members FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

-- Workflows: Users can view workflows in their projects
CREATE POLICY "Users can view workflows"
  ON workflows FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

-- Busy Times: Users can view busy times of project members
CREATE POLICY "Users can view team busy times"
  ON busy_times FOR SELECT
  USING (
    user_id IN (
      SELECT pm.user_id FROM project_members pm
      WHERE pm.project_id IN (
        SELECT project_id FROM project_members 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage own busy times"
  ON busy_times FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Documents: Users can view documents in their projects
CREATE POLICY "Users can view project documents"
  ON documents FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

-- Deadlines: Users can view deadlines in their projects
CREATE POLICY "Users can view project deadlines"
  ON deadlines FOR SELECT
  USING (
    workflow_id IN (
      SELECT w.id FROM workflows w
      INNER JOIN project_members pm ON w.project_id = pm.project_id
      WHERE pm.user_id = auth.uid()
    )
  );

-- Notifications: Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- 5. INSERT SAMPLE DATA (Optional)
-- ============================================

-- Sample profile
INSERT INTO profiles (id, username, email, fullname)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'demo_user', 'demo@tdtu.edu.vn', 'Demo User')
ON CONFLICT (username) DO NOTHING;

-- Sample project
INSERT INTO projects (id, title, description, created_by, status)
VALUES 
  ('660e8400-e29b-41d4-a716-446655440000', 'Mobile App Development', 'Building a student management mobile app', '550e8400-e29b-41d4-a716-446655440000', 'active')
ON CONFLICT (id) DO NOTHING;

-- Add demo user as project lead
INSERT INTO project_members (project_id, user_id, role)
VALUES 
  ('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'lead')
ON CONFLICT (project_id, user_id) DO NOTHING;

-- Sample workflow
INSERT INTO workflows (id, project_id, title, description, created_by, status)
VALUES 
  ('770e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 'UI Design', 'Design user interface mockups', '550e8400-e29b-41d4-a716-446655440000', 'active')
ON CONFLICT (id) DO NOTHING;

-- Sample deadline
INSERT INTO deadlines (workflow_id, title, due_date, assigned_to, status)
VALUES 
  ('770e8400-e29b-41d4-a716-446655440000', 'Complete UI Mockups', '2026-02-15 17:00:00', '550e8400-e29b-41d4-a716-446655440000', 'pending');

-- ============================================
-- 6. CREATE HELPFUL VIEWS (Optional)
-- ============================================

-- View for project overview with member count
CREATE OR REPLACE VIEW project_overview AS
SELECT 
  p.id,
  p.title,
  p.description,
  p.status,
  p.created_at,
  prof.fullname as created_by_name,
  COUNT(DISTINCT pm.user_id) as member_count,
  COUNT(DISTINCT w.id) as workflow_count
FROM projects p
LEFT JOIN profiles prof ON p.created_by = prof.id
LEFT JOIN project_members pm ON p.id = pm.project_id
LEFT JOIN workflows w ON p.id = w.project_id
GROUP BY p.id, p.title, p.description, p.status, p.created_at, prof.fullname;

-- View for upcoming deadlines
CREATE OR REPLACE VIEW upcoming_deadlines AS
SELECT 
  d.id,
  d.title,
  d.due_date,
  d.status,
  w.title as workflow_title,
  p.title as project_title,
  prof.fullname as assigned_to_name
FROM deadlines d
INNER JOIN workflows w ON d.workflow_id = w.id
INNER JOIN projects p ON w.project_id = p.id
INNER JOIN profiles prof ON d.assigned_to = prof.id
WHERE d.status = 'pending'
  AND d.due_date >= NOW()
ORDER BY d.due_date ASC;

-- ============================================
-- SETUP COMPLETE!
-- ============================================

-- Verify tables were created
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'profiles', 'projects', 'project_members', 'workflows', 
    'workflow_members', 'busy_times', 'documents', 'deadlines', 'notifications'
  )
ORDER BY table_name;
