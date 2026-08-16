-- ============================================================================
-- Migration 029: Contractor-safe Bid Information History RPC
-- ============================================================================
--
-- Supports the UI layer for the withdrawal lifecycle (028): a contractor
-- needs to see WITHDRAWN attachments (still downloadable, same neutral-
-- filename rules as active files) alongside a stub-only entry for
-- SENSITIVE_REMOVAL_PENDING/SENSITIVE_REMOVED attachments (no filename, no
-- thumbnail, no Storage key, no download link -- enforced by nulling those
-- columns in this RPC's own SELECT, not by the client hiding them).
--
-- Sibling of get_contractor_project_attachments (025), same access-boundary
-- reuse (contractor_can_access_project_files), same neutral pre-award /
-- real-filename-post-award rule for the columns that carry it. The only
-- difference: this RPC includes non-ACTIVE rows and adds attachment_status/
-- withdrawal_reason_code/withdrawn_at.
--
-- withdrawal_reason_code is included so contractors see the reason
-- *category* only -- never withdrawal_reason_other_text (the client's free
-- text), which this RPC deliberately does not select at all.

CREATE OR REPLACE FUNCTION public.get_contractor_project_attachment_history(p_project_id uuid)
RETURNS TABLE (
  id uuid,
  storage_object_key text,
  mime_type text,
  file_size_bytes integer,
  display_label text,
  original_filename text,
  attachment_status text,
  withdrawal_reason_code text,
  withdrawn_at timestamptz,
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
      pa.attachment_status,
      pa.withdrawal_reason_code,
      pa.withdrawn_at,
      ROW_NUMBER() OVER (PARTITION BY pa.project_id ORDER BY pa.created_at ASC) AS attachment_number,
      lower(regexp_replace(pa.original_filename, '^.*(\.[A-Za-z0-9]+)$', '\1')) AS ext
    FROM public.project_attachments pa
    WHERE pa.project_id = p_project_id
      AND pa.attachment_status IN ('ACTIVE', 'WITHDRAWN', 'SENSITIVE_REMOVAL_PENDING', 'SENSITIVE_REMOVED')
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
    CASE WHEN r.attachment_status IN ('ACTIVE', 'WITHDRAWN') THEN r.storage_object_key ELSE NULL END,
    CASE WHEN r.attachment_status IN ('ACTIVE', 'WITHDRAWN') THEN r.mime_type ELSE NULL END,
    CASE WHEN r.attachment_status IN ('ACTIVE', 'WITHDRAWN') THEN r.file_size_bytes ELSE NULL END,
    CASE
      WHEN r.attachment_status IN ('ACTIVE', 'WITHDRAWN') THEN 'Attachment ' || r.attachment_number || COALESCE(r.ext, '')
      ELSE 'Removed attachment'
    END AS display_label,
    CASE
      WHEN r.attachment_status IN ('ACTIVE', 'WITHDRAWN') AND (SELECT awarded FROM is_awarded) THEN r.original_filename
      ELSE NULL
    END AS original_filename,
    r.attachment_status,
    CASE WHEN r.attachment_status = 'WITHDRAWN' THEN r.withdrawal_reason_code ELSE NULL END,
    r.withdrawn_at,
    r.information_revision_number > (SELECT acknowledged_revision FROM my_ack) AS is_new
  FROM ranked r
  WHERE EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'CONTRACTOR'
  )
  AND public.contractor_can_access_project_files(p_project_id);
$function$;

REVOKE ALL ON FUNCTION public.get_contractor_project_attachment_history(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_contractor_project_attachment_history(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_contractor_project_attachment_history(uuid) TO authenticated;
