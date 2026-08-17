-- ============================================================================
-- Demo environment marker — MANUAL, HUMAN-RUN ONLY.
-- ============================================================================
--
-- This file is never executed by `npm run demo:*`, seed.ts, reset.ts,
-- reveal.ts, award.ts, or any other automated path in this repo. That is
-- deliberate: this is the human-in-the-loop designation that a specific
-- Supabase project is authorized to receive demo writes. Every demo
-- mutation script (via assertDemoEnvironment.ts) refuses to run unless the
-- row created here already exists.
--
-- Run this exactly once, by hand, directly against the dedicated demo
-- Supabase project only — via the Supabase SQL Editor or `psql` connected
-- to that project's own DATABASE_URL.
--
-- Do NOT run this against staging (qbdihnmgxtowqnvzflfh) or production
-- (efxjujtetreipxvxxfip). Running it there would not make either of those
-- projects a valid demo target — assertDemoEnvironment.ts's hardcoded
-- denylist rejects both refs unconditionally, before this table is ever
-- consulted — but it would still be a real write against a real
-- environment for no legitimate reason, so don't.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public._demo_environment_marker (
  id            boolean     PRIMARY KEY DEFAULT true CHECK (id),
  designated_at timestamptz NOT NULL DEFAULT now(),
  designated_by text
);

INSERT INTO public._demo_environment_marker (id, designated_by)
VALUES (true, current_user)
ON CONFLICT (id) DO NOTHING;
