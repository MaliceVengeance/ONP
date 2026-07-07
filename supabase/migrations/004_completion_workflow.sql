-- ============================================================
-- Project Completion Workflow Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- Adds completion_requested_at to projects so contractors can
-- signal work is done and clients can confirm.
-- ============================================================

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS completion_requested_at TIMESTAMPTZ;
