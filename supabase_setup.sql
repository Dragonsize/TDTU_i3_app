

-- Profiles (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'in_process',
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deadline TIMESTAMPTZ
);

-- Project members
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (project_id, user_id)
);

-- Workspaces / Flows
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_process',
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Files (Supabase Storage metadata)
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  uploader_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  bucket_name TEXT NOT NULL DEFAULT 'project-files',
  file_name TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar events
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  event_type TEXT DEFAULT 'meeting',
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat channels
CREATE TABLE IF NOT EXISTS chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  channel_type TEXT NOT NULL DEFAULT 'team',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE,
  last_message_at TIMESTAMPTZ
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI chat sessions
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Chat',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE,
  last_message_at TIMESTAMPTZ
);

-- AI chat messages
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'ai')),
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);



CREATE INDEX IF NOT EXISTS idx_projects_creator ON projects(creator_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_project ON workspaces(project_id);
CREATE INDEX IF NOT EXISTS idx_files_project ON files(project_id);
CREATE INDEX IF NOT EXISTS idx_files_workspace ON files(workspace_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_project ON calendar_events(project_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_channels_project ON chat_channels(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user ON ai_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_session ON ai_chat_messages(session_id);


ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;


-- Profiles policies
CREATE POLICY "Profiles are viewable by owner" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles can be inserted by owner" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles can be updated by owner" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Projects policies
CREATE POLICY "Projects readable by members" ON projects
  FOR SELECT USING (
    creator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = projects.id AND pm.user_id = auth.uid()
    )
  );
CREATE POLICY "Projects created by authenticated" ON projects
  FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Projects updated by creator" ON projects
  FOR UPDATE USING (creator_id = auth.uid());
CREATE POLICY "Projects deleted by creator" ON projects
  FOR DELETE USING (creator_id = auth.uid());

-- Project members policies
CREATE POLICY "Project members readable by members" ON project_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id AND pm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_members.project_id AND p.creator_id = auth.uid()
    )
  );
CREATE POLICY "Project members insert by creator" ON project_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_members.project_id AND p.creator_id = auth.uid()
    )
  );
CREATE POLICY "Project members delete by creator or self" ON project_members
  FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_members.project_id AND p.creator_id = auth.uid()
    )
  );

-- Workspaces policies
CREATE POLICY "Workspaces readable by members" ON workspaces
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = workspaces.project_id AND pm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = workspaces.project_id AND p.creator_id = auth.uid()
    )
  );
CREATE POLICY "Workspaces insert by members" ON workspaces
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = workspaces.project_id AND pm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = workspaces.project_id AND p.creator_id = auth.uid()
    )
  );
CREATE POLICY "Workspaces update by members" ON workspaces
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = workspaces.project_id AND pm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = workspaces.project_id AND p.creator_id = auth.uid()
    )
  );
CREATE POLICY "Workspaces delete by creator" ON workspaces
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = workspaces.project_id AND p.creator_id = auth.uid()
    )
  );

-- Files policies
CREATE POLICY "Files readable by members" ON files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = files.project_id AND pm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = files.project_id AND p.creator_id = auth.uid()
    )
  );
CREATE POLICY "Files insert by members" ON files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = files.project_id AND pm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = files.project_id AND p.creator_id = auth.uid()
    )
  );
CREATE POLICY "Files delete by uploader or creator" ON files
  FOR DELETE USING (
    uploader_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = files.project_id AND p.creator_id = auth.uid()
    )
  );

-- Calendar events policies
CREATE POLICY "Events readable by owner or members" ON calendar_events
  FOR SELECT USING (
    user_id = auth.uid()
    OR (
      project_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = calendar_events.project_id AND pm.user_id = auth.uid()
      )
    )
  );
CREATE POLICY "Events insert by owner" ON calendar_events
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Events update by owner" ON calendar_events
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Events delete by owner" ON calendar_events
  FOR DELETE USING (user_id = auth.uid());

-- Chat channels policies
CREATE POLICY "Channels readable by members" ON chat_channels
  FOR SELECT USING (
    project_id IS NULL
    OR EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = chat_channels.project_id AND pm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = chat_channels.project_id AND p.creator_id = auth.uid()
    )
  );
CREATE POLICY "Channels insert by members" ON chat_channels
  FOR INSERT WITH CHECK (
    project_id IS NULL OR EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = chat_channels.project_id AND pm.user_id = auth.uid()
    )
  );
CREATE POLICY "Channels update by members" ON chat_channels
  FOR UPDATE USING (
    project_id IS NULL OR EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = chat_channels.project_id AND pm.user_id = auth.uid()
    )
  );
CREATE POLICY "Channels delete by creator" ON chat_channels
  FOR DELETE USING (
    project_id IS NULL OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = chat_channels.project_id AND p.creator_id = auth.uid()
    )
  );

-- Chat messages policies
CREATE POLICY "Messages readable by channel members" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_channels cc
      WHERE cc.id = chat_messages.channel_id
        AND (
          cc.project_id IS NULL
          OR EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = cc.project_id AND pm.user_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = cc.project_id AND p.creator_id = auth.uid()
          )
        )
    )
  );
CREATE POLICY "Messages insert by members" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_channels cc
      WHERE cc.id = chat_messages.channel_id
        AND (
          cc.project_id IS NULL
          OR EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = cc.project_id AND pm.user_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = cc.project_id AND p.creator_id = auth.uid()
          )
        )
    )
  );
CREATE POLICY "Messages delete by sender" ON chat_messages
  FOR DELETE USING (sender_id = auth.uid());

-- AI chat policies
CREATE POLICY "AI sessions owned by user" ON ai_chat_sessions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "AI sessions insert by user" ON ai_chat_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "AI sessions update by user" ON ai_chat_sessions
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "AI sessions delete by user" ON ai_chat_sessions
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "AI messages owned by user" ON ai_chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ai_chat_sessions s
      WHERE s.id = ai_chat_messages.session_id AND s.user_id = auth.uid()
    )
  );
CREATE POLICY "AI messages insert by user" ON ai_chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_chat_sessions s
      WHERE s.id = ai_chat_messages.session_id AND s.user_id = auth.uid()
    )
  );
CREATE POLICY "AI messages delete by user" ON ai_chat_messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM ai_chat_sessions s
      WHERE s.id = ai_chat_messages.session_id AND s.user_id = auth.uid()
    )
  );

