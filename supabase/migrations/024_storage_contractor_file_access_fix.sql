-- Closes a Storage RLS gap discovered during the post-publish attachment
-- design audit: "contractors can list open project files" was a SELECT
-- policy gated on role alone (CONTRACTOR/ADMIN), with NO project-id or
-- state predicate at all. Because Postgres RLS OR's multiple permissive
-- SELECT policies together, this policy alone granted any authenticated
-- contractor SELECT (list + signed-URL read) access to files under ANY
-- project's storage prefix, in ANY state -- including DRAFT projects that
-- were never published -- regardless of what the narrower, state-gated
-- "contractors can read open project files" policy intended to allow.
--
-- Fix: drop both existing contractor SELECT policies and replace them with
-- a single policy whose predicate matches the app's actual, already-proven
-- project-visibility boundary -- the exact condition used by
-- get_open_project_detail(): a project is contractor-visible if it is
-- OPEN, or if this contractor was specifically awarded it. This is the
-- same boundary the product already uses to decide whether a contractor
-- may view a project's bidding detail at all, so file access now matches
-- it exactly rather than approximating it. It also closes the separately
-- known "awarded contractor loses file access after award" gap in the
-- same change, since project_awards is now part of the predicate.
--
-- REVISED (pre-production verification): the RPC's raw boundary (OPEN or
-- awarded) is broader than the actual, enforced application boundary.
-- The contractor project-detail AND open-project-list pages both apply a
-- subscription gate (ACTIVE/TRIALING in contractor_subscriptions) BEFORE
-- ever calling get_open_project_detail / list_open_projects, with a
-- narrow carve-out: a contractor who already has a bids row on a specific
-- OPEN project keeps access to that project's detail page (and therefore
-- its files) even if their subscription has since lapsed -- this is
-- intentional existing product behavior ("blocking cold browsing, not
-- punishing existing bidders"), not an oversight. Matching the RPC alone,
-- as the original version of this migration did, would let an
-- unsubscribed, never-bid contractor bypass that page-layer gate entirely
-- by calling Supabase Storage directly (e.g. the client-side
-- createSignedUrl call in ProjectFileLink.tsx) -- confirmed as a real gap
-- during pre-production verification, not merely theoretical. The helper
-- below now reproduces the exact application boundary: OPEN AND
-- (subscribed OR already bid), OR unconditionally awarded. Still no
-- service-area/ZIP check -- confirmed absent from both gating pages.
--
-- contractor_subscriptions.contractor_id carries a UNIQUE constraint (at
-- most one row per contractor today), but the subscription check below
-- uses EXISTS against a qualifying row rather than assuming a single-row
-- shape, so it stays correct even if that constraint is ever relaxed.
--
-- A single merged policy (rather than two policies with different scopes)
-- is used deliberately, per the "do not leave two permissive policies
-- where one is broader than the other" requirement -- one predicate
-- cannot accidentally widen past what it explicitly allows.
--
-- Client delete/upload policies and admin read policy are intentionally
-- untouched -- out of scope for this fix, deferred to the attachment
-- information-event checkpoint.
--
-- IMPORTANT: a plain USING-clause subquery against public.projects /
-- public.project_awards runs under those tables' OWN RLS, evaluated as
-- the CURRENT role (authenticated / contractor) -- it is NOT automatically
-- bypassed just because it's nested inside a storage.objects policy.
-- projects' RLS has no policy granting a plain contractor row-level
-- SELECT access to OPEN-state rows (that visibility is normally mediated
-- exclusively through the SECURITY DEFINER RPC get_open_project_detail),
-- so a naive subquery here would silently evaluate to false for every
-- contractor, on every project, regardless of state -- confirmed by
-- direct staging testing before this fix. A SECURITY DEFINER helper
-- function is required to bypass that inner RLS deliberately and safely,
-- mirroring the existing public.is_admin_safe() pattern used elsewhere
-- in this schema for the identical reason.

CREATE OR REPLACE FUNCTION public.contractor_can_access_project_files(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = p_project_id
      AND (
        (
          p.state = 'OPEN'
          AND (
            EXISTS (
              SELECT 1 FROM public.contractor_subscriptions cs
              WHERE cs.contractor_id = auth.uid()
                AND cs.status IN ('ACTIVE', 'TRIALING')
            )
            OR EXISTS (
              SELECT 1 FROM public.bids b
              WHERE b.project_id = p_project_id
                AND b.contractor_id = auth.uid()
            )
          )
        )
        OR EXISTS (
          SELECT 1 FROM public.project_awards pa
          WHERE pa.project_id = p.id
            AND pa.awarded_contractor_id = auth.uid()
        )
      )
  );
$function$;

DROP POLICY IF EXISTS "contractors can list open project files" ON storage.objects;
DROP POLICY IF EXISTS "contractors can read open project files" ON storage.objects;
DROP POLICY IF EXISTS "contractors can read authorized project files" ON storage.objects;

CREATE POLICY "contractors can read authorized project files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-files'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'CONTRACTOR'
  )
  AND public.contractor_can_access_project_files(
    ((string_to_array(objects.name, '/'))[1])::uuid
  )
);
