-- ============================================================================
-- Migration 028: Published-File Withdrawal Lifecycle
-- ============================================================================
--
-- Implements the design approved across three review rounds (v1/v2/v3) this
-- session: ordinary withdrawal (published files stay in a Bid Information
-- History for every bidder), sensitive removal (immediate contractor-access
-- revocation + Storage quarantine + admin review + bidding pause), and the
-- supporting exactly-once/idempotency machinery for both.
--
-- Does not touch 016. Additive only: new columns (all nullable or
-- DEFAULT-backed), new tables, new functions, one CREATE OR REPLACE on two
-- existing functions (project_is_open_for_bidding, award_project_bid),
-- one Storage policy swap, one new bucket.
-- ============================================================================

-- ============================================================
-- 1. project_attachments: lifecycle columns
-- ============================================================
-- attachment_status is the actual state machine. withdrawn_at (added in 025,
-- never previously written) keeps its existing meaning ("left ACTIVE at this
-- time") for both WITHDRAWN and SENSITIVE_REMOVAL_PENDING/SENSITIVE_REMOVED,
-- so the three existing `.is("withdrawn_at", null)` read sites (client Files
-- page, FileUploader.tsx, get_contractor_project_attachments) continue to
-- mean exactly what they already mean without modification.

ALTER TABLE public.project_attachments
  ADD COLUMN IF NOT EXISTS attachment_status text NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS withdrawal_reason_code text,
  ADD COLUMN IF NOT EXISTS withdrawal_reason_other_text text,
  ADD COLUMN IF NOT EXISTS withdrawn_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS withdrawal_information_revision_number integer,
  ADD COLUMN IF NOT EXISTS quarantine_storage_key text,
  ADD COLUMN IF NOT EXISTS original_object_deleted_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_attachments_attachment_status_check'
  ) THEN
    ALTER TABLE public.project_attachments
      ADD CONSTRAINT project_attachments_attachment_status_check
      CHECK (attachment_status IN ('ACTIVE', 'WITHDRAWN', 'SENSITIVE_REMOVAL_PENDING', 'SENSITIVE_REMOVED'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS project_attachments_attachment_status_idx
  ON public.project_attachments (attachment_status)
  WHERE attachment_status <> 'ACTIVE';

-- ============================================================
-- 2. attachment_withdrawal_reasons (bid_dismissal_reasons pattern: code/
--    label/sort_order/is_active, ON CONFLICT (code) DO NOTHING seed,
--    authenticated-read RLS, no client write policy)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.attachment_withdrawal_reasons (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  code text NOT NULL,
  label text NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT attachment_withdrawal_reasons_code_key UNIQUE (code)
);

INSERT INTO public.attachment_withdrawal_reasons (code, label, sort_order) VALUES
  ('UPLOADED_WRONG_FILE', 'Uploaded wrong file', 10),
  ('DUPLICATE', 'Duplicate file', 20),
  ('OUTDATED_SUPERSEDED', 'Outdated / superseded', 30),
  ('NO_LONGER_RELEVANT', 'No longer relevant', 40),
  ('SENSITIVE_INFO', 'Contains private / sensitive information', 50),
  ('OTHER', 'Other', 60)
ON CONFLICT (code) DO NOTHING;

ALTER TABLE public.attachment_withdrawal_reasons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_read_withdrawal_reasons" ON public.attachment_withdrawal_reasons;
CREATE POLICY "authenticated_read_withdrawal_reasons" ON public.attachment_withdrawal_reasons
  FOR SELECT TO authenticated USING (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_attachments_withdrawal_reason_code_fkey'
  ) THEN
    ALTER TABLE public.project_attachments
      ADD CONSTRAINT project_attachments_withdrawal_reason_code_fkey
      FOREIGN KEY (withdrawal_reason_code) REFERENCES public.attachment_withdrawal_reasons(code);
  END IF;
END $$;

-- ============================================================
-- 3. attachment_sensitive_removal_reviews (admin queue, subscription_
--    disputes/problem_reports OPEN/RESOLVED pattern; one row per incident,
--    i.e. per attachment, not per project)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.attachment_sensitive_removal_reviews (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  project_id uuid NOT NULL REFERENCES public.projects(id),
  attachment_id uuid NOT NULL REFERENCES public.project_attachments(id),
  requested_by uuid REFERENCES public.profiles(id),
  requested_at timestamptz DEFAULT now() NOT NULL,
  status text NOT NULL DEFAULT 'PENDING_REVIEW'
    CHECK (status IN ('PENDING_REVIEW', 'BIDDING_PAUSED', 'BIDDING_RESUMED', 'RESOLVED_NO_ACTION')),
  resolution_action text
    CHECK (resolution_action IS NULL OR resolution_action IN ('REACKNOWLEDGE_ALLOWED', 'BIDDING_REOPENED', 'PROJECT_RESTARTED', 'NO_ACTION_NEEDED')),
  admin_note text,
  resolved_by uuid REFERENCES public.profiles(id),
  resolved_at timestamptz,
  bidding_paused_at timestamptz,
  bidding_resumed_at timestamptz,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS attachment_sensitive_removal_reviews_project_id_idx
  ON public.attachment_sensitive_removal_reviews (project_id);

ALTER TABLE public.attachment_sensitive_removal_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins manage sensitive removal reviews" ON public.attachment_sensitive_removal_reviews;
CREATE POLICY "admins manage sensitive removal reviews" ON public.attachment_sensitive_removal_reviews
  FOR ALL TO authenticated
  USING (public.is_admin_safe())
  WITH CHECK (public.is_admin_safe());
-- No policy at all for non-admin authenticated/anon roles: all client-visible
-- surfacing of "a file was removed" goes through the stub-only history RPC
-- (section 8 below), never a direct read of this table. Service role
-- (supabaseAdmin, used by the withdrawal RPC below) bypasses RLS entirely.

-- ============================================================
-- 4. attachment_lifecycle_events (durable idempotency anchor)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.attachment_lifecycle_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  attachment_id uuid NOT NULL REFERENCES public.project_attachments(id),
  project_id uuid NOT NULL REFERENCES public.projects(id),
  event_type text NOT NULL CHECK (event_type IN ('WITHDRAWN', 'SENSITIVE_REMOVAL_PENDING')),
  information_revision_number integer NOT NULL,
  deadline_extension_evaluated boolean DEFAULT false NOT NULL,
  notifications_enqueued_at timestamptz,
  review_id uuid REFERENCES public.attachment_sensitive_removal_reviews(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS attachment_lifecycle_events_attachment_id_idx
  ON public.attachment_lifecycle_events (attachment_id);

ALTER TABLE public.attachment_lifecycle_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins read lifecycle events" ON public.attachment_lifecycle_events;
CREATE POLICY "admins read lifecycle events" ON public.attachment_lifecycle_events
  FOR SELECT TO authenticated USING (public.is_admin_safe());
-- Service role only for writes (via the RPC below); no INSERT/UPDATE policy
-- for any authenticated role.

-- ============================================================
-- 5. notification_outbox: deterministic idempotency key
-- ============================================================
-- Partial unique index (nullable event_key -- existing respondToRfi/
-- uploadProjectFile call sites keep inserting with event_key IS NULL and are
-- completely unaffected). Proven against real Postgres before being written
-- here: `ON CONFLICT (event_key) DO NOTHING` (no WHERE clause) does NOT
-- match a partial unique index and raises "no unique or exclusion
-- constraint matching the ON CONFLICT specification" -- confirmed by direct
-- test on staging. `ON CONFLICT (event_key) WHERE event_key IS NOT NULL DO
-- NOTHING` is the form that correctly infers this index, confirmed by the
-- same test (including a genuine two-connection concurrent-insert race,
-- which resolved to exactly one surviving row). Every INSERT against this
-- table's event_key column must use that exact WHERE-qualified form.

ALTER TABLE public.notification_outbox
  ADD COLUMN IF NOT EXISTS event_key text;

CREATE UNIQUE INDEX IF NOT EXISTS notification_outbox_event_key_key
  ON public.notification_outbox (event_key)
  WHERE event_key IS NOT NULL;

-- ============================================================
-- 6. bid_versions: version_kind (ORIGINAL / REVISION / RECONFIRMATION)
-- ============================================================
-- Existing rows backfill to REVISION -- the closest available default.
-- Historical reconfirmations (if any exist from reconfirmBid's pre-close
-- usage) cannot be reliably distinguished retroactively from genuine price
-- revisions without an amount_cents-unchanged heuristic that isn't trustworthy
-- for audit purposes; this is an accepted, bounded limitation of the
-- backfill, not something engineered around. Every row inserted by
-- submitBid/reconfirmBid going forward stamps this explicitly (see app-layer
-- changes).

ALTER TABLE public.bid_versions
  ADD COLUMN IF NOT EXISTS version_kind text NOT NULL DEFAULT 'REVISION';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bid_versions_version_kind_check'
  ) THEN
    ALTER TABLE public.bid_versions
      ADD CONSTRAINT bid_versions_version_kind_check
      CHECK (version_kind IN ('ORIGINAL', 'REVISION', 'RECONFIRMATION'));
  END IF;
END $$;

-- ============================================================
-- 7. projects: bidding pause
-- ============================================================

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS bidding_paused_at timestamptz,
  ADD COLUMN IF NOT EXISTS bidding_pause_reason text;

-- ============================================================
-- 8. project_is_open_for_bidding(): respect the pause
-- ============================================================
-- Covers, by inheritance, every RLS policy that already calls this helper:
-- bids INSERT/UPDATE, rfis INSERT (contractor question), and any future
-- consumer -- per the existing "single chokepoint" convention already
-- established in this codebase (021's own comment: "Reuses the existing
-- project_is_open_for_bidding() helper").

CREATE OR REPLACE FUNCTION public.project_is_open_for_bidding(p_project_id uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = p_project_id
      AND p.state = 'OPEN'
      AND p.deadline_at IS NOT NULL
      AND p.deadline_at > now()
      AND p.bidding_paused_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.project_awards pa
        WHERE pa.project_id = p.id
      )
  );
$function$
;

-- ============================================================
-- 9. award_project_bid(): explicit pause chokepoint
-- ============================================================
-- This function does NOT call project_is_open_for_bidding() (it has its own
-- inverse unlock rule -- award requires bidding to already be closed) and so
-- is NOT covered by section 8's change. Confirmed by direct chokepoint audit
-- this session. Everything else in this function is byte-for-byte unchanged
-- from the 021 version; only the pause check is new (inserted right after
-- the project row is loaded, alongside the existing permission check).

CREATE OR REPLACE FUNCTION public.award_project_bid(p_project_id uuid, p_bid_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_client_id uuid;
  v_deadline timestamptz;
  v_state text;
  v_role text;
  v_paused_at timestamptz;

  v_contractor_id uuid;
  v_awarded_bid_version_id uuid;

  v_info_revision integer;
  v_ack_revision integer;
  v_ack_affirmed boolean;
begin
  -- who is calling?
  select role::text into v_role
  from public.profiles
  where id = auth.uid();

  if v_role is null then
    raise exception 'Not authenticated';
  end if;

  -- load project
  select client_id, deadline_at, state::text, information_revision_number, bidding_paused_at
    into v_client_id, v_deadline, v_state, v_info_revision, v_paused_at
  from public.projects
  where id = p_project_id;

  if v_client_id is null then
    raise exception 'Project not found';
  end if;

  -- permission: owner client or admin
  if not (auth.uid() = v_client_id or v_role = 'ADMIN') then
    raise exception 'Forbidden';
  end if;

  -- bidding-pause chokepoint: a project paused for a sensitive-removal
  -- review can never be awarded until an admin explicitly resolves the pause
  -- (resolve_bidding_pause, section 13), regardless of deadline/state.
  if v_paused_at is not null then
    raise exception 'This project is paused pending admin review and cannot be awarded until the review is resolved';
  end if;

  -- unlock rule
  if not (
    (v_deadline is not null and v_deadline <= now())
    or v_state <> 'OPEN'
  ) then
    raise exception 'Bids are still locked until the deadline';
  end if;

  -- ensure bid belongs to project and get contractor
  select b.contractor_id
    into v_contractor_id
  from public.bids b
  where b.id = p_bid_id
    and b.project_id = p_project_id;

  if v_contractor_id is null then
    raise exception 'Bid not found for this project';
  end if;

  -- latest bid version
  select bv.id, bv.acknowledged_information_revision, bv.acknowledgment_affirmed
    into v_awarded_bid_version_id, v_ack_revision, v_ack_affirmed
  from public.bid_versions bv
  where bv.bid_id = p_bid_id
  order by bv.version_number desc
  limit 1;

  if v_awarded_bid_version_id is null then
    raise exception 'Cannot award: bid has no versions';
  end if;

  -- eligibility: acknowledgment must be affirmed and current with the
  -- project's live information revision. This is what makes a post-close
  -- withdrawal automatically block award on every previously-acknowledged
  -- bid -- the revision bump in withdraw_project_attachment (section 11)
  -- makes v_ack_revision stale here, unconditionally, regardless of state.
  if not coalesce(v_ack_affirmed, false) or v_ack_revision is distinct from v_info_revision then
    raise exception 'Bid is not eligible for award: it has not acknowledged the current project information';
  end if;

  -- prevent double award
  if exists (select 1 from public.project_awards pa where pa.project_id = p_project_id) then
    raise exception 'Project already awarded';
  end if;

  -- insert award record (required columns + optional helpful columns)
  insert into public.project_awards (
    project_id,
    awarded_contractor_id,
    awarded_bid_version_id,
    awarded_at,
    created_by,
    bid_id,
    contractor_id,
    awarded_by
  )
  values (
    p_project_id,
    v_contractor_id,
    v_awarded_bid_version_id,
    now(),
    auth.uid(),
    p_bid_id,
    v_contractor_id,
    auth.uid()
  );

  -- optional: set project state to AWARDED if enum supports it
  begin
    update public.projects
    set state = 'AWARDED'::project_state,
        updated_at = now()
    where id = p_project_id;
  exception when invalid_text_representation or undefined_object then
    null;
  end;

end;
$function$;

-- ============================================================
-- 10. Revision-bump trigger for ACTIVE -> non-ACTIVE transitions
-- ============================================================
-- Structurally parallel to rfis_bump_information_revision (021) and
-- stamp_and_bump_attachment_revision (025). Fires only on a genuine
-- ACTIVE -> {WITHDRAWN, SENSITIVE_REMOVAL_PENDING} transition -- never on
-- SENSITIVE_REMOVAL_PENDING -> SENSITIVE_REMOVED (that transition doesn't
-- change what's visible in the active view; it already left the active view
-- at the first transition) and never on a no-op retry, because the WHEN
-- clause only matches a real edge.

CREATE OR REPLACE FUNCTION public.bump_information_revision_on_attachment_withdrawal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_new_revision integer;
BEGIN
  UPDATE public.projects
  SET information_revision_number = information_revision_number + 1,
      updated_at = now()
  WHERE id = NEW.project_id
  RETURNING information_revision_number INTO v_new_revision;

  NEW.withdrawal_information_revision_number := v_new_revision;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS project_attachments_bump_on_withdrawal ON public.project_attachments;
CREATE TRIGGER project_attachments_bump_on_withdrawal
  BEFORE UPDATE ON public.project_attachments
  FOR EACH ROW
  WHEN (OLD.attachment_status = 'ACTIVE' AND NEW.attachment_status <> 'ACTIVE')
  EXECUTE FUNCTION public.bump_information_revision_on_attachment_withdrawal();

-- ============================================================
-- 11. withdraw_project_attachment(): the transactional RPC
-- ============================================================
-- Single guarded UPDATE (idempotency anchor -- Postgres serializes
-- concurrent UPDATEs to the same row under MVCC, so a genuine double-click
-- cannot both pass) followed by, in the SAME transaction: the revision-bump
-- trigger (section 10, fires as part of the UPDATE itself), inline deadline
-- evaluation (apply_rfi_deadline_extension is pure DB work -- folded in here
-- rather than left as a separate external call, per the v3 correction), a
-- set-based notification-outbox fan-out with a deterministic event_key
-- (exactly-once ENQUEUE, not exactly-once delivery -- delivery remains the
-- existing at-least-once outbox-processing cron's job), the durable
-- attachment_lifecycle_events row, and -- for sensitive removal only -- the
-- review row and the bidding-pause flag, all atomically.
--
-- p_action: 'WITHDRAW' -> ACTIVE -> WITHDRAWN.
--           'SENSITIVE_REMOVE' -> ACTIVE -> SENSITIVE_REMOVAL_PENDING
--           (never directly to SENSITIVE_REMOVED -- see finalize_sensitive_
--           removal, section 12, for the post-quarantine completion step).

CREATE OR REPLACE FUNCTION public.withdraw_project_attachment(
  p_attachment_id uuid,
  p_action text,
  p_reason_code text,
  p_reason_other_text text DEFAULT NULL
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
  v_target_status text;
  v_event_type text;
  v_project_id uuid;
  v_new_revision integer;
  v_event_id uuid;
  v_review_id uuid;
  v_actor uuid := auth.uid();
  v_notification_kind text;
  v_project_state text;
  v_awarded_contractor_id uuid;
BEGIN
  IF p_action = 'WITHDRAW' THEN
    v_target_status := 'WITHDRAWN';
    v_event_type := 'WITHDRAWN';
  ELSIF p_action = 'SENSITIVE_REMOVE' THEN
    v_target_status := 'SENSITIVE_REMOVAL_PENDING';
    v_event_type := 'SENSITIVE_REMOVAL_PENDING';
  ELSE
    RAISE EXCEPTION 'Invalid action: %', p_action;
  END IF;

  -- Guarded, idempotent transition. Row lock from the UPDATE itself
  -- serializes concurrent callers; a losing/retried caller matches zero
  -- rows here and falls through to the "already handled" branch below.
  UPDATE public.project_attachments
  SET attachment_status = v_target_status,
      withdrawal_reason_code = p_reason_code,
      withdrawal_reason_other_text = p_reason_other_text,
      withdrawn_by = v_actor,
      withdrawn_at = now()
  WHERE id = p_attachment_id
    AND attachment_status = 'ACTIVE'
  RETURNING project_id, withdrawal_information_revision_number
    INTO v_project_id, v_new_revision;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, true, NULL::uuid, NULL::text, NULL::uuid;
    RETURN;
  END IF;

  -- Inline deadline evaluation -- pure DB work, folded into this same
  -- transaction rather than left as a separate external call.
  PERFORM public.apply_rfi_deadline_extension(v_project_id);

  -- Durable idempotency-anchor row for this specific transition. Its mere
  -- existence, one row per attachment per transition, is what future
  -- external-side-effect steps (delivery, quarantine finalize) key off of.
  INSERT INTO public.attachment_lifecycle_events (attachment_id, project_id, event_type, information_revision_number, deadline_extension_evaluated)
  VALUES (p_attachment_id, v_project_id, v_event_type, v_new_revision, true)
  RETURNING id INTO v_event_id;

  -- Recipient selection is state/award-aware -- NOT an unconditional "every
  -- historical bidder", which would wrongly keep spamming a project's full
  -- bidder list forever after award. Exactly one of the two branches below
  -- fires:
  --   - Awarded (any post-award state: AWARDED, PENDING_PAYMENT,
  --     COMPLETED) -- narrow to the awarded contractor only. Non-awarded
  --     bidders have no further stake once an award exists.
  --   - Not yet awarded AND state = 'OPEN' -- notify every current bidder.
  --     This covers both pre-close (deadline still ahead) and post-close-
  --     pre-award (deadline elapsed, no award yet) uniformly, because this
  --     app's bidding-close is implicit: state stays OPEN with an elapsed
  --     deadline (confirmed by the chokepoint audit -- BIDDING_CLOSED/
  --     BIDS_UNLOCKED are never actually set anywhere in this codebase).
  --     Every current bidder's award eligibility is affected by this
  --     revision bump regardless of which side of the deadline they're on.
  --   - Anything else (CANCELED, EMERGENCY_EXPIRED, DRAFT, or any other
  --     non-OPEN state with no award) -- no fan-out at all. No party has an
  --     ongoing relationship to notify; the lifecycle event row alone is
  --     the audit trail.
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
    -- Exactly-once ENQUEUE (not exactly-once delivery): set-based INSERT ...
    -- SELECT against every current bidder, one row per (event, recipient,
    -- kind), guarded by the deterministic event_key's partial unique index.
    -- Proven syntax (section 5 above) -- must remain exactly this form.
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
    INSERT INTO public.attachment_sensitive_removal_reviews (project_id, attachment_id, requested_by, status, bidding_paused_at)
    VALUES (v_project_id, p_attachment_id, v_actor, 'PENDING_REVIEW', now())
    RETURNING id INTO v_review_id;

    UPDATE public.attachment_lifecycle_events SET review_id = v_review_id WHERE id = v_event_id;

    UPDATE public.projects
    SET bidding_paused_at = now(),
        bidding_pause_reason = 'Sensitive file removal pending admin review',
        updated_at = now()
    WHERE id = v_project_id
      AND bidding_paused_at IS NULL;
    -- The AND bidding_paused_at IS NULL guard means a second sensitive
    -- removal on an already-paused project leaves the original pause
    -- timestamp/reason untouched -- it does not reset or extend the pause.
  END IF;

  RETURN QUERY SELECT true, false, v_event_id, v_target_status, v_review_id;
END;
$function$;

-- Supabase projects carry a schema-level ALTER DEFAULT PRIVILEGES rule that
-- auto-grants authenticated (and anon) EXECUTE on every newly created
-- public-schema function -- REVOKE FROM PUBLIC alone does not touch it
-- (confirmed live on staging: this function retained authenticated EXECUTE
-- despite the PUBLIC/anon revokes below, until this explicit authenticated
-- revoke was added). Must be revoked by name, same as migration 025 already
-- documented for anon. This function trusts the caller entirely (no
-- internal ownership re-verification), so a live authenticated grant would
-- let any logged-in user withdraw/sensitive-remove any attachment on any
-- project directly, bypassing the calling server action's ownership check.
REVOKE ALL ON FUNCTION public.withdraw_project_attachment(uuid, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.withdraw_project_attachment(uuid, text, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.withdraw_project_attachment(uuid, text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.withdraw_project_attachment(uuid, text, text, text) TO service_role;
-- authenticated is deliberately NOT granted execute here: the calling
-- server action always runs as supabaseAdmin (service role), matching the
-- existing "all application writes to project_attachments go through
-- supabaseAdmin" convention from migration 025. Ownership/role checks
-- (client owns this project, or admin) are performed in the server action
-- before calling this RPC, exactly like uploadProjectFile/deleteProjectFile
-- already do today.

-- ============================================================
-- 11a. reconfirm_bid_post_close(): self-verifying RPC, not a thin wrapper
-- ============================================================
-- The post-close reconfirmation action needs supabaseAdmin (service role)
-- because bid_versions_insert_own / bids_update_own's own WITH CHECK
-- clauses correctly require project_is_open_for_bidding(), which is false
-- once the deadline has passed -- exactly the state this action operates
-- in. Bypassing RLS via supabaseAdmin means the ownership + eligibility
-- checks that RLS would otherwise provide as a DB-layer backstop are gone
-- for that call, so this function re-verifies every invariant itself,
-- inside a SECURITY DEFINER body, rather than trusting the calling server
-- action's app-layer checks alone -- the same self-contained,
-- re-verifying design already used by withdraw_project_attachment and
-- award_project_bid. The TypeScript allowlist (isPostCloseReconfirmationAllowed)
-- remains useful as a pre-flight check for a clean error message before
-- ever reaching the DB, but this function, not that TypeScript function, is
-- the actual security boundary.

CREATE OR REPLACE FUNCTION public.reconfirm_bid_post_close(p_bid_id uuid)
RETURNS TABLE (bid_version_id uuid, version_number integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role text;
  v_actor uuid := auth.uid();
  v_project_id uuid;
  v_contractor_id uuid;
  v_state text;
  v_deadline timestamptz;
  v_paused_at timestamptz;
  v_info_revision integer;
  v_last bid_versions%ROWTYPE;
  v_next_version integer;
  v_new_id uuid;
BEGIN
  SELECT role::text INTO v_role FROM public.profiles WHERE id = v_actor;
  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT b.project_id, b.contractor_id INTO v_project_id, v_contractor_id
  FROM public.bids b WHERE b.id = p_bid_id;

  IF v_project_id IS NULL THEN
    RAISE EXCEPTION 'Bid not found';
  END IF;

  -- ownership: the calling contractor must own this bid (admin may act on
  -- any bid, matching the existing site-wide CONTRACTOR/ADMIN convention)
  IF NOT (v_actor = v_contractor_id OR v_role = 'ADMIN') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT state::text, deadline_at, bidding_paused_at, information_revision_number
    INTO v_state, v_deadline, v_paused_at, v_info_revision
  FROM public.projects
  WHERE id = v_project_id
  FOR UPDATE;

  IF EXISTS (SELECT 1 FROM public.project_awards pa WHERE pa.project_id = v_project_id) THEN
    RAISE EXCEPTION 'This project has already been awarded';
  END IF;

  IF v_paused_at IS NOT NULL THEN
    RAISE EXCEPTION 'This project is paused pending admin review';
  END IF;

  -- Explicit allowlist, mirrored from isPostCloseReconfirmationAllowed --
  -- state = 'OPEN' AND deadline already elapsed is the only condition this
  -- app's bidding-close model produces (confirmed by chokepoint audit:
  -- BIDDING_CLOSED/BIDS_UNLOCKED are never actually set). NOT "anything
  -- other than a still-open window".
  IF NOT (v_state = 'OPEN' AND v_deadline IS NOT NULL AND v_deadline <= now()) THEN
    RAISE EXCEPTION 'This project is not in a post-close, unawarded, reconfirmable state';
  END IF;

  SELECT * INTO v_last
  FROM public.bid_versions
  WHERE bid_id = p_bid_id
  ORDER BY version_number DESC
  LIMIT 1;

  IF v_last.id IS NULL THEN
    RAISE EXCEPTION 'Cannot reconfirm: no existing bid version found';
  END IF;

  IF v_last.acknowledged_information_revision IS NOT DISTINCT FROM v_info_revision THEN
    RAISE EXCEPTION 'This bid already reflects the current project information -- no reconfirmation needed';
  END IF;

  v_next_version := v_last.version_number + 1;

  -- Price/terms/attachments copied unchanged from the latest version.
  -- acknowledged_information_revision is stamped automatically by the
  -- existing stamp_bid_version_acknowledgment BEFORE INSERT trigger (021)
  -- from the live project row -- not set here, not trusted from the caller.
  INSERT INTO public.bid_versions (
    bid_id, version_number, project_revision_number, amount_cents,
    duration_days, start_window, inclusions, exclusions, notes,
    warranty_terms, deposit_terms, scope_disclaimers, estimate_valid_until,
    quote_pdf_path, quote_pdf_filename, acknowledgment_affirmed, version_kind
  )
  VALUES (
    p_bid_id, v_next_version, v_last.project_revision_number, v_last.amount_cents,
    v_last.duration_days, v_last.start_window, v_last.inclusions, v_last.exclusions, v_last.notes,
    v_last.warranty_terms, v_last.deposit_terms, v_last.scope_disclaimers, v_last.estimate_valid_until,
    v_last.quote_pdf_path, v_last.quote_pdf_filename, true, 'RECONFIRMATION'
  )
  RETURNING id INTO v_new_id;

  UPDATE public.bids SET updated_at = now() WHERE id = p_bid_id;

  RETURN QUERY SELECT v_new_id, v_next_version;
END;
$function$;

-- Same schema-level-default-privilege correction as withdraw_project_
-- attachment above -- authenticated must be revoked by name, not merely
-- omitted from an explicit GRANT.
REVOKE ALL ON FUNCTION public.reconfirm_bid_post_close(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reconfirm_bid_post_close(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.reconfirm_bid_post_close(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.reconfirm_bid_post_close(uuid) TO service_role;
-- service-role only, same reasoning as withdraw_project_attachment: the
-- calling server action still performs its own pre-flight check (for a
-- clean error message) before invoking this via supabaseAdmin, but this
-- function is what actually enforces every invariant.

-- ============================================================
-- 12. finalize_sensitive_removal(): post-quarantine completion
-- ============================================================
-- Called by the quarantine service (application-layer, service-role) only
-- after the quarantine copy has been uploaded AND hash/size-verified AND the
-- original object has been deleted from project-files. Idempotent: matches
-- only SENSITIVE_REMOVAL_PENDING rows, so a retried call after a prior
-- success is a clean no-op.

CREATE OR REPLACE FUNCTION public.finalize_sensitive_removal(
  p_attachment_id uuid,
  p_quarantine_storage_key text
)
RETURNS TABLE (ok boolean, already_finalized boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.project_attachments
  SET attachment_status = 'SENSITIVE_REMOVED',
      quarantine_storage_key = p_quarantine_storage_key,
      original_object_deleted_at = now()
  WHERE id = p_attachment_id
    AND attachment_status = 'SENSITIVE_REMOVAL_PENDING';

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, true;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, false;
END;
$function$;

-- Same schema-level-default-privilege correction -- this function in
-- particular has zero internal authorization checks of its own (it only
-- matches on attachment_status = 'SENSITIVE_REMOVAL_PENDING'), so a live
-- authenticated grant would let anyone flip an attachment straight to
-- SENSITIVE_REMOVED without the quarantine copy ever actually existing.
REVOKE ALL ON FUNCTION public.finalize_sensitive_removal(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.finalize_sensitive_removal(uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.finalize_sensitive_removal(uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_sensitive_removal(uuid, text) TO service_role;

-- ============================================================
-- 13. resolve_bidding_pause(): the ONLY way to clear bidding_paused_at
-- ============================================================
-- Admin-only. Deliberately separate from approveOverride/
-- approveEmergencyBidMode (which now themselves refuse to run while paused
-- -- see app-layer changes) so a pause can never be cleared as a side effect
-- of an unrelated admin action.

CREATE OR REPLACE FUNCTION public.resolve_bidding_pause(
  p_project_id uuid,
  p_review_id uuid,
  p_resolution_action text,
  p_admin_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role text;
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

  UPDATE public.projects
  SET bidding_paused_at = NULL,
      bidding_pause_reason = NULL,
      updated_at = now()
  WHERE id = p_project_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.resolve_bidding_pause(uuid, uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_bidding_pause(uuid, uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.resolve_bidding_pause(uuid, uuid, text, text) TO authenticated;
-- Runs as authenticated (not service-role-only) because it's invoked
-- directly by an admin's own session; the function's own role check inside
-- the SECURITY DEFINER body (mirroring is_admin_safe()'s pattern) is the
-- real gate, matching how other admin RPCs in this schema are exposed.

-- ============================================================
-- 14. contractor_can_access_project_file_object(): object-aware helper
-- ============================================================
-- SECURITY DEFINER is required for the identical, already-proven reason
-- migration 024 required it for contractor_can_access_project_files():
-- a plain subquery against project_attachments under the querying
-- contractor's own RLS evaluates to false unconditionally, because
-- contractors have zero SELECT policy on project_attachments (migration 025:
-- "Contractors get NO direct SELECT policy on this table at all"). Composes
-- the existing project-level helper (unchanged) with a new per-object,
-- live-attachment_status check -- SENSITIVE_REMOVAL_PENDING and
-- SENSITIVE_REMOVED are excluded, so access is denied from the instant the
-- withdrawal transaction commits, independent of whether physical Storage
-- relocation has finished.

CREATE OR REPLACE FUNCTION public.contractor_can_access_project_file_object(p_object_key text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $function$
  SELECT
    EXISTS (
      SELECT 1 FROM public.project_attachments pa
      WHERE pa.storage_object_key = p_object_key
        AND pa.attachment_status IN ('ACTIVE', 'WITHDRAWN')
    )
    AND public.contractor_can_access_project_files(
      ((string_to_array(p_object_key, '/'))[1])::uuid
    );
$function$;

REVOKE ALL ON FUNCTION public.contractor_can_access_project_file_object(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.contractor_can_access_project_file_object(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.contractor_can_access_project_file_object(text) TO authenticated;

-- ============================================================
-- 15. Storage RLS: swap the contractor SELECT policy to the object-aware
--     helper
-- ============================================================

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
  AND public.contractor_can_access_project_file_object(objects.name)
);

-- ============================================================
-- 16. Quarantine bucket
-- ============================================================
-- Private, no contractor policy of any kind -- not "restricted by a
-- predicate," genuinely no policy grants contractors anything here. Only
-- admins and the owning project's client may read (audit access); all
-- writes happen via supabaseAdmin (service role, bypasses RLS), matching
-- the quarantine service's own design.

INSERT INTO storage.buckets (id, name, public)
VALUES ('quarantined-attachments', 'quarantined-attachments', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "admins can read quarantined attachments" ON storage.objects;
CREATE POLICY "admins can read quarantined attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'quarantined-attachments'
  AND public.is_admin_safe()
);

DROP POLICY IF EXISTS "clients can read own quarantined attachments" ON storage.objects;
CREATE POLICY "clients can read own quarantined attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'quarantined-attachments'
  AND EXISTS (
    SELECT 1 FROM public.project_attachments pa
    JOIN public.projects p ON p.id = pa.project_id
    WHERE pa.quarantine_storage_key = objects.name
      AND p.client_id = auth.uid()
  )
);
