-- ============================================================================
-- Migration 034: Stop exposing RFI asker identity to other contractors
-- ============================================================================
--
-- Product rule (locked 2026-10-16):
--   - Contractors may read the shared RFI question/answer content they are
--     entitled to see.
--   - Contractors must not be able to identify which competing contractor
--     asked an RFI.
--   - The project client and ONP Admin keep access to the asker identity.
--   - The awarded contractor does not gain other contractors' RFI identities
--     merely because they won.
--
-- Root cause: two permissive SELECT policies on public.rfis returned whole
-- rows -- including contractor_id (the asker) and responded_by (the client's
-- user id) -- to contractors:
--   1. rfis_select_contractor (016): any CONTRACTOR/ADMIN profile, on any
--      project while project_is_open_for_bidding() -- no bid relationship
--      required. During open bidding every contractor, including ones that
--      never bid, could read every RFI row with its contractor_id.
--   2. "read rfis for published projects" (016): any authenticated user who
--      can see the projects row of a non-DRAFT/PENDING_PAYMENT project. Its
--      EXISTS subquery runs under projects RLS, so for contractors it only
--      ever matched the awarded contractor (projects_select_awarded_
--      contractor) -- after award, the winner could read every losing
--      bidder's contractor_id.
-- contractor_profiles_public_select (is_listed = true) then resolves any
-- exposed contractor_id to a business name. Row-level security cannot hide
-- a single column from one role while the client still reads it, so
-- contractor reads move to a SECURITY DEFINER function that returns the
-- shared content without the identity columns.
--
-- Verified live on the demo project before this change (PostgREST-equivalent
-- role + JWT-claim impersonation): during open bidding a bidder and a
-- contractor with no bid each saw 4 asker identities; after award the
-- awarded contractor saw the 3 losing bidders' identities. Unrelated clients,
-- anon, and losing bidders after award saw nothing.
--
-- Reader audit (every SELECT on public.rfis in src/):
--   - contractor/projects/[id]/page.tsx (RFI counts + client pre-answers),
--     contractor/projects/[id]/rfis/page.tsx (shared Q&A list), and
--     contractor/projects/[id]/rfis/actions.ts (one-per-project duplicate
--     check) -- moved to get_contractor_project_rfis() in the same change.
--     None of them ever selected contractor_id.
--   - client/projects/[id]/rfis/actions.ts reads contractor_id (to email the
--     asker) via the client's own session -- still allowed by
--     rfis_select_client, unchanged.
--   - client/projects/[id]/page.tsx, client/projects/actions.ts and every
--     other remaining reader use supabaseAdmin (service_role), or are admin
--     pages covered by rfis_all_admin -- unaffected.
--   - No database function reads rfis (only the one-time backfill in 027),
--     so reveal, award, and bid-eligibility logic do not depend on these
--     policies.
--
-- Visibility boundary for the new function: identical to project files
-- (contractor_can_access_project_files, migration 024) -- OPEN and (active
-- subscription OR already bid), OR awarded to the caller. This also closes a
-- side gap: once the deadline passed (state still OPEN, award pending),
-- project_is_open_for_bidding() turned false and bidders could no longer read
-- any RFIs at all, even their own, although their project page still loaded.
--
-- Unchanged: rfis_select_client, rfis_update_client, rfis_insert_contractor,
-- rfis_all_admin. Inspectors lose the incidental read they had through the
-- published-projects policy; no inspector code path reads rfis.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_contractor_project_rfis(p_project_id uuid)
RETURNS TABLE (
  id uuid,
  catalog_id uuid,
  catalog_code text,
  catalog_prompt text,
  question text,
  response text,
  responded_at timestamptz,
  status text,
  created_at timestamptz,
  revision_number integer,
  catalog_is_open_ended boolean,
  asked_by_me boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $function$
  -- Deliberately omits contractor_id (the asker) and responded_by (the
  -- client's user id). asked_by_me only ever reveals the caller's own
  -- authorship.
  SELECT
    r.id,
    r.catalog_id,
    c.code::text,
    c.prompt::text,
    r.question,
    r.response,
    r.responded_at,
    r.status,
    r.created_at,
    r.revision_number,
    r.catalog_is_open_ended,
    (r.contractor_id IS NOT NULL AND r.contractor_id = auth.uid()) AS asked_by_me
  FROM public.rfis r
  LEFT JOIN public.rfi_catalog c ON c.id = r.catalog_id
  WHERE r.project_id = p_project_id
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles pr
        WHERE pr.id = auth.uid() AND pr.role = 'ADMIN'
      )
      OR (
        EXISTS (
          SELECT 1 FROM public.profiles pr
          WHERE pr.id = auth.uid() AND pr.role = 'CONTRACTOR'
        )
        AND public.contractor_can_access_project_files(p_project_id)
      )
    )
  ORDER BY r.created_at ASC;
$function$;

REVOKE ALL ON FUNCTION public.get_contractor_project_rfis(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_contractor_project_rfis(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_contractor_project_rfis(uuid) TO authenticated;

DROP POLICY IF EXISTS "rfis_select_contractor" ON public.rfis;
DROP POLICY IF EXISTS "read rfis for published projects" ON public.rfis;
