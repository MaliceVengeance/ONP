-- ============================================================================
-- Migration 031: Early-Access Interest List
-- ============================================================================
--
-- Captures pre-trial demand-validation signal for the temporary Public
-- Launch / Coming Soon landing page. Deliberately separate from
-- service_area_waitlist, which captures a different signal (a person who
-- attempted to sign up or post a project and was blocked by geography).
-- No name, phone, street address, budget, or project detail is collected.
--
-- All application access — both the public join RPC and the admin
-- read-only view — goes through the service-role client from server-only
-- code. RLS is enabled with zero policies, and PUBLIC/anon/authenticated
-- are explicitly REVOKEd as defense-in-depth against Supabase's
-- schema-level default privilege auto-grants.
--
-- Duplicate submissions of the same (email, role) pair are handled
-- entirely inside join_early_access_signup() below via a single atomic
-- INSERT ... ON CONFLICT ... DO UPDATE — there is no separate "check then
-- insert" step and therefore no race window. marketing_consent can only
-- be upgraded false -> true on a repeat submission, never downgraded to
-- false (that would silently misinterpret an unchecked duplicate as an
-- unsubscribe, which it is not). Revocation happens only through the
-- email unsubscribe mechanism, not through this table.
-- ============================================================================

CREATE TABLE public.early_access_signups (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email             text        NOT NULL,
  zip               text        NOT NULL,
  role              text        NOT NULL,
  contractor_trade  text,
  marketing_consent boolean     NOT NULL DEFAULT false,
  utm_source        text,
  utm_medium        text,
  utm_campaign       text,
  created_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT early_access_signups_zip_format_check
    CHECK (zip ~ '^[0-9]{5}$'),

  CONSTRAINT early_access_signups_role_check
    CHECK (role IN ('CLIENT', 'CONTRACTOR', 'PROPERTY_MANAGER')),

  CONSTRAINT early_access_signups_contractor_trade_length_check
    CHECK (contractor_trade IS NULL OR char_length(contractor_trade) <= 100),

  CONSTRAINT early_access_signups_utm_source_length_check
    CHECK (utm_source IS NULL OR char_length(utm_source) <= 200),

  CONSTRAINT early_access_signups_utm_medium_length_check
    CHECK (utm_medium IS NULL OR char_length(utm_medium) <= 200),

  CONSTRAINT early_access_signups_utm_campaign_length_check
    CHECK (utm_campaign IS NULL OR char_length(utm_campaign) <= 200)
);

COMMENT ON COLUMN public.early_access_signups.marketing_consent IS
  'Explicit opt-in for communications BEYOND the launch notification (e.g. a general ONP newsletter). Submitting this form at all is the launch-notification consent and requires no separate flag. A bulk marketing send must filter WHERE marketing_consent = true; a launch-notification send may target every row. This column may only move false -> true via join_early_access_signup()''s ON CONFLICT DO UPDATE (never downgraded by a duplicate submission) -- revocation happens only via the email unsubscribe mechanism.';

-- Case/whitespace-insensitive dedupe, scoped per role so one person can
-- register both as e.g. a Client and a Contractor -- two legitimate
-- signals, not a duplicate. This is also the ON CONFLICT target for
-- join_early_access_signup() below.
CREATE UNIQUE INDEX IF NOT EXISTS early_access_signups_email_role_key
  ON public.early_access_signups (lower(trim(email)), role);

-- Supporting indexes for the admin read-only aggregate queries (count by
-- role, top ZIP codes, contractor trade breakdown, recent signups).
CREATE INDEX IF NOT EXISTS early_access_signups_zip_idx
  ON public.early_access_signups (zip);
CREATE INDEX IF NOT EXISTS early_access_signups_role_idx
  ON public.early_access_signups (role);
CREATE INDEX IF NOT EXISTS early_access_signups_created_at_idx
  ON public.early_access_signups (created_at DESC);

-- ----------------------------------------------------------------------------
-- Row Level Security: enabled, zero policies, zero client-facing grants.
-- ----------------------------------------------------------------------------
ALTER TABLE public.early_access_signups ENABLE ROW LEVEL SECURITY;

-- No CREATE POLICY statements. RLS is enabled with no policies attached,
-- so anon and authenticated are denied all access by default. service_role
-- bypasses RLS entirely in Supabase and does not need a policy.

REVOKE ALL ON public.early_access_signups FROM PUBLIC;
REVOKE ALL ON public.early_access_signups FROM anon;
REVOKE ALL ON public.early_access_signups FROM authenticated;

-- ============================================================
-- join_early_access_signup(): the single, atomic write path
-- ============================================================
-- Performs the INSERT / consent-preserving-upsert in one statement so
-- there is no race window between checking for an existing row and
-- writing one. Field-format validation (zip regex, role enum, length
-- caps) is enforced twice: once here implicitly via the table's own CHECK
-- constraints (a malformed call still fails loudly), and once in the
-- calling server action for a better user-facing error message -- this
-- function is the last line of defense, not the primary validator.
CREATE OR REPLACE FUNCTION public.join_early_access_signup(
  p_email             text,
  p_zip               text,
  p_role              text,
  p_contractor_trade  text,
  p_marketing_consent boolean,
  p_utm_source        text,
  p_utm_medium        text,
  p_utm_campaign      text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.early_access_signups (
    email, zip, role, contractor_trade, marketing_consent,
    utm_source, utm_medium, utm_campaign
  )
  VALUES (
    p_email, p_zip, p_role, p_contractor_trade, p_marketing_consent,
    p_utm_source, p_utm_medium, p_utm_campaign
  )
  ON CONFLICT (lower(trim(email)), role)
  DO UPDATE SET
    marketing_consent = public.early_access_signups.marketing_consent OR EXCLUDED.marketing_consent;
END;
$function$;

REVOKE ALL ON FUNCTION public.join_early_access_signup(text, text, text, text, boolean, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.join_early_access_signup(text, text, text, text, boolean, text, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.join_early_access_signup(text, text, text, text, boolean, text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.join_early_access_signup(text, text, text, text, boolean, text, text, text) TO service_role;
