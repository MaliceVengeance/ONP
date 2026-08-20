-- ============================================================================
-- Migration 033: Close the veteran_verified authorization gap
-- ============================================================================
--
-- Same gap as directory_verified/contractor_credentials.verified (closed in
-- 032 section 5/6): contractor_profiles_update_self (016) is row-scoped only
-- (contractor_id = auth.uid()), with no column-level restriction, so a
-- contractor's own authenticated session could PATCH veteran_verified/
-- veteran_verified_at/veteran_verified_by directly via the REST API,
-- bypassing the only legitimate write path
-- (dashboard/admin/vet-certification/actions.ts, admin-gated, via
-- supabaseAdmin/service_role).
--
-- Writer audit (every reference to veteran_verified in the codebase):
--   - dashboard/admin/vet-certification/actions.ts: handleVetCertDecision --
--     the sole writer of the veteran_verified boolean itself. requireRole
--     (["ADMIN"]) + supabaseAdmin (service_role). Legitimate, unaffected.
--   - dashboard/admin/users/deleteAccounts.ts: nulls veteran_verified_by
--     only (FK cleanup when the verifying admin's account is deleted).
--     requireRole(["ADMIN"]) + supabaseAdmin. Legitimate, unaffected.
--   - scripts/demo/seed.ts: sets veteran_verified via the demo project's own
--     service-role admin client. Legitimate, unaffected.
--   - contractor/profile/actions.ts (self-service upsert): does NOT include
--     veteran_verified/veteran_verified_at/veteran_verified_by in its
--     payload today -- the app layer was already safe. This migration adds
--     the missing DB-level backstop so that remains true even via a direct
--     API call, or if a future change to that action ever accidentally
--     included these fields.
-- Contractors continue to freely edit their own underlying claim/evidence
-- fields (veteran_applied_at, military_branch, veteran_credential_type,
-- veteran_credential_reference; veteran_rejection_reason is admin-written
-- as real rejection text but the contractor's own reapply flow may still
-- null it back out) -- only the verification-status fields themselves
-- (veteran_verified/veteran_verified_at/veteran_verified_by) are protected
-- here, unchanged from before.
--
-- Implementation: extends the existing protect_contractor_verification_
-- fields() trigger function from 032 (already BEFORE INSERT OR UPDATE ON
-- contractor_profiles, already guarding directory_verified*) with the same
-- check for veteran_verified*. CREATE OR REPLACE updates the function body
-- in place -- the trigger binding from 032 is untouched and does not need
-- to be recreated.

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

    IF NEW.veteran_verified IS DISTINCT FROM OLD.veteran_verified
       OR NEW.veteran_verified_at IS DISTINCT FROM OLD.veteran_verified_at
       OR NEW.veteran_verified_by IS DISTINCT FROM OLD.veteran_verified_by THEN
      RAISE EXCEPTION 'veteran_verified can only be changed by ONP admin review';
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
