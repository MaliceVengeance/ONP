-- ============================================================
-- Project Messages Feature Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- Enables post-award messaging between client, contractor, and admin.
-- ============================================================

-- ─── 1. Create project_messages table ────────────────────────
CREATE TABLE IF NOT EXISTS project_messages (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID         NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sender_id         UUID         NOT NULL,
  sender_role       TEXT         NOT NULL CHECK (sender_role IN ('CLIENT', 'CONTRACTOR', 'ADMIN')),
  body              TEXT         NOT NULL CHECK (length(trim(body)) > 0),
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  notification_sent BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS project_messages_project_idx
  ON project_messages(project_id, created_at);

-- ─── 2. Enable RLS ────────────────────────────────────────────
ALTER TABLE project_messages ENABLE ROW LEVEL SECURITY;

-- ─── 3. SELECT policies ───────────────────────────────────────

-- Admins can read all messages
CREATE POLICY "admin_read_all_messages"
  ON project_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Client can read messages on their own projects
CREATE POLICY "client_read_own_project_messages"
  ON project_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_messages.project_id
        AND client_id = auth.uid()
    )
  );

-- Awarded contractor can read messages on their awarded project
CREATE POLICY "contractor_read_awarded_project_messages"
  ON project_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_awards
      WHERE project_id = project_messages.project_id
        AND contractor_id = auth.uid()
    )
  );

-- ─── 4. INSERT policies ───────────────────────────────────────

-- Client can send messages on their own AWARDED projects
CREATE POLICY "client_insert_messages"
  ON project_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND sender_role = 'CLIENT'
    AND EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_messages.project_id
        AND client_id = auth.uid()
        AND state = 'AWARDED'
    )
  );

-- Awarded contractor can send messages on their awarded project
CREATE POLICY "contractor_insert_messages"
  ON project_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND sender_role = 'CONTRACTOR'
    AND EXISTS (
      SELECT 1 FROM project_awards
      WHERE project_id = project_messages.project_id
        AND contractor_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_messages.project_id
        AND state = 'AWARDED'
    )
  );

-- Admins can send messages on any AWARDED project
CREATE POLICY "admin_insert_messages"
  ON project_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND sender_role = 'ADMIN'
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );
