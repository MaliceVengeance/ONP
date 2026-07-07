-- ============================================================
-- Service Area: Waitlist + Profile columns
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Waitlist table
CREATE TABLE IF NOT EXISTS public.service_area_waitlist (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT NOT NULL,
  zip          TEXT NOT NULL,
  city         TEXT,
  state        TEXT,
  intended_role TEXT,          -- 'CLIENT' | 'CONTRACTOR' | 'BOTH' | 'UNKNOWN'
  notes        TEXT,
  source       TEXT NOT NULL DEFAULT 'HOMEPAGE',  -- 'HOMEPAGE' | 'SIGNUP_BLOCKED' | 'PROJECT_POST_BLOCKED'
  notified_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS service_area_waitlist_zip_idx
  ON public.service_area_waitlist (zip);

CREATE INDEX IF NOT EXISTS service_area_waitlist_state_idx
  ON public.service_area_waitlist (state, zip);

-- 2. RLS on waitlist
ALTER TABLE public.service_area_waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone (including unauthenticated) can insert
CREATE POLICY "anyone_can_join_waitlist"
  ON public.service_area_waitlist FOR INSERT
  WITH CHECK (true);

-- Only admins can read
CREATE POLICY "admins_read_waitlist"
  ON public.service_area_waitlist FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Only admins can update (e.g., set notified_at)
CREATE POLICY "admins_update_waitlist"
  ON public.service_area_waitlist FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- 3. New columns on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS service_area_zip    TEXT,
  ADD COLUMN IF NOT EXISTS service_area_status TEXT DEFAULT 'UNKNOWN';
  -- Values: 'IN_AREA' | 'OUT_OF_AREA' | 'UNKNOWN'

-- 4. Update handle_new_user trigger to also store service_area_zip from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name, company_name, service_area_zip)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'signup_role', 'CLIENT')::role_type,
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'service_area_zip'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
