-- ============================================================================
-- Migration 030: Client-driven sensitive-removal decision workflow
-- ============================================================================
--
-- Product policy revision: ONP does not routinely adjudicate whether a
-- client's privacy claim is legitimate. A sensitive removal immediately
-- quarantines the file and pauses bidding (unchanged from 028) but now asks
-- the CLIENT what happens next -- only "I'm not sure" or an explicit
-- high-risk flag reaches the admin queue. Quarantine mechanics, revision/
-- deadline/notification behavior, and Storage/RLS access control are all
-- unchanged from 028 -- this migration only changes who decides the outcome
-- and adds the missing quarantine-completion + concurrency guarantees found
-- during design review.
--
-- Does not touch 016 or re-run any part of 025/028/029. Additive only.
-- ============================================================================

-- ============================================================
-- 1. New columns + status/resolution enum changes
-- ============================================================
-- BIDDING_PAUSED retired: audited actual usage across the codebase and
-- confirmed nothing has ever written this status -- the review row goes
-- straight from PENDING_REVIEW (now PENDING_CLIENT_DECISION) to
-- BIDDING_RESUMED. Carrying an unused status into the new centralized
-- predicate would be exactly the kind of ambiguous, hand-maintained state
-- list this migration is meant to eliminate.

ALTER TABLE public.attachment_sensitive_removal_reviews
  ADD COLUMN IF NOT EXISTS client_decision text,
  ADD COLUMN IF NOT EXISTS is_high_risk boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS replacement_attachment_id uuid REFERENCES public.project_attachments(id);

ALTER TABLE public.attachment_sensitive_removal_reviews
  DROP CONSTRAINT IF EXISTS attachment_sensitive_removal_reviews_status_check;
ALTER TABLE public.attachment_sensitive_removal_reviews
  ADD CONSTRAINT attachment_sensitive_removal_reviews_status_check
  CHECK (status IN (
    'PENDING_CLIENT_DECISION', 'PENDING_REVIEW', 'BIDDING_RESUMED',
    'RESOLVED_NO_ACTION', 'RESOLVED_NOT_NEEDED', 'RESOLVED_REPLACEMENT_UPLOADED'
  ));

ALTER TABLE public.attachment_sensitive_removal_reviews
  DROP CONSTRAINT IF EXISTS attachment_sensitive_removal_reviews_client_decision_check;
ALTER TABLE public.attachment_sensitive_removal_reviews
  ADD CONSTRAINT attachment_sensitive_removal_reviews_client_decision_check
  CHECK (client_decision IS NULL OR client_decision IN ('NOT_NEEDED', 'REPLACEMENT_UPLOADED', 'UNSURE'));

-- Existing rows created under the 028 workflow (status = 'PENDING_REVIEW',
-- created before any client-decision concept existed) are left exactly as
-- they are -- they remain genuinely admin-actionable, which is correct:
-- they were never given a chance to self-resolve, so treating them as
-- still-pending-admin is the safe interpretation, not a data migration.

-- ============================================================
-- 2. withdraw_project_attachment(): new rows start PENDING_CLIENT_DECISION,
--    optional high-risk flag skips straight to PENDING_REVIEW
-- ============================================================
-- Everything else in this function -- the guarded status transition,
-- inline deadline evaluation, state-aware notification fan-out, revision
-- bump trigger -- is byte-for-byte unchanged from the 028 version (itself
-- already corrected for the actor-id/grant issues found in that checkpoint).
-- Only the SENSITIVE_REMOVE branch's review-insert and the new parameter
-- change.

DROP FUNCTION IF EXISTS public.withdraw_project_attachment(uuid, text, text, text, uuid);

CREATE OR REPLACE FUNCTION public.withdraw_project_attachment(
  p_attachment_id uuid,
  p_action text,
  p_reason_code text,
  p_reason_other_text text,
  p_actor_id uuid,
  p_is_high_risk boolean DEFAULT false
)
RETURNS TABLE (
  ok boolean,
  already_handled boolean,
  event_id uuid,
  new_status text,
  review_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_actor_role text;
  v_target_status text;
  v_event_type text;
  v_project_id uuid;
  v_client_id uuid;
  v_new_revision integer;
  v_event_id uuid;
  v_review_id uuid;
  v_notification_kind text;
  v_project_state text;
  v_awarded_contractor_id uuid;
BEGIN
  SELECT role::text INTO v_actor_role FROM public.profiles WHERE id = p_actor_id;
  IF v_actor_role IS NULL THEN
    RAISE EXCEPTION 'Actor not found';
  END IF;
  IF v_actor_role NOT IN ('CLIENT', 'ADMIN') THEN
    RAISE EXCEPTION 'Forbidden: role % is not permitted to withdraw attachments', v_actor_role;
  END IF;

  IF p_action = 'WITHDRAW' THEN
    v_target_status := 'WITHDRAWN';
    v_event_type := 'WITHDRAWN';
  ELSIF p_action = 'SENSITIVE_REMOVE' THEN
    v_target_status := 'SENSITIVE_REMOVAL_PENDING';
    v_event_type := 'SENSITIVE_REMOVAL_PENDING';
  ELSE
    RAISE EXCEPTION 'Invalid action: %', p_action;
  END IF;

  SELECT pa.project_id, p.client_id INTO v_project_id, v_client_id
  FROM public.project_attachments pa
  JOIN public.projects p ON p.id = pa.project_id
  WHERE pa.id = p_attachment_id;

  IF v_project_id IS NULL THEN
    RAISE EXCEPTION 'Attachment not found';
  END IF;

  IF v_actor_role = 'CLIENT' AND v_client_id IS DISTINCT FROM p_actor_id THEN
    RAISE EXCEPTION 'Forbidden: actor does not own this project';
  END IF;

  -- This UPDATE's row lock on project_attachments is unrelated to the
  -- projects-row lock discussed in section 5 below -- the projects row is
  -- separately locked further down, only for the SENSITIVE_REMOVE branch.
  UPDATE public.project_attachments
  SET attachment_status = v_target_status,
      withdrawal_reason_code = p_reason_code,
      withdrawal_reason_other_text = p_reason_other_text,
      withdrawn_by = p_actor_id,
      withdrawn_at = now()
  WHERE id = p_attachment_id
    AND attachment_status = 'ACTIVE'
  RETURNING withdrawal_information_revision_number
    INTO v_new_revision;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, true, NULL::uuid, NULL::text, NULL::uuid;
    RETURN;
  END IF;

  PERFORM public.apply_rfi_deadline_extension(v_project_id);

  INSERT INTO public.attachment_lifecycle_events (attachment_id, project_id, event_type, information_revision_number, deadline_extension_evaluated)
  VALUES (p_attachment_id, v_project_id, v_event_type, v_new_revision, true)
  RETURNING id INTO v_event_id;

  v_notification_kind := CASE WHEN p_action = 'SENSITIVE_REMOVE' THEN 'file_sensitive_removed' ELSE 'file_withdrawn' END;

  SELECT state::text INTO v_project_state FROM public.projects WHERE id = v_project_id;
  SELECT pa.awarded_contractor_id INTO v_awarded_contractor_id
    FROM public.project_awards pa WHERE pa.project_id = v_project_id;

  IF v_awarded_contractor_id IS NOT NULL THEN
    INSERT INTO public.notification_outbox (kind, project_id, recipient_contractor_id, payload, event_key)
    VALUES (
      v_notification_kind,
      v_project_id,
      v_awarded_contractor_id,
      jsonb_build_object('event_id', v_event_id),
      v_event_id::text || ':' || v_awarded_contractor_id::text || ':' || v_notification_kind
    )
    ON CONFLICT (event_key) WHERE event_key IS NOT NULL DO NOTHING;
  ELSIF v_project_state = 'OPEN' THEN
    INSERT INTO public.notification_outbox (kind, project_id, recipient_contractor_id, payload, event_key)
    SELECT
      v_notification_kind,
      v_project_id,
      b.contractor_id,
      jsonb_build_object('event_id', v_event_id),
      v_event_id::text || ':' || b.contractor_id::text || ':' || v_notification_kind
    FROM (SELECT DISTINCT contractor_id FROM public.bids WHERE project_id = v_project_id) b
    ON CONFLICT (event_key) WHERE event_key IS NOT NULL DO NOTHING;
  END IF;

  UPDATE public.attachment_lifecycle_events
  SET notifications_enqueued_at = now()
  WHERE id = v_event_id;

  IF p_action = 'SENSITIVE_REMOVE' THEN
    INSERT INTO public.attachment_sensitive_removal_reviews (project_id, attachment_id, requested_by, status, is_high_risk, bidding_paused_at)
    VALUES (
      v_project_id,
      p_attachment_id,
      p_actor_id,
      CASE WHEN p_is_high_risk THEN 'PENDING_REVIEW' ELSE 'PENDING_CLIENT_DECISION' END,
      p_is_high_risk,
      now()
    )
    RETURNING id INTO v_review_id;

    UPDATE public.attachment_lifecycle_events SET review_id = v_review_id WHERE id = v_event_id;

    -- This UPDATE's implicit row lock on `projects`, held until this
    -- transaction commits, is what serializes against a concurrent pause-
    -- clear attempt (maybe_clear_sensitive_removal_pause, section 5) --
    -- that function takes the same row's lock before evaluating whether
    -- anything is still unresolved, so it cannot observe a state where this
    -- INSERT has happened but this UPDATE (and the pause it sets) hasn't.
    UPDATE public.projects
    SET bidding_paused_at = now(),
        bidding_pause_reason = CASE WHEN p_is_high_risk THEN 'High-risk sensitive file removal pending admin review' ELSE 'Sensitive file removal pending resolution' END,
        updated_at = now()
    WHERE id = v_project_id
      AND bidding_paused_at IS NULL;
  END IF;

  RETURN QUERY SELECT true, false, v_event_id, v_target_status, v_review_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.withdraw_project_attachment(uuid, text, text, text, uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.withdraw_project_attachment(uuid, text, text, text, uuid, boolean) FROM anon;
REVOKE ALL ON FUNCTION public.withdraw_project_attachment(uuid, text, text, text, uuid, boolean) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.withdraw_project_attachment(uuid, text, text, text, uuid, boolean) TO service_role;

-- ============================================================
-- 3. project_has_unresolved_sensitive_removal(): the single predicate
-- ============================================================
-- Kept strictly internal per explicit requirement -- an arbitrary
-- authenticated user must not be able to probe project UUIDs and learn
-- whether another project has an unresolved privacy incident. Every caller
-- of this function is itself a SECURITY DEFINER function owned by the same
-- role (postgres), so internal calls succeed regardless of grants to the
-- originally-invoking role -- Postgres privilege checks for a call made
-- from inside a SECURITY DEFINER function's body run as that function's
-- owner, not as the session's original role. No grant beyond the implicit
-- owner privilege is required or given.

CREATE OR REPLACE FUNCTION public.project_has_unresolved_sensitive_removal(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $function$
  SELECT
    EXISTS (
      SELECT 1
      FROM public.attachment_sensitive_removal_reviews r
      JOIN public.project_attachments pa ON pa.id = r.attachment_id
      WHERE r.project_id = p_project_id
        AND (
          r.status IN ('PENDING_CLIENT_DECISION', 'PENDING_REVIEW')
          OR NOT (pa.attachment_status = 'SENSITIVE_REMOVED' AND pa.original_object_deleted_at IS NOT NULL)
        )
    )
    OR EXISTS (
      -- Defensive: an attachment stuck mid-quarantine blocks resumption
      -- even if, hypothetically, its review row were missing or already
      -- (wrongly) marked resolved.
      SELECT 1 FROM public.project_attachments pa2
      WHERE pa2.project_id = p_project_id
        AND pa2.attachment_status = 'SENSITIVE_REMOVAL_PENDING'
    );
$function$;

REVOKE ALL ON FUNCTION public.project_has_unresolved_sensitive_removal(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.project_has_unresolved_sensitive_removal(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.project_has_unresolved_sensitive_removal(uuid) FROM authenticated;
-- No GRANT statement at all -- not even service_role. Every caller is a
-- fellow postgres-owned SECURITY DEFINER function; nothing needs to invoke
-- this directly from application code, matching the requirement that UI
-- needs be satisfied through already-authorized project/review data
-- instead.

-- ============================================================
-- 4. maybe_clear_sensitive_removal_pause(): the single, lock-serialized
--    check-then-clear operation
-- ============================================================
-- Locks the projects row FIRST, evaluates the predicate WHILE holding that
-- lock, and only then conditionally clears the pause -- eliminating the
-- race between "check" and "clear" that a separate check-then-UPDATE in
-- each of the three call sites would otherwise have. withdraw_project_
-- attachment's own pause-SETTING UPDATE (section 2) takes the same row's
-- lock, so the two sides serialize against each other automatically: a
-- concurrent new sensitive-removal transaction and a concurrent pause-clear
-- attempt on the same project can never interleave in a way that leaves an
-- unresolved incident with no pause in effect.

CREATE OR REPLACE FUNCTION public.maybe_clear_sensitive_removal_pause(p_project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_cleared boolean := false;
BEGIN
  PERFORM 1 FROM public.projects WHERE id = p_project_id FOR UPDATE;

  IF NOT public.project_has_unresolved_sensitive_removal(p_project_id) THEN
    UPDATE public.projects
    SET bidding_paused_at = NULL,
        bidding_pause_reason = NULL,
        updated_at = now()
    WHERE id = p_project_id
      AND bidding_paused_at IS NOT NULL
    RETURNING true INTO v_cleared;
  END IF;

  RETURN COALESCE(v_cleared, false);
END;
$function$;

REVOKE ALL ON FUNCTION public.maybe_clear_sensitive_removal_pause(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.maybe_clear_sensitive_removal_pause(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.maybe_clear_sensitive_removal_pause(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.maybe_clear_sensitive_removal_pause(uuid) TO service_role;
-- service_role only, same reasoning as the other internal write paths --
-- callers are resolve_sensitive_removal_client_decision and
-- finalize_sensitive_removal (both service-role-invoked from server
-- actions/the quarantine service) and resolve_bidding_pause (authenticated-
-- invoked, but its internal call to this function runs as the owning role
-- regardless, per section 3's note).

-- ============================================================
-- 5. resolve_sensitive_removal_client_decision(): the new self-service RPC
-- ============================================================
-- Handles the routine NOT_NEEDED / REPLACEMENT_UPLOADED paths without ever
-- touching the admin queue, and the UNSURE escalation path (which flips the
-- review to admin-actionable but never clears the pause itself). Never
-- trusts p_replacement_attachment_id -- independently re-derives project
-- membership, ACTIVE status, and publish-after-request timing before
-- storing it or resolving anything.

CREATE OR REPLACE FUNCTION public.resolve_sensitive_removal_client_decision(
  p_project_id uuid,
  p_review_id uuid,
  p_actor_id uuid,
  p_decision text,
  p_replacement_attachment_id uuid DEFAULT NULL
)
RETURNS TABLE (
  ok boolean,
  already_handled boolean,
  new_status text,
  pause_cleared boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_actor_role text;
  v_client_id uuid;
  v_review_attachment_id uuid;
  v_requested_at timestamptz;
  v_new_status text;
  v_replacement_project_id uuid;
  v_replacement_status text;
  v_replacement_published_at timestamptz;
  v_cleared boolean := false;
BEGIN
  SELECT role::text INTO v_actor_role FROM public.profiles WHERE id = p_actor_id;
  IF v_actor_role IS NULL THEN
    RAISE EXCEPTION 'Actor not found';
  END IF;
  IF v_actor_role NOT IN ('CLIENT', 'ADMIN') THEN
    RAISE EXCEPTION 'Forbidden: role % is not permitted to resolve this decision', v_actor_role;
  END IF;

  SELECT client_id INTO v_client_id FROM public.projects WHERE id = p_project_id;
  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'Project not found';
  END IF;
  IF v_actor_role = 'CLIENT' AND v_client_id IS DISTINCT FROM p_actor_id THEN
    RAISE EXCEPTION 'Forbidden: actor does not own this project';
  END IF;

  IF p_decision NOT IN ('NOT_NEEDED', 'REPLACEMENT_UPLOADED', 'UNSURE') THEN
    RAISE EXCEPTION 'Invalid decision: %', p_decision;
  END IF;

  SELECT attachment_id, requested_at INTO v_review_attachment_id, v_requested_at
  FROM public.attachment_sensitive_removal_reviews
  WHERE id = p_review_id AND project_id = p_project_id AND status = 'PENDING_CLIENT_DECISION'
  FOR UPDATE;

  IF v_review_attachment_id IS NULL THEN
    RETURN QUERY SELECT false, true, NULL::text, false;
    RETURN;
  END IF;

  IF p_decision = 'REPLACEMENT_UPLOADED' THEN
    IF p_replacement_attachment_id IS NULL THEN
      RAISE EXCEPTION 'A replacement attachment is required for this decision';
    END IF;

    SELECT project_id, attachment_status, published_at
      INTO v_replacement_project_id, v_replacement_status, v_replacement_published_at
    FROM public.project_attachments
    WHERE id = p_replacement_attachment_id;

    IF v_replacement_project_id IS NULL THEN
      RAISE EXCEPTION 'Replacement attachment not found';
    END IF;
    IF v_replacement_project_id IS DISTINCT FROM p_project_id THEN
      RAISE EXCEPTION 'Replacement attachment does not belong to this project';
    END IF;
    IF p_replacement_attachment_id = v_review_attachment_id THEN
      RAISE EXCEPTION 'Replacement cannot be the removed attachment itself';
    END IF;
    IF v_replacement_status <> 'ACTIVE' THEN
      RAISE EXCEPTION 'Replacement attachment is not currently published (status %)', v_replacement_status;
    END IF;
    IF v_replacement_published_at <= v_requested_at THEN
      RAISE EXCEPTION 'Replacement attachment was not published after the removal request';
    END IF;

    v_new_status := 'RESOLVED_REPLACEMENT_UPLOADED';
  ELSIF p_decision = 'NOT_NEEDED' THEN
    v_new_status := 'RESOLVED_NOT_NEEDED';
  ELSE
    v_new_status := 'PENDING_REVIEW';
  END IF;

  UPDATE public.attachment_sensitive_removal_reviews
  SET client_decision = p_decision,
      replacement_attachment_id = CASE WHEN p_decision = 'REPLACEMENT_UPLOADED' THEN p_replacement_attachment_id ELSE NULL END,
      status = v_new_status
  WHERE id = p_review_id;

  IF p_decision <> 'UNSURE' THEN
    v_cleared := public.maybe_clear_sensitive_removal_pause(p_project_id);
  END IF;

  RETURN QUERY SELECT true, false, v_new_status, v_cleared;
END;
$function$;

REVOKE ALL ON FUNCTION public.resolve_sensitive_removal_client_decision(uuid, uuid, uuid, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_sensitive_removal_client_decision(uuid, uuid, uuid, text, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.resolve_sensitive_removal_client_decision(uuid, uuid, uuid, text, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_sensitive_removal_client_decision(uuid, uuid, uuid, text, uuid) TO service_role;

-- ============================================================
-- 6. resolve_bidding_pause(): now uses the centralized clear operation
-- ============================================================
-- Authorization/resolution-recording logic is unchanged. The only edit is
-- replacing the previous unconditional pause-clear with a call to
-- maybe_clear_sensitive_removal_pause, and returning whether the pause was
-- actually cleared so the admin UI can say "resolved, but bidding remains
-- paused -- N other item(s) outstanding" instead of implying resumption
-- that didn't happen.

CREATE OR REPLACE FUNCTION public.resolve_bidding_pause(
  p_project_id uuid,
  p_review_id uuid,
  p_resolution_action text,
  p_admin_note text DEFAULT NULL
)
RETURNS TABLE (pause_cleared boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role text;
  v_cleared boolean;
BEGIN
  SELECT role::text INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role IS DISTINCT FROM 'ADMIN' THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF p_resolution_action NOT IN ('REACKNOWLEDGE_ALLOWED', 'BIDDING_REOPENED', 'PROJECT_RESTARTED', 'NO_ACTION_NEEDED') THEN
    RAISE EXCEPTION 'Invalid resolution_action: %', p_resolution_action;
  END IF;

  UPDATE public.attachment_sensitive_removal_reviews
  SET status = 'BIDDING_RESUMED',
      resolution_action = p_resolution_action,
      admin_note = p_admin_note,
      resolved_by = auth.uid(),
      resolved_at = now(),
      bidding_resumed_at = now()
  WHERE id = p_review_id
    AND project_id = p_project_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Review not found for this project';
  END IF;

  v_cleared := public.maybe_clear_sensitive_removal_pause(p_project_id);

  RETURN QUERY SELECT v_cleared;
END;
$function$;

REVOKE ALL ON FUNCTION public.resolve_bidding_pause(uuid, uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_bidding_pause(uuid, uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.resolve_bidding_pause(uuid, uuid, text, text) TO authenticated;

-- ============================================================
-- 7. finalize_sensitive_removal(): now also resolves the deferred clear
-- ============================================================
-- Unchanged quarantine-completion matching/idempotency. New final step:
-- after flipping the attachment to SENSITIVE_REMOVED, resolve whichever
-- project it belongs to through the same centralized clear operation --
-- this is what actually clears the pause when the client's decision was
-- recorded BEFORE quarantine finished (the ordering the entire fix in this
-- migration exists to handle).

CREATE OR REPLACE FUNCTION public.finalize_sensitive_removal(
  p_attachment_id uuid,
  p_quarantine_storage_key text
)
RETURNS TABLE (ok boolean, already_finalized boolean, pause_cleared boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_project_id uuid;
  v_cleared boolean := false;
BEGIN
  UPDATE public.project_attachments
  SET attachment_status = 'SENSITIVE_REMOVED',
      quarantine_storage_key = p_quarantine_storage_key,
      original_object_deleted_at = now()
  WHERE id = p_attachment_id
    AND attachment_status = 'SENSITIVE_REMOVAL_PENDING'
  RETURNING project_id INTO v_project_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, true, false;
    RETURN;
  END IF;

  v_cleared := public.maybe_clear_sensitive_removal_pause(v_project_id);

  RETURN QUERY SELECT true, false, v_cleared;
END;
$function$;

REVOKE ALL ON FUNCTION public.finalize_sensitive_removal(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.finalize_sensitive_removal(uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.finalize_sensitive_removal(uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_sensitive_removal(uuid, text) TO service_role;
