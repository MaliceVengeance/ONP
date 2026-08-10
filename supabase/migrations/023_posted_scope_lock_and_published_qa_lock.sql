-- Posted project scope lock, max_deadline_resets privilege protection, and
-- published pre-populated Q&A lock. All three close direct-API/service-role
-- bypasses of "the posted project information doesn't silently change after
-- publication" -- the same guarantee the RFI information-revision system
-- protects for the interactive Q&A, extended here to the projects table
-- itself and to the separate pre-populated-catalog Q&A write path.

-- ============================================================
-- 1. Posted project scope lock (public.projects)
-- ============================================================
-- Once a project is no longer DRAFT, none of the listed scope columns may
-- change. No admin/service-role bypass -- this is a trigger, not RLS, so it
-- fires regardless of role. The publish transition itself is unaffected:
-- at the moment publishProject's UPDATE runs, OLD.state is still 'DRAFT',
-- so the guard does not apply to that call.

CREATE OR REPLACE FUNCTION public.enforce_posted_scope_lock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.state IS DISTINCT FROM 'DRAFT' THEN
    IF NEW.title IS DISTINCT FROM OLD.title
      OR NEW.description IS DISTINCT FROM OLD.description
      OR NEW.category IS DISTINCT FROM OLD.category
      OR NEW.location_general IS DISTINCT FROM OLD.location_general
      OR NEW.city IS DISTINCT FROM OLD.city
      OR NEW.zip_code IS DISTINCT FROM OLD.zip_code
      OR NEW.target_start_date IS DISTINCT FROM OLD.target_start_date
      OR NEW.min_open_days IS DISTINCT FROM OLD.min_open_days
      OR NEW.max_open_days IS DISTINCT FROM OLD.max_open_days
      OR NEW.uses_inspector_takeoff IS DISTINCT FROM OLD.uses_inspector_takeoff
    THEN
      RAISE EXCEPTION 'Published project scope cannot be modified without a project revision.';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS projects_enforce_posted_scope_lock ON public.projects;
CREATE TRIGGER projects_enforce_posted_scope_lock
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_posted_scope_lock();

-- ============================================================
-- 2. Extend column-privilege protection to max_deadline_resets
-- ============================================================
-- Migration 021 already protected information_revision_number and
-- deadline_reset_count via REVOKE-then-column-GRANT (a blanket table-level
-- UPDATE grant otherwise overrides a bare column-level REVOKE). Since 021
-- already replaced the table-level grant with an explicit column list, a
-- plain column-level REVOKE is now sufficient here -- no re-grant needed,
-- nothing else changes.

REVOKE UPDATE (max_deadline_resets) ON public.projects FROM authenticated;

-- ============================================================
-- 3. Published pre-populated Q&A lock (public.rfis)
-- ============================================================
-- Distinguishes the two Q&A mechanisms that both live in this table by the
-- existing contractor_id column: NULL = pre-populated catalog answer
-- (written by updateProjectRfis), NOT NULL = contractor-asked interactive
-- RFI (written by the RFI submission/respondToRfi flow, already correctly
-- state-gated by project_is_open_for_bidding() via existing RLS). This
-- trigger only restricts the NULL (pre-populated) rows -- the interactive
-- RFI system is untouched and continues working exactly as before.
--
-- Governs INSERT/UPDATE/DELETE alike, since updateProjectRfis does all
-- three depending on whether an answer is being added, changed, or cleared.
-- SECURITY DEFINER so the state lookup isn't itself blocked by RLS; fires
-- regardless of role (including supabaseAdmin/service-role), which is the
-- actual point -- updateProjectRfis writes via service role today, so an
-- RLS-only fix would not have been a real backstop.

CREATE OR REPLACE FUNCTION public.enforce_published_qa_lock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_project_id uuid;
  v_contractor_id uuid;
  v_state text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_project_id := OLD.project_id;
    v_contractor_id := OLD.contractor_id;
  ELSE
    v_project_id := NEW.project_id;
    v_contractor_id := NEW.contractor_id;
  END IF;

  IF v_contractor_id IS NULL THEN
    SELECT state::text INTO v_state FROM public.projects WHERE id = v_project_id;
    IF v_state IS DISTINCT FROM 'DRAFT' THEN
      RAISE EXCEPTION 'Published project Q&A cannot be modified after publication. Use the RFI system for new clarifications.';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS rfis_enforce_published_qa_lock ON public.rfis;
CREATE TRIGGER rfis_enforce_published_qa_lock
  BEFORE INSERT OR UPDATE OR DELETE ON public.rfis
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_published_qa_lock();
