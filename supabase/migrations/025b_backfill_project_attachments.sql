-- One-time backfill: creates project_attachments rows for every pre-existing
-- Storage object in the project-files bucket, so the metadata-driven
-- application code (shipped after this backfill is verified complete, per
-- the founder's hard ordering requirement) has something to display for
-- files uploaded before this checkpoint.
--
-- Does NOT rename or re-upload any Storage object (legacy objects keep
-- their filename-embedding key -- tracked separately as a future hardening
-- item, "Legacy project-file opaque-key migration", not implemented here).
--
-- Idempotent: ON CONFLICT (storage_object_key) DO NOTHING, relying on the
-- unique index added in migration 025. Safe to re-run.
--
-- Grandfathering: information_revision_number is set explicitly to each
-- project's CURRENT counter value, and published_at is backdated to the
-- Storage object's own created_at. Because information_revision_number is
-- supplied (non-NULL) on insert, the project_attachments_stamp_and_bump
-- trigger (025) takes its early-return branch and does not touch
-- projects.information_revision_number at all -- zero bumps, zero
-- notifications, zero deadline extensions, by construction.
--
-- Legacy key format is `${projectId}/${Date.now()}_${originalFilename}`.
-- original_filename is recovered by stripping the leading `<digits>_`
-- timestamp prefix (the same pattern the pre-this-checkpoint UI used to
-- derive a display name client-side, in ProjectFileLink.tsx). Where a key's
-- remainder does NOT match that pattern (unexpected legacy shape), the full
-- remainder is used as original_filename instead, and the row is left
-- discoverable via the verification query at the bottom of this file rather
-- than skipped -- every Storage object gets a metadata row.

INSERT INTO public.project_attachments (
  project_id,
  storage_object_key,
  original_filename,
  mime_type,
  file_size_bytes,
  uploaded_by,
  related_rfi_id,
  information_revision_number,
  published_at,
  withdrawn_at
)
SELECT
  (string_to_array(o.name, '/'))[1]::uuid AS project_id,
  o.name AS storage_object_key,
  CASE
    WHEN substring(o.name FROM '/(.*)$') ~ '^[0-9]+_.+$'
      THEN regexp_replace(substring(o.name FROM '/(.*)$'), '^[0-9]+_', '')
    ELSE substring(o.name FROM '/(.*)$')
  END AS original_filename,
  o.metadata->>'mimetype' AS mime_type,
  COALESCE((o.metadata->>'size')::integer, 0) AS file_size_bytes,
  p.client_id AS uploaded_by, -- legacy approximation: true uploader was never recorded; the project's client is the closest available fact
  NULL AS related_rfi_id,
  p.information_revision_number AS information_revision_number,
  o.created_at AS published_at,
  NULL AS withdrawn_at
FROM storage.objects o
JOIN public.projects p ON p.id::text = (string_to_array(o.name, '/'))[1]
WHERE o.bucket_id = 'project-files'
  AND (string_to_array(o.name, '/'))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
ON CONFLICT (storage_object_key) DO NOTHING;

-- Verification / malformed-path report (read-only, run after the INSERT
-- above). Two things are worth surfacing, not silently passing over:
--   1. Objects whose leading path segment isn't a valid project UUID at all
--      (the JOIN above would simply exclude these -- they get NO row, and
--      that's a real gap worth knowing about, not an acceptable skip).
--   2. Rows that WERE inserted but via the fallback (non-timestamp-prefixed)
--      filename-recovery branch, so they can be spot-checked.

-- 1. Un-backfillable objects (malformed/unrecognized project_id segment):
SELECT o.name AS unrecognized_object_path
FROM storage.objects o
WHERE o.bucket_id = 'project-files'
  AND NOT ( (string_to_array(o.name, '/'))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' );

-- 2. Rows backfilled via the fallback (non-standard legacy filename) branch:
SELECT pa.id, pa.storage_object_key, pa.original_filename
FROM public.project_attachments pa
WHERE pa.related_rfi_id IS NULL
  AND NOT (substring(pa.storage_object_key FROM '/(.*)$') ~ '^[0-9]+_.+$');
