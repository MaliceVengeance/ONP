-- ============================================================
-- Message Read Receipts Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- Tracks when each user last read each project's message thread.
-- ============================================================

CREATE TABLE IF NOT EXISTS project_message_reads (
  project_id   UUID         NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id      UUID         NOT NULL,
  last_read_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

-- RLS: each user can only read/write their own read receipts
ALTER TABLE project_message_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_manage_own_read_receipts"
  ON project_message_reads
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
