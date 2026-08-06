-- ============================================================================
-- Migration 017: Service Area Infrastructure Repair
-- ============================================================================
--
-- PURPOSE
--   Repairs the service-area waitlist feature, which has been completely
--   non-functional in production since it was first coded: migration 005
--   (service_area_waitlist, profiles.service_area_zip/service_area_status,
--   and a handle_new_user() update) was written but never actually applied
--   -- confirmed with direct evidence in SERVICE_AREA_WAITLIST_INVESTIGATION.md.
--   This migration is a fresh, re-analyzed design (see
--   SERVICE_AREA_REPAIR_DESIGN_REVIEW.md), not a replay of 005 -- it adds a
--   user_id link column, a normalized uniqueness rule, and CHECK constraints
--   that 005 never had.
--
--   Snapshot/authoring date: 2026-08-06. handle_new_user() re-pulled fresh
--   from production immediately before writing this file (still the
--   pre-005 version, confirmed unchanged since the investigation).
--
-- SCOPE
--   Additive only. No DROP statements anywhere in this file. No unrelated
--   schema changes. No historical data backfill -- existing profiles rows
--   get service_area_status = 'UNKNOWN' purely as a side effect of
--   ADD COLUMN ... DEFAULT (Postgres fills existing rows with the column
--   default automatically; no explicit UPDATE statement is used or needed).
--   No application code changes -- this is Commit A only.
--
-- APPROVED DESIGN DECISIONS (Priority 1.1.5)
--   1. profiles.service_area_zip / service_area_status added; existing rows
--      stay at the default 'UNKNOWN'. No inference, no backfill here.
--   2. service_area_waitlist.user_id uuid NULL REFERENCES auth.users(id)
--      ON DELETE SET NULL -- populated by signup-generated entries,
--      NULL for anonymous joins.
--   3. Duplicate rule: NOT unique(email, zip) -- a shared email must be able
--      to represent separate CLIENT and CONTRACTOR interest. Enforced via a
--      normalized (lower(trim(email)), zip, intended_role) unique index.
--      One deviation from the approved spec, flagged explicitly: this only
--      functions as a real dedup rule if intended_role is never NULL
--      (PostgreSQL unique indexes treat NULL as distinct from every other
--      NULL, so two NULL-intended_role rows would NOT collide and the
--      "same email + same zip + same role = one row" rule would silently
--      not apply to them). Made intended_role NOT NULL DEFAULT 'UNKNOWN' to
--      close that gap -- the approved decision didn't explicitly say NOT
--      NULL, but the stated dedup behavior requires it to actually hold.
--   4. source CHECK includes the reserved 'HISTORICAL_SIGNUP_BACKFILL' value
--      for future use -- no rows using it are created by this migration.
--   5. (Application-layer decision, not in this migration) contractor
--      subscribe-page gate fails closed -- Commit B.
--   6. This is Commit A. Commit B (application integration, error handling,
--      out-of-area page correction) is separate and not started here.
--
-- IDEMPOTENCY STRATEGY (consistent with 016's established patterns)
--   - Table: CREATE TABLE IF NOT EXISTS, all constraints inline (no
--     cross-table FK ordering concern here -- the only FK target,
--     auth.users, already exists in every environment this runs against).
--   - profiles columns: ADD COLUMN IF NOT EXISTS (native idempotent).
--   - handle_new_user(): CREATE OR REPLACE FUNCTION (native idempotent,
--     safe to re-run verbatim).
--   - RLS enable: ALTER TABLE ... ENABLE ROW LEVEL SECURITY (native no-op
--     if already enabled).
--   - RLS policies: catalog-guarded DO block (CREATE POLICY IF NOT EXISTS
--     confirmed not valid syntax on this Postgres version during the 016
--     effort) -- purely additive, nothing ever dropped.
--   - Indexes: CREATE [UNIQUE] INDEX IF NOT EXISTS (native idempotent).
-- ============================================================================


-- ============================================================================
-- SECTION: TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.service_area_waitlist (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text        NOT NULL,
  zip           text        NOT NULL CHECK (zip ~ '^[0-9]{5}$'),
  user_id       uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  intended_role text        NOT NULL DEFAULT 'UNKNOWN'
                             CHECK (intended_role IN ('CLIENT', 'CONTRACTOR', 'BOTH', 'UNKNOWN')),
  source        text        NOT NULL DEFAULT 'HOMEPAGE'
                             CHECK (source IN ('HOMEPAGE', 'SIGNUP_BLOCKED', 'PROJECT_POST_BLOCKED', 'HISTORICAL_SIGNUP_BACKFILL')),
  city          text,
  state         text,
  notes         text,
  notified_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- SECTION: CONSTRAINTS (uniqueness -- see REVISION NOTE above re: NOT NULL)
-- ============================================================================
-- Normalized so "  Foo@Bar.com " and "foo@bar.com" collide as the same
-- entry, per the approved case-insensitive / whitespace-normalized rule.
-- A functional unique index rather than a plain UNIQUE constraint, since
-- the dedup key is an expression (lower(trim(email))), not a bare column.
CREATE UNIQUE INDEX IF NOT EXISTS service_area_waitlist_email_zip_role_key
  ON public.service_area_waitlist (lower(trim(email)), zip, intended_role);

-- ============================================================================
-- SECTION: INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS service_area_waitlist_zip_idx
  ON public.service_area_waitlist (zip);

CREATE INDEX IF NOT EXISTS service_area_waitlist_state_zip_idx
  ON public.service_area_waitlist (state, zip);

CREATE INDEX IF NOT EXISTS service_area_waitlist_user_id_idx
  ON public.service_area_waitlist (user_id);

-- ============================================================================
-- SECTION: RLS
-- ============================================================================
ALTER TABLE public.service_area_waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone (including unauthenticated visitors) can submit a waitlist entry --
-- this is the entire point of a public lead-capture form. Matches the
-- approved security model in the design review (§7): defense-in-depth via
-- RLS even though current app code happens to write through the
-- service-role client either way.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'service_area_waitlist' AND policyname = 'anyone_can_join_waitlist'
  ) THEN
    CREATE POLICY "anyone_can_join_waitlist" ON public.service_area_waitlist
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- Only admins can read waitlist entries -- no legitimate product reason for
-- a user to read this table, not even their own row.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'service_area_waitlist' AND policyname = 'admins_read_waitlist'
  ) THEN
    CREATE POLICY "admins_read_waitlist" ON public.service_area_waitlist
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role = 'ADMIN'
        )
      );
  END IF;
END $$;

-- Only admins can update rows on this table. This is a row-level policy,
-- not a column-level restriction -- RLS governs which ROWS an admin may
-- update (here: all of them, since eligibility doesn't depend on row
-- content), not which COLUMNS. The application currently only ever writes
-- notified_at and notes (see notifyWaitlistByZips / updateWaitlistNotes),
-- but that's an application-layer choice, not something this policy
-- itself enforces or restricts.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'service_area_waitlist' AND policyname = 'admins_update_waitlist'
  ) THEN
    CREATE POLICY "admins_update_waitlist" ON public.service_area_waitlist
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role = 'ADMIN'
        )
      );
  END IF;
END $$;

-- ============================================================================
-- SECTION: PROFILES COLUMNS
-- ============================================================================
-- ADD COLUMN ... DEFAULT fills existing rows with the default automatically
-- -- this is how "existing rows must remain at service_area_status =
-- 'UNKNOWN', no inference, no backfill" is satisfied without any explicit
-- UPDATE statement anywhere in this file.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS service_area_zip text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS service_area_status text NOT NULL DEFAULT 'UNKNOWN';

-- profiles already exists in production, so this constraint can't be
-- declared inline the way it could on a brand-new table -- ALTER TABLE has
-- no native ADD CONSTRAINT IF NOT EXISTS, so it's guarded via the same
-- pg_constraint existence-check pattern used for foreign keys in 016.
-- Safe by construction: the column above is added (existing rows filled
-- with the 'UNKNOWN' default) in the same migration file, before this
-- constraint is ever added, so no existing or newly-defaulted row can
-- violate it -- verified directly against production (see validation
-- results) rather than assumed.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_service_area_status_check' AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_service_area_status_check
      CHECK (service_area_status IN ('UNKNOWN', 'IN_AREA', 'OUT_OF_AREA'));
  END IF;
END $$;

-- ============================================================================
-- SECTION: FUNCTIONS
-- ============================================================================
-- Re-pulled verbatim from production immediately before writing this file
-- (2026-08-06), then extended with exactly one addition: service_area_zip,
-- sourced from the same raw_user_meta_data the signup pages already embed
-- it into via supabase.auth.signUp()'s options.data. Every other column,
-- the COALESCE role default, ON CONFLICT DO NOTHING, LANGUAGE, and
-- SECURITY DEFINER are byte-identical to the live function -- nothing
-- about current behavior is lost, only added to.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
$function$;

-- ============================================================================
-- SECTION: FINAL VALIDATION NOTES
-- ============================================================================
-- Expected objects after this migration:
--   1 new table (service_area_waitlist)
--   2 new columns on profiles (service_area_zip, service_area_status)
--   1 function replaced in place (handle_new_user -- same identity, extended body)
--   3 RLS policies on service_area_waitlist (insert/select/update)
--   4 indexes on service_area_waitlist (1 unique normalized dedup index + 3 lookup indexes)
--   2 CHECK constraints inline on service_area_waitlist (intended_role, source)
--     + 1 inline CHECK on service_area_waitlist (zip format)
--   1 guarded CHECK constraint added to profiles (service_area_status IN
--     ('UNKNOWN','IN_AREA','OUT_OF_AREA'))
--
-- NOT created by this migration: any HISTORICAL_SIGNUP_BACKFILL rows, any
-- backfilled service_area_status value on existing profiles, any
-- application code change. Historical recovery from auth.users metadata is
-- an explicitly separate, later task.
-- ============================================================================
