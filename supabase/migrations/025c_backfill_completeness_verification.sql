-- Read-only production verification query. Run this immediately after 025b
-- on production, BEFORE deploying the application code that switches file
-- display to project_attachments (the founder's hard ordering gate).
--
-- Each metric is reported SEPARATELY -- malformed/unrecognized paths are
-- never folded into "missing metadata" or any other total, so a malformed
-- path can't silently hide inside an aggregate count.
--
-- PRODUCTION GATE: do not deploy application code unless
--   - missing_metadata_for_recognized_objects = 0
--   - dangling_metadata_rows = 0
--   - duplicate_storage_object_keys = 0
--   - every row from query #5 (malformed/unrecognized paths) has been
--     manually reviewed and understood
--
-- All queries are pure SELECTs -- nothing here writes.

-- 1. Total project-files Storage objects (baseline count).
SELECT count(*)::int AS total_storage_objects
FROM storage.objects
WHERE bucket_id = 'project-files';

-- 2. Total project_attachments metadata rows (should represent every
--    Storage object once the backfill + any post-backfill app uploads are
--    accounted for).
SELECT count(*)::int AS total_attachment_rows
FROM public.project_attachments;

-- 3. Storage objects missing metadata -- SCOPED to recognized (valid UUID
--    project-prefix) paths only, per the gate's explicit wording. A
--    malformed path is reported separately in query #5, never counted here.
SELECT count(*)::int AS missing_metadata_for_recognized_objects
FROM storage.objects o
WHERE o.bucket_id = 'project-files'
  AND (string_to_array(o.name, '/'))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_attachments pa WHERE pa.storage_object_key = o.name
  );

-- 4. Dangling metadata: project_attachments rows whose Storage object no
--    longer exists (would indicate a Storage-side deletion that bypassed
--    the metadata layer -- should be impossible under the shipped design,
--    but verified directly rather than assumed).
SELECT count(*)::int AS dangling_metadata_rows
FROM public.project_attachments pa
WHERE NOT EXISTS (
  SELECT 1 FROM storage.objects o WHERE o.bucket_id = 'project-files' AND o.name = pa.storage_object_key
);

-- 5. Malformed/unrecognized project-prefix paths -- listed individually,
--    never folded into a count-only total, so each one gets manually
--    reviewed before the gate can be considered satisfied.
SELECT o.name AS unrecognized_object_path, o.created_at
FROM storage.objects o
WHERE o.bucket_id = 'project-files'
  AND NOT ( (string_to_array(o.name, '/'))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' )
ORDER BY o.created_at;

-- 6. Duplicate storage_object_key count -- should always be 0 given the
--    unique index from migration 025; verified directly rather than assumed.
SELECT count(*)::int AS duplicate_storage_object_keys
FROM (
  SELECT storage_object_key FROM public.project_attachments
  GROUP BY storage_object_key HAVING count(*) > 1
) dupes;

-- 7. Convenience combined summary (for a quick eyeball read only -- the
--    gate decision must still be made from queries #3, #4, #5, #6
--    individually, not from this row alone).
SELECT
  (SELECT count(*) FROM storage.objects WHERE bucket_id = 'project-files') AS total_storage_objects,
  (SELECT count(*) FROM public.project_attachments) AS total_attachment_rows,
  (SELECT count(*) FROM storage.objects o WHERE o.bucket_id = 'project-files'
     AND (string_to_array(o.name, '/'))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
     AND NOT EXISTS (SELECT 1 FROM public.project_attachments pa WHERE pa.storage_object_key = o.name)
  ) AS missing_metadata_for_recognized_objects,
  (SELECT count(*) FROM public.project_attachments pa
     WHERE NOT EXISTS (SELECT 1 FROM storage.objects o WHERE o.bucket_id = 'project-files' AND o.name = pa.storage_object_key)
  ) AS dangling_metadata_rows,
  (SELECT count(*) FROM storage.objects o WHERE o.bucket_id = 'project-files'
     AND NOT ( (string_to_array(o.name, '/'))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' )
  ) AS unrecognized_path_count,
  (SELECT count(*) FROM (
     SELECT storage_object_key FROM public.project_attachments GROUP BY storage_object_key HAVING count(*) > 1
   ) d) AS duplicate_storage_object_keys;
