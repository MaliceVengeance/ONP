-- Revives public.project_attachments (previously dead: RLS enabled, zero
-- policies, zero rows, never inserted into by any app code) as the metadata
-- table backing the post-publish attachment information-event design.
--
-- revision_id -> project_revisions is dropped, not preserved. project_revisions
-- is itself a separate, fully dead table (0 rows, zero policies) from an
-- earlier, abandoned revision-tracking design that predates and was
-- superseded by the live projects.information_revision_number counter +
-- RFI-trigger system (migrations 021-023). Wiring attachments to the dead
-- table would resurrect unused infrastructure instead of using the one
-- system that actually runs in production.

-- ============================================================
-- 1. Shape the table
-- ============================================================

ALTER TABLE public.project_attachments DROP COLUMN IF EXISTS revision_id;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'project_attachments' AND column_name = 'storage_path'
  ) THEN
    ALTER TABLE public.project_attachments RENAME COLUMN storage_path TO storage_object_key;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'project_attachments' AND column_name = 'file_type'
  ) THEN
    ALTER TABLE public.project_attachments RENAME COLUMN file_type TO mime_type;
  END IF;
END $$;

ALTER TABLE public.project_attachments
  ADD COLUMN IF NOT EXISTS original_filename text,
  ADD COLUMN IF NOT EXISTS file_size_bytes integer,
  ADD COLUMN IF NOT EXISTS related_rfi_id uuid REFERENCES public.rfis(id),
  ADD COLUMN IF NOT EXISTS information_revision_number integer,
  ADD COLUMN IF NOT EXISTS published_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz;

-- original_filename / file_size_bytes / information_revision_number are
-- backfilled as NOT NULL below only after the table is confirmed empty (it
-- is, today) or after the backfill script (025b) has populated every
-- pre-existing row -- doing the NOT NULL flip here, before any data exists
-- or before backfill runs, keeps this migration safe to run standalone
-- against a table that may already have had ALTERs partially applied by a
-- prior attempt.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.project_attachments WHERE original_filename IS NULL LIMIT 1) THEN
    ALTER TABLE public.project_attachments ALTER COLUMN original_filename SET NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.project_attachments WHERE file_size_bytes IS NULL LIMIT 1) THEN
    ALTER TABLE public.project_attachments ALTER COLUMN file_size_bytes SET NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.project_attachments WHERE information_revision_number IS NULL LIMIT 1) THEN
    ALTER TABLE public.project_attachments ALTER COLUMN information_revision_number SET NOT NULL;
  END IF;
END $$;

-- ============================================================
-- 2. Indexes
-- ============================================================
-- project_id: every read path (client listing, contractor RPC, backfill
-- completeness check) filters by project.
-- related_rfi_id: looked up when rendering an RFI's answer alongside its
-- attachments, and by the dedup logic that relies on it being set/unset.
-- storage_object_key UNIQUE: enforces "no duplicate metadata rows per
-- Storage object" (founder requirement) and is what the backfill's
-- ON CONFLICT DO NOTHING idempotency relies on.

CREATE INDEX IF NOT EXISTS project_attachments_project_id_idx ON public.project_attachments (project_id);
CREATE INDEX IF NOT EXISTS project_attachments_related_rfi_id_idx ON public.project_attachments (related_rfi_id) WHERE related_rfi_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS project_attachments_storage_object_key_key ON public.project_attachments (storage_object_key);

-- ============================================================
-- 3. Revision-stamp trigger
-- ============================================================
-- Normal app insert (information_revision_number omitted / NULL): locks the
-- project row, bumps projects.information_revision_number exactly once and
-- stamps the new value IFF this is a standalone (related_rfi_id IS NULL)
-- upload on an OPEN project; otherwise stamps the CURRENT value without
-- bumping. For an inline RFI attachment, related_rfi_id IS NOT NULL, so this
-- always takes the no-bump branch -- and because respondToRfi's own RFI
-- UPDATE (which fires the existing rfis_bump_information_revision trigger)
-- runs BEFORE these attachment inserts in the same request, "current value"
-- here is already the post-answer value: inheriting it without bumping
-- again falls out of ordering, not a special case.
--
-- Backfill insert (information_revision_number explicitly supplied): the
-- trigger respects the caller-provided value verbatim and does not touch
-- projects.information_revision_number at all -- this is what makes the
-- backfill produce zero revision bumps, zero notifications, zero deadline
-- extensions for pre-existing files.

CREATE OR REPLACE FUNCTION public.stamp_and_bump_attachment_revision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_state text;
  v_current_revision integer;
BEGIN
  IF NEW.information_revision_number IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT state::text, information_revision_number
    INTO v_state, v_current_revision
  FROM public.projects
  WHERE id = NEW.project_id
  FOR UPDATE;

  IF v_state = 'OPEN' AND NEW.related_rfi_id IS NULL THEN
    UPDATE public.projects
    SET information_revision_number = information_revision_number + 1,
        updated_at = now()
    WHERE id = NEW.project_id
    RETURNING information_revision_number INTO v_current_revision;
  END IF;

  NEW.information_revision_number := v_current_revision;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS project_attachments_stamp_and_bump ON public.project_attachments;
CREATE TRIGGER project_attachments_stamp_and_bump
  BEFORE INSERT ON public.project_attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.stamp_and_bump_attachment_revision();

-- ============================================================
-- 4. Privileges / RLS
-- ============================================================
-- All application writes to this table go through supabaseAdmin (service
-- role, which bypasses RLS entirely) from server actions -- mirroring the
-- existing uploadProjectFile pattern -- so no authenticated INSERT/UPDATE/
-- DELETE policy is needed or added. Only SELECT policies exist, and only
-- for roles that are supposed to see original_filename directly: the
-- project's own client, and admins. Contractors get NO direct SELECT policy
-- on this table at all -- pre-award neutral labeling and the privacy
-- boundary are enforced entirely through the SECURITY DEFINER RPC added in
-- 025a, not through table RLS, so there is no raw-table path that could
-- leak original_filename the way the pre-024 Storage policy leaked file
-- access. anon never had a working path here (RLS blocked it even with the
-- stale grants), but the grants themselves are revoked now for hygiene.

REVOKE ALL ON public.project_attachments FROM anon;

DROP POLICY IF EXISTS "clients can read own project attachments" ON public.project_attachments;
CREATE POLICY "clients can read own project attachments" ON public.project_attachments
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_attachments.project_id AND p.client_id = auth.uid())
  );

DROP POLICY IF EXISTS "admins can read all project attachments" ON public.project_attachments;
CREATE POLICY "admins can read all project attachments" ON public.project_attachments
  FOR SELECT TO authenticated
  USING (public.is_admin_safe());

-- ============================================================
-- 5. Storage RLS: close the DRAFT-only delete gap
-- ============================================================
-- Previously "clients can delete own project files" had no state condition
-- at all -- this was already flagged as a gap in the original attachment
-- audit. Now that OPEN/AWARDED/etc. deletion must be blocked, this is the
-- actual backstop (the app-layer server action is the other half, but a
-- direct Storage API call must fail here regardless of the app).

DROP POLICY IF EXISTS "clients can delete own project files" ON storage.objects;
CREATE POLICY "clients can delete own project files" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'project-files'
    AND (
      SELECT p.client_id = auth.uid() AND p.state = 'DRAFT'
      FROM public.projects p
      WHERE p.id::text = (string_to_array(objects.name, '/'))[1]
    )
  );

-- ============================================================
-- 6. Contractor attachment RPC (privacy-preserving listing)
-- ============================================================
-- Reuses contractor_can_access_project_files() from migration 024 as the
-- single source of truth for "can this contractor see this project's files
-- at all" -- deliberately not re-deriving that boundary here, to avoid
-- recreating the exact class of mistake migration 024 fixed (a second,
-- looser access rule drifting from the real one). Returns the opaque
-- storage_object_key unconditionally (safe -- it carries no filename), a
-- computed stable neutral label, and original_filename ONLY when the
-- caller is the awarded contractor for this project. related_rfi_id and
-- raw created_at are never returned, per the founder's explicit
-- instruction not to expose either to contractors.
--
-- SECURITY DEFINER role-gate: contractor_can_access_project_files() does
-- NOT itself check profiles.role -- migration 024's Storage policy is safe
-- despite that because the policy performs its OWN separate role check
-- before calling the helper. This RPC has no equivalent outer check (no
-- Storage policy wraps it), so relying on the helper alone would let ANY
-- authenticated role (CLIENT, ADMIN, INSPECTOR) -- not just CONTRACTOR --
-- pull privacy-filtered attachment metadata for any project where the
-- helper's OPEN/awarded condition happens to be true, bypassing the
-- app-layer requireRole() call entirely (a bare SECURITY DEFINER function
-- callable via RPC cannot rely on application-layer role checks -- the
-- caller can invoke it directly). The role check now lives inside the
-- function itself, not just in the app.

CREATE OR REPLACE FUNCTION public.get_contractor_project_attachments(p_project_id uuid)
RETURNS TABLE (
  id uuid,
  storage_object_key text,
  mime_type text,
  file_size_bytes integer,
  display_label text,
  original_filename text,
  is_new boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $function$
  WITH ranked AS (
    SELECT
      pa.id,
      pa.storage_object_key,
      pa.mime_type,
      pa.file_size_bytes,
      pa.original_filename,
      pa.information_revision_number,
      ROW_NUMBER() OVER (PARTITION BY pa.project_id ORDER BY pa.created_at ASC) AS attachment_number,
      lower(regexp_replace(pa.original_filename, '^.*(\.[A-Za-z0-9]+)$', '\1')) AS ext
    FROM public.project_attachments pa
    WHERE pa.project_id = p_project_id
      AND pa.withdrawn_at IS NULL
  ),
  my_ack AS (
    SELECT COALESCE(MAX(bv.acknowledged_information_revision), 0) AS acknowledged_revision
    FROM public.bids b
    JOIN public.bid_versions bv ON bv.bid_id = b.id
    WHERE b.project_id = p_project_id AND b.contractor_id = auth.uid()
  ),
  is_awarded AS (
    SELECT EXISTS (
      SELECT 1 FROM public.project_awards pa
      WHERE pa.project_id = p_project_id AND pa.awarded_contractor_id = auth.uid()
    ) AS awarded
  )
  SELECT
    r.id,
    r.storage_object_key,
    r.mime_type,
    r.file_size_bytes,
    'Attachment ' || r.attachment_number || COALESCE(r.ext, '') AS display_label,
    CASE WHEN (SELECT awarded FROM is_awarded) THEN r.original_filename ELSE NULL END AS original_filename,
    r.information_revision_number > (SELECT acknowledged_revision FROM my_ack) AS is_new
  FROM ranked r
  WHERE EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'CONTRACTOR'
  )
  AND public.contractor_can_access_project_files(p_project_id);
$function$;

-- Explicit, minimal execute privileges -- PUBLIC (and therefore anon, which
-- otherwise inherits it) must not be able to invoke a SECURITY DEFINER
-- function that reads privacy-filtered attachment metadata. Postgres grants
-- EXECUTE to PUBLIC by default on function creation, so this must be
-- revoked explicitly; it is not enough to only GRANT to authenticated.
--
-- Supabase projects also carry a schema-level ALTER DEFAULT PRIVILEGES
-- grant that gives anon and authenticated EXECUTE on every new public-schema
-- function automatically -- confirmed live on staging (anon retained direct
-- EXECUTE even after revoking PUBLIC). REVOKE FROM PUBLIC alone does not
-- touch that separate, explicit anon grant; anon must be revoked by name.
REVOKE ALL ON FUNCTION public.get_contractor_project_attachments(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_contractor_project_attachments(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_contractor_project_attachments(uuid) TO authenticated;

-- Same hardening for contractor_can_access_project_files(): it still had
-- its default PUBLIC + anon EXECUTE grants from migration 024. Confirmed
-- safe to tighten -- the only caller is the "contractors can read
-- authorized project files" Storage policy, which runs strictly as the
-- authenticated role (per `TO authenticated` on the policy itself); no
-- anon-facing Storage policy references this function, and
-- service_role/postgres bypass RLS (and therefore never need to call it)
-- entirely. Revoking PUBLIC/anon does not change Storage policy evaluation
-- for the authenticated role, which retains its own explicit grant below.
REVOKE ALL ON FUNCTION public.contractor_can_access_project_files(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.contractor_can_access_project_files(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.contractor_can_access_project_files(uuid) TO authenticated;
