-- RFI information-revision tracking, bid acknowledgment, and bid eligibility.
--
-- Adds an explicit, RFI-answer-driven information revision counter on
-- projects, an auditable per-bid-version acknowledgment of that revision,
-- and DB-enforced eligibility at award time. Deliberately does NOT reuse
-- projects.revision_number / bids.ack_project_revision_number /
-- bid_versions.project_revision_number -- those remain reserved for a
-- possible future general project-revision system.
--
-- Also hardens rfis_update_client so an RFI cannot be answered after the
-- bidding deadline / on a closed or awarded project via direct API access,
-- and adds a durable, retryable notification outbox used by the RFI
-- information-update fan-out and the ineligibility notification.

-- ============================================================
-- 1. Schema
-- ============================================================

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS information_revision_number integer NOT NULL DEFAULT 0;

ALTER TABLE public.bid_versions
  ADD COLUMN IF NOT EXISTS acknowledged_information_revision integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS acknowledgment_affirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS information_acknowledged_at timestamptz,
  ADD COLUMN IF NOT EXISTS acknowledgment_version integer NOT NULL DEFAULT 1;

ALTER TABLE public.bids
  ADD COLUMN IF NOT EXISTS ineligibility_notified_at timestamptz;

-- Durable, retryable notification outbox. Rows are inserted synchronously by
-- the triggering action (cheap, transactional); a cron processes unsent rows
-- and marks sent_at only after a successful send, so a failed delivery is
-- retried on the next run rather than silently dropped.
CREATE TABLE IF NOT EXISTS public.notification_outbox (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  kind text NOT NULL,
  project_id uuid NOT NULL,
  bid_id uuid,
  recipient_contractor_id uuid NOT NULL,
  channel text NOT NULL DEFAULT 'email',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  attempt_count integer NOT NULL DEFAULT 0,
  last_attempt_at timestamptz,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT notification_outbox_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT notification_outbox_bid_id_fkey FOREIGN KEY (bid_id) REFERENCES public.bids(id)
);

CREATE INDEX IF NOT EXISTS notification_outbox_unsent_idx
  ON public.notification_outbox (created_at)
  WHERE sent_at IS NULL;

ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;
-- No policies: deny-all to anon/authenticated by default. Only supabaseAdmin
-- (service role, which bypasses RLS) reads/writes this table -- it's purely
-- internal delivery-tracking, never queried by a user-facing page.

-- ============================================================
-- 2. Server-controlled acknowledgment stamping (bid_versions)
-- ============================================================
-- The client may only assert whether THEY affirmed the acknowledgment
-- (acknowledgment_affirmed). The revision number being acknowledged against,
-- and the timestamp, are always computed here from the live project row --
-- a client cannot choose or forge acknowledged_information_revision.

CREATE OR REPLACE FUNCTION public.stamp_bid_version_acknowledgment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_live_revision integer;
BEGIN
  SELECT p.information_revision_number
    INTO v_live_revision
  FROM public.bids b
  JOIN public.projects p ON p.id = b.project_id
  WHERE b.id = NEW.bid_id;

  NEW.acknowledged_information_revision := COALESCE(v_live_revision, 0);

  IF NEW.acknowledgment_affirmed THEN
    NEW.information_acknowledged_at := now();
  ELSE
    NEW.information_acknowledged_at := NULL;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS bid_versions_stamp_acknowledgment ON public.bid_versions;
CREATE TRIGGER bid_versions_stamp_acknowledgment
  BEFORE INSERT ON public.bid_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.stamp_bid_version_acknowledgment();

-- ============================================================
-- 3. Trigger-guaranteed information-revision bump
-- ============================================================
-- Fires only on a genuine SENT -> ANSWERED transition (never on ask, never
-- on a redundant re-save of an already-answered row), so this guarantee does
-- not depend on application code remembering to increment it, and cannot be
-- double-counted by a retried respondToRfi call.

CREATE OR REPLACE FUNCTION public.bump_information_revision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.projects
  SET information_revision_number = information_revision_number + 1,
      updated_at = now()
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS rfis_bump_information_revision ON public.rfis;
CREATE TRIGGER rfis_bump_information_revision
  AFTER UPDATE ON public.rfis
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM 'ANSWERED' AND NEW.status = 'ANSWERED')
  EXECUTE FUNCTION public.bump_information_revision();

-- ============================================================
-- 4. RFI answer deadline enforcement (DB layer, not just UI/app)
-- ============================================================
-- Reuses the existing project_is_open_for_bidding() helper (state=OPEN AND
-- deadline_at > now() AND no award exists) -- the same rule bid writes are
-- already held to. After the deadline (or once awarded/closed), this UPDATE
-- simply matches zero rows: no answer recorded, and therefore the revision
-- trigger above never fires, so nothing downstream (notification, deadline
-- extension) runs either.

DROP POLICY IF EXISTS "rfis_update_client" ON public.rfis;
CREATE POLICY "rfis_update_client" ON public."rfis"
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = rfis.project_id AND p.client_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = rfis.project_id AND p.client_id = auth.uid())
    AND project_is_open_for_bidding(rfis.project_id)
  );

-- ============================================================
-- 5. System-computed counters: block direct client writes
-- ============================================================
-- information_revision_number and deadline_reset_count must only ever change
-- via the triggers/guarded UPDATE above (run as supabaseAdmin / service
-- role). `authenticated` holds a blanket table-level UPDATE grant on
-- projects, which takes precedence over any column-level REVOKE -- Postgres
-- column-level privileges only narrow access when the broader table-level
-- grant is removed first. So: revoke table-level UPDATE entirely, then
-- re-grant UPDATE on every column except the two system-computed ones. This
-- is independent of, and narrower than, the still-pending broader
-- OPEN-project scope-lock fix (which will further restrict some of these
-- columns by project state, not by identity).

REVOKE UPDATE ON public.projects FROM authenticated;
GRANT UPDATE (
  client_id, state, title, category, description, location_general,
  published_at, deadline_at, min_open_days, max_open_days, revision_number,
  max_deadline_resets, urgent_override, urgent_reason, urgent_set_by,
  uses_inspector_takeoff, inspector_assignment_id, updated_at, city,
  override_requested_at, override_requested_reason, override_requested_by,
  zip_code, emergency_bid_mode, is_emergency, emergency_paid_at,
  emergency_payment_id, emergency_auto_close_at, emergency_admin_granted,
  inspector_hold_started_at, target_start_date, completion_requested_at
) ON public.projects TO authenticated;
-- Deliberately excluded from the re-grant: information_revision_number,
-- deadline_reset_count, id, created_at (id/created_at were never
-- client-updatable in practice; excluding them here is just hygiene, not a
-- behavior change).

-- ============================================================
-- 6. Award-time eligibility enforcement
-- ============================================================
-- award_project_bid gains one additional check: the bid version being
-- awarded must have an affirmed acknowledgment matching the project's
-- CURRENT information revision. Everything else in the function is
-- unchanged from the 016 baseline.

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
  select client_id, deadline_at, state::text, information_revision_number
    into v_client_id, v_deadline, v_state, v_info_revision
  from public.projects
  where id = p_project_id;

  if v_client_id is null then
    raise exception 'Project not found';
  end if;

  -- permission: owner client or admin
  if not (auth.uid() = v_client_id or v_role = 'ADMIN') then
    raise exception 'Forbidden';
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
  -- project's live information revision
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
-- 7. RFI-triggered deadline extension (standard 24h / emergency 12h)
-- ============================================================
-- Called from respondToRfi via supabaseAdmin immediately after a successful
-- RFI answer. FOR UPDATE row-locks the project row so concurrent calls on
-- the same project serialize correctly -- the cap (deadline_reset_count <
-- max_deadline_resets) can never be exceeded under concurrent RFI answers.
-- deadline_at + interval, never now() + interval, so the deadline never
-- moves backward relative to what contractors were already told.

CREATE OR REPLACE FUNCTION public.apply_rfi_deadline_extension(p_project_id uuid)
RETURNS TABLE(deadline_at timestamptz, deadline_reset_count integer, extended boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_deadline timestamptz;
  v_reset_count integer;
  v_max_resets integer;
  v_is_emergency boolean;
  v_emergency_bid_mode boolean;
  v_state text;
  v_new_deadline timestamptz;
  v_extended boolean := false;
BEGIN
  SELECT p.deadline_at, p.deadline_reset_count, p.max_deadline_resets,
         p.is_emergency, p.emergency_bid_mode, p.state::text
    INTO v_deadline, v_reset_count, v_max_resets, v_is_emergency, v_emergency_bid_mode, v_state
  FROM public.projects p
  WHERE p.id = p_project_id
  FOR UPDATE;

  v_new_deadline := v_deadline;

  IF v_state = 'OPEN' AND v_deadline IS NOT NULL AND v_reset_count < v_max_resets THEN
    IF (v_is_emergency OR v_emergency_bid_mode) THEN
      IF v_deadline - now() <= interval '12 hours' THEN
        v_new_deadline := v_deadline + interval '12 hours';
        v_extended := true;
      END IF;
    ELSE
      IF v_deadline - now() <= interval '24 hours' THEN
        v_new_deadline := v_deadline + interval '24 hours';
        v_extended := true;
      END IF;
    END IF;
  END IF;

  IF v_extended THEN
    UPDATE public.projects AS proj
    SET deadline_at = v_new_deadline,
        deadline_reset_count = proj.deadline_reset_count + 1,
        updated_at = now()
    WHERE proj.id = p_project_id;
    v_reset_count := v_reset_count + 1;
  END IF;

  RETURN QUERY SELECT v_new_deadline, v_reset_count, v_extended;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.apply_rfi_deadline_extension(uuid) TO service_role;
