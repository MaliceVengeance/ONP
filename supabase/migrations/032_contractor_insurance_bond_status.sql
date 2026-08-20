-- ============================================================================
-- Migration 032: Contractor insurance & bonding trust-signal status
-- ============================================================================
--
-- Product audit finding: insurance had a real Yes/No/Not-provided building
-- block (has_no_insurance + the coi_* paperwork fields), but no positive
-- "Yes" signal independent of paperwork presence. Bonding had no tri-state
-- representation at all -- a missing BOND credential row meant either "not
-- bonded" or "hasn't told us," indistinguishably. This migration adds an
-- explicit, contractor-level tri-state status for both, using this table's
-- own existing convention (contractor_profiles.veteran_credential_type,
-- contractor_credentials.credential_type) of a plain `text` column guarded
-- by a CHECK constraint rather than a native Postgres ENUM.
--
-- insurance_status / bond_status are the contractor's own ATTESTATION, not
-- an ONP verification. Verification stays where it already correctly lived:
-- directory_verified (license + COI, contractor_profiles) and
-- contractor_credentials.verified (per bond/license row) -- both untouched
-- here except for the new defense-in-depth trigger in section 5/6 below.
--
-- Does not touch 016 or re-run any part of 010/016. Additive, plus one
-- column retirement (see section 4).
-- ============================================================================

-- ============================================================
-- 1. New tri-state status columns
-- ============================================================

ALTER TABLE public.contractor_profiles
  ADD COLUMN IF NOT EXISTS insurance_status text,
  ADD COLUMN IF NOT EXISTS bond_status text;

-- ============================================================
-- 2. Backfill, preserving existing meaning -- run before NOT NULL/DEFAULT
--    is applied so every existing row gets a deliberate value, not a
--    silently-applied default.
-- ============================================================

-- has_no_insurance = true is an explicit prior attestation -> NOT_INSURED.
-- A provider name AND an expiry date together are treated as a credible
-- prior COI submission -> INSURED. Anything less (e.g. only a coverage
-- amount, or only a provider with no expiry) is NOT treated as credible
-- evidence of insurance on its own -- per instruction, INSURED must not be
-- inferred from partial/placeholder data -- so it falls through to
-- NOT_PROVIDED, the honest "we don't actually know" default.
UPDATE public.contractor_profiles
SET insurance_status = CASE
  WHEN has_no_insurance = true THEN 'NOT_INSURED'
  WHEN coi_provider IS NOT NULL AND btrim(coi_provider) <> ''
   AND coi_expiry IS NOT NULL THEN 'INSURED'
  ELSE 'NOT_PROVIDED'
END
WHERE insurance_status IS NULL;

-- No prior "not bonded" attestation exists anywhere in the schema, so
-- backfill can only ever produce BONDED (from a verified BOND credential
-- already on file) or NOT_PROVIDED -- never NOT_BONDED, since we have no
-- existing signal that would make that claim true.
UPDATE public.contractor_profiles cp
SET bond_status = 'BONDED'
WHERE bond_status IS NULL
  AND EXISTS (
    SELECT 1 FROM public.contractor_credentials cc
    WHERE cc.contractor_id = cp.contractor_id
      AND cc.credential_type = 'BOND'
      AND cc.verified = true
  );

UPDATE public.contractor_profiles
SET bond_status = 'NOT_PROVIDED'
WHERE bond_status IS NULL;

-- ============================================================
-- 3. Lock down default/NOT NULL/CHECK now that every row has a value
-- ============================================================

ALTER TABLE public.contractor_profiles
  ALTER COLUMN insurance_status SET DEFAULT 'NOT_PROVIDED',
  ALTER COLUMN insurance_status SET NOT NULL,
  ALTER COLUMN bond_status SET DEFAULT 'NOT_PROVIDED',
  ALTER COLUMN bond_status SET NOT NULL;

ALTER TABLE public.contractor_profiles
  DROP CONSTRAINT IF EXISTS contractor_profiles_insurance_status_check;
ALTER TABLE public.contractor_profiles
  ADD CONSTRAINT contractor_profiles_insurance_status_check
  CHECK (insurance_status IN ('INSURED', 'NOT_INSURED', 'NOT_PROVIDED'));

ALTER TABLE public.contractor_profiles
  DROP CONSTRAINT IF EXISTS contractor_profiles_bond_status_check;
ALTER TABLE public.contractor_profiles
  ADD CONSTRAINT contractor_profiles_bond_status_check
  CHECK (bond_status IN ('BONDED', 'NOT_BONDED', 'NOT_PROVIDED'));

-- ============================================================
-- 4. Retire has_no_insurance
-- ============================================================
-- Fully superseded by insurance_status (backfilled above) and has exactly
-- six readers/writers in the whole codebase, all updated in this same
-- change: contractor/profile/{page,actions}.ts (self-service),
-- client/.../bids/page.tsx and .../bids/[bidId]/page.tsx (client-facing),
-- and admin/users/[id]/page.tsx (admin view). Retired outright rather than
-- kept in sync, per instruction not to leave two independent sources of
-- truth -- see report for the "keep vs retire" rationale.
ALTER TABLE public.contractor_profiles
  DROP COLUMN IF EXISTS has_no_insurance;

-- ============================================================
-- 5. Defense-in-depth: verification fields are admin-only; bond_status may
--    not contradict a verified BOND credential (contractor_profiles side)
-- ============================================================
-- contractor_profiles_update_self (016) is row-scoped only (contractor_id =
-- auth.uid()), with no column-level restriction -- Postgres RLS can't
-- express "this column, but not that one." Every admin write already goes
-- through supabaseAdmin (service_role, bypasses RLS), so this trigger only
-- ever needs to block the authenticated-contractor path; it does not change
-- any existing admin behavior.
CREATE OR REPLACE FUNCTION public.protect_contractor_verification_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND auth.role() IS DISTINCT FROM 'service_role' THEN
    IF NEW.directory_verified IS DISTINCT FROM OLD.directory_verified
       OR NEW.directory_verified_at IS DISTINCT FROM OLD.directory_verified_at
       OR NEW.directory_verified_by IS DISTINCT FROM OLD.directory_verified_by THEN
      RAISE EXCEPTION 'directory_verified can only be changed by ONP admin review';
    END IF;
  END IF;

  -- Consistency (applies regardless of caller): a contractor cannot self-
  -- attest NOT_BONDED while ONP already has a verified bond credential on
  -- file for them -- that would contradict a fact ONP has confirmed.
  -- Reconciliation (unverify/delete the credential, or don't set
  -- NOT_BONDED) must happen explicitly; nothing here silently overrides
  -- either side. Only fires on an actual transition into NOT_BONDED, not on
  -- unrelated profile edits made while already in that state.
  IF NEW.bond_status = 'NOT_BONDED'
     AND (TG_OP = 'INSERT' OR OLD.bond_status IS DISTINCT FROM NEW.bond_status)
     AND EXISTS (
       SELECT 1 FROM public.contractor_credentials cc
       WHERE cc.contractor_id = NEW.contractor_id
         AND cc.credential_type = 'BOND'
         AND cc.verified = true
     ) THEN
    RAISE EXCEPTION 'Cannot set bond_status to NOT_BONDED: a verified bond credential is already on file for this contractor';
  END IF;

  RETURN NEW;
END;
$function$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger tg
    JOIN pg_class c ON c.oid = tg.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'contractor_profiles' AND tg.tgname = 'contractor_profiles_protect_verification' AND NOT tg.tgisinternal
  ) THEN
    CREATE TRIGGER contractor_profiles_protect_verification
      BEFORE INSERT OR UPDATE ON public.contractor_profiles
      FOR EACH ROW EXECUTE FUNCTION public.protect_contractor_verification_fields();
  END IF;
END $$;

-- ============================================================
-- 6. Mirror image on contractor_credentials: block self-verification, and
--    block verifying a BOND row while bond_status says NOT_BONDED
-- ============================================================
-- contractor_manage_own_credentials (010) is FOR ALL, row-scoped only, same
-- gap as above -- a contractor's own session can currently PATCH `verified`
-- on their own credential row directly. The app itself never does this
-- (only supabaseAdmin ever writes `verified`), so this only closes a direct-
-- API path; no legitimate behavior changes.
CREATE OR REPLACE FUNCTION public.protect_contractor_credential_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.verified IS TRUE OR NEW.verified_at IS NOT NULL OR NEW.verified_by IS NOT NULL THEN
        RAISE EXCEPTION 'New credentials cannot be submitted pre-verified';
      END IF;
    ELSE
      IF NEW.verified IS DISTINCT FROM OLD.verified
         OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
         OR NEW.verified_by IS DISTINCT FROM OLD.verified_by THEN
        RAISE EXCEPTION 'Credential verification can only be changed by ONP admin review';
      END IF;
    END IF;
  END IF;

  -- Consistency, mirroring section 5: only fires on an actual transition of
  -- this row into verified = true (a fresh admin verify, or a pre-verified
  -- service-role insert such as the demo seed script), not on incidental
  -- edits to an already-verified row.
  IF NEW.credential_type = 'BOND' AND NEW.verified = true
     AND (TG_OP = 'INSERT' OR OLD.verified IS DISTINCT FROM NEW.verified)
     AND EXISTS (
       SELECT 1 FROM public.contractor_profiles cp
       WHERE cp.contractor_id = NEW.contractor_id
         AND cp.bond_status = 'NOT_BONDED'
     ) THEN
    RAISE EXCEPTION 'Cannot verify a bond credential while contractor bond_status is NOT_BONDED';
  END IF;

  RETURN NEW;
END;
$function$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger tg
    JOIN pg_class c ON c.oid = tg.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'contractor_credentials' AND tg.tgname = 'contractor_credentials_protect_verification' AND NOT tg.tgisinternal
  ) THEN
    CREATE TRIGGER contractor_credentials_protect_verification
      BEFORE INSERT OR UPDATE ON public.contractor_credentials
      FOR EACH ROW EXECUTE FUNCTION public.protect_contractor_credential_verification();
  END IF;
END $$;
