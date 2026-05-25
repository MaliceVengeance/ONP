-- ============================================================
-- Emergency Bid Request Feature Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ─── 2a. Extend project_state enum ───────────────────────────
-- If your project state is stored as a Postgres enum, run these:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum WHERE enumlabel = 'PENDING_PAYMENT'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'project_state')
  ) THEN
    ALTER TYPE project_state ADD VALUE 'PENDING_PAYMENT';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum WHERE enumlabel = 'EMERGENCY_EXPIRED'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'project_state')
  ) THEN
    ALTER TYPE project_state ADD VALUE 'EMERGENCY_EXPIRED';
  END IF;
END $$;
-- NOTE: If project state is a plain text column (no enum type),
-- these DO blocks will silently no-op — that's fine.

-- ─── 2b. New columns on projects ─────────────────────────────
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS is_emergency          boolean      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS emergency_paid_at     timestamptz,
  ADD COLUMN IF NOT EXISTS emergency_payment_id  text,
  ADD COLUMN IF NOT EXISTS emergency_auto_close_at timestamptz,
  ADD COLUMN IF NOT EXISTS emergency_admin_granted boolean     NOT NULL DEFAULT false;

-- ─── 2c. emergency_request_log ───────────────────────────────
-- project_id is nullable to support admin-granted bonus slots
-- (which are not tied to a specific project until used)
CREATE TABLE IF NOT EXISTS public.emergency_request_log (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id                uuid        REFERENCES auth.users(id) NOT NULL,
  project_id               uuid        REFERENCES public.projects(id),   -- nullable for admin grants
  charged_amount_cents     integer     NOT NULL,
  stripe_payment_intent_id text,
  payment_status           text        NOT NULL,  -- PENDING | PAID | FAILED | REFUNDED | DISPUTED | ADMIN_GRANTED
  counts_against_limit     boolean     NOT NULL DEFAULT true,
  admin_granted            boolean     NOT NULL DEFAULT false,
  admin_granted_by         uuid        REFERENCES auth.users(id),
  created_at               timestamptz NOT NULL DEFAULT now(),
  closed_at                timestamptz,
  close_reason             text        -- AWARDED | AUTO_CLOSED | CANCELLED_BY_CLIENT | NO_BIDS | DOWNGRADED
);

CREATE INDEX IF NOT EXISTS emergency_request_log_client_id_created_at_idx
  ON public.emergency_request_log (client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS emergency_request_log_project_id_idx
  ON public.emergency_request_log (project_id);

-- ─── 2d. contractor_settings ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contractor_settings (
  contractor_id                    uuid        PRIMARY KEY REFERENCES auth.users(id),
  emergency_notifications_enabled  boolean     NOT NULL DEFAULT true,
  created_at                       timestamptz NOT NULL DEFAULT now(),
  updated_at                       timestamptz NOT NULL DEFAULT now()
);

-- ─── disclaimer_acknowledgments ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.disclaimer_acknowledgments (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        REFERENCES auth.users(id) NOT NULL,
  disclaimer_type     text        NOT NULL,
  disclaimer_version  text        NOT NULL,
  acknowledged_at     timestamptz NOT NULL DEFAULT now(),
  context             jsonb
);

CREATE INDEX IF NOT EXISTS disclaimer_ack_user_type_idx
  ON public.disclaimer_acknowledgments (user_id, disclaimer_type);

-- ─── admin_actions audit table ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id         uuid        REFERENCES auth.users(id) NOT NULL,
  action_type      text        NOT NULL,
  target_user_id   uuid        REFERENCES auth.users(id),
  target_entity_id uuid,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ─── 2e. RLS ─────────────────────────────────────────────────

-- emergency_request_log
ALTER TABLE public.emergency_request_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients_read_own_emergency_log"  ON public.emergency_request_log;
DROP POLICY IF EXISTS "admins_read_all_emergency_log"   ON public.emergency_request_log;

CREATE POLICY "clients_read_own_emergency_log" ON public.emergency_request_log
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "admins_read_all_emergency_log" ON public.emergency_request_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- contractor_settings (contractors manage their own)
ALTER TABLE public.contractor_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contractors_manage_own_settings" ON public.contractor_settings;

CREATE POLICY "contractors_manage_own_settings" ON public.contractor_settings
  FOR ALL USING (auth.uid() = contractor_id);

-- disclaimer_acknowledgments (users can insert + read their own)
ALTER TABLE public.disclaimer_acknowledgments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own_disclaimers" ON public.disclaimer_acknowledgments;
DROP POLICY IF EXISTS "users_insert_own_disclaimers"  ON public.disclaimer_acknowledgments;

CREATE POLICY "users_select_own_disclaimers" ON public.disclaimer_acknowledgments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_disclaimers" ON public.disclaimer_acknowledgments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- admin_actions (admins read-only via RLS; service role inserts)
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_read_admin_actions" ON public.admin_actions;

CREATE POLICY "admins_read_admin_actions" ON public.admin_actions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );
