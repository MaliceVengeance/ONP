-- ============================================================================
-- Migration 027: RFI Open-Ended ("OTHER") Dedupe Fix
-- ============================================================================
--
-- PURPOSE
--   public.rfis has an unconditional unique index (uq_rfi_dedupe, defined in
--   016) on (project_id, revision_number, catalog_id) -- at most one RFI row
--   per catalog item per project per revision. The "OTHER" catalog item
--   ("I have a specific question not covered above...") is intentionally
--   exempt from this rule at the application layer (src/lib/
--   isOpenEndedRfiPrompt.ts, wired into submitRfi in
--   src/app/dashboard/contractor/projects/[id]/rfis/actions.ts) -- it's
--   meant to be askable multiple times per project.
--
--   That app-layer exemption alone is not enough: once a project already has
--   one OTHER row, any further OTHER submission skips the app's own
--   duplicate check (correctly) but then hits this unconditional DB index
--   and fails with a raw Postgres 23505 unique-violation, surfaced to the
--   contractor as an opaque "server error". Confirmed in production logs
--   (digest 4141979897, 20 occurrences): "duplicate key value violates
--   unique constraint \"uq_rfi_dedupe\"". Zero rows were actually written by
--   either failing attempt -- the unique index correctly rolled back the
--   insert; the bug is that it should not have applied to this catalog item
--   at all.
--
--   This migration makes the database itself, not just the application,
--   aware of which catalog items are exempt -- so the "one per project"
--   rule stays enforced (race-safe, at the DB level) for every normal
--   question type even if application validation is ever bypassed, while
--   the open-ended item can legitimately be submitted more than once.
--
-- WHY CODE, NOT PROMPT TEXT OR ID
--   The initial app-layer fix matched on prompt *text* (a tolerant
--   substring match, because prompt copy already carries extra trailing
--   text beyond the original bare sentence). Prompt is display copy, not
--   identity -- it has already changed once and could again. rfi_catalog.id
--   is a random per-environment UUID (see 026's header for the full
--   analysis) -- confirmed absent/divergent between production and
--   staging, so hardcoding a UUID here would be wrong in any environment
--   other than the one it was copied from. `code = 'OTHER'` is the one
--   column confirmed unique, stable, and identical in meaning across every
--   environment (enforced by rfi_catalog_code_key), so that's what this
--   migration's DB-level semantics are keyed on. 026 guarantees every
--   environment has a row with code = 'OTHER' with matching content.
--
-- DESIGN: WHY A DENORMALIZED COLUMN + TRIGGER, NOT A DIRECT PARTIAL INDEX
--   Postgres partial-index predicates cannot reference another table, so
--   "unique except for rows whose catalog item is open-ended" can't be
--   expressed as a single index against rfi_catalog directly. Instead:
--     1. rfi_catalog.is_open_ended (boolean) records the semantic flag,
--        derived from code = 'OTHER'.
--     2. rfis.catalog_is_open_ended (boolean) denormalizes that flag onto
--        each RFI row at insert time, via a BEFORE INSERT OR UPDATE OF
--        catalog_id trigger -- so application code (submitRfi's existing
--        .insert({...}) call) needs no changes.
--     3. uq_rfi_dedupe becomes a partial unique index over rfis alone,
--        WHERE catalog_is_open_ended = false -- enforced atomically by
--        Postgres itself, independent of and authoritative over any
--        application-layer check.
--
-- IMMUTABILITY DECISION
--   rfi_catalog has no application-facing CRUD UI anywhere in the codebase
--   (confirmed by audit) -- its code-to-semantics mapping is treated as
--   immutable reference/config data, not runtime-editable. Accordingly this
--   migration adds a trigger that populates catalog_is_open_ended when an
--   rfis row is inserted (or its catalog_id changes), but deliberately does
--   NOT add a trigger cascading rfi_catalog.is_open_ended UPDATEs into
--   existing rfis rows -- that scenario is not reachable through the
--   application and would add complexity for a case that cannot occur
--   today. If rfi_catalog ever becomes editable, this decision should be
--   revisited.
--
-- SAFETY / IDEMPOTENCY
--   - ADD COLUMN IF NOT EXISTS x2: safe to re-run.
--   - Both UPDATE ... WHERE <column> <> <target value> statements are
--     idempotent no-ops on re-run once converged, and correctly re-sync if
--     026 seeds/updates rfi_catalog after this migration first runs.
--   - CREATE OR REPLACE FUNCTION + DROP TRIGGER IF EXISTS / CREATE TRIGGER:
--     standard idempotent function/trigger replacement pattern (same
--     pattern already used in 020 for handle_new_user()).
--   - DROP INDEX IF EXISTS + CREATE UNIQUE INDEX: re-running recreates the
--     same index; safe. Verified against current production data before
--     writing this migration: 24 existing rfis rows, grouped by
--     (project_id, revision_number, catalog_id), contain zero duplicate
--     tuples under the OLD unconditional index -- so the new, strictly
--     narrower-scoped partial index (which only tightens uniqueness within
--     catalog_is_open_ended = false, and imposes no constraint at all on
--     catalog_is_open_ended = true rows) is guaranteed to accept 100% of
--     current production data with no manual cleanup required.
--
-- SCOPE
--   rfi_catalog and rfis only. No changes to 016. Does not touch
--   inspector_price_list or any other table.
-- ============================================================================

-- 1. Catalog-level semantic flag, derived from the stable `code` column.
ALTER TABLE public.rfi_catalog
  ADD COLUMN IF NOT EXISTS is_open_ended boolean NOT NULL DEFAULT false;

UPDATE public.rfi_catalog
SET is_open_ended = (code = 'OTHER')
WHERE is_open_ended <> (code = 'OTHER');

-- 2. Denormalized flag on rfis, backfilled from the catalog, kept in sync
--    going forward by the trigger below.
ALTER TABLE public.rfis
  ADD COLUMN IF NOT EXISTS catalog_is_open_ended boolean NOT NULL DEFAULT false;

UPDATE public.rfis r
SET catalog_is_open_ended = c.is_open_ended
FROM public.rfi_catalog c
WHERE r.catalog_id = c.id
  AND r.catalog_is_open_ended <> c.is_open_ended;

CREATE OR REPLACE FUNCTION public.set_rfi_catalog_is_open_ended()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  SELECT is_open_ended INTO NEW.catalog_is_open_ended
  FROM public.rfi_catalog
  WHERE id = NEW.catalog_id;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_rfi_catalog_is_open_ended ON public.rfis;
CREATE TRIGGER trg_rfi_catalog_is_open_ended
BEFORE INSERT OR UPDATE OF catalog_id ON public.rfis
FOR EACH ROW
EXECUTE FUNCTION public.set_rfi_catalog_is_open_ended();

-- 3. Replace the unconditional unique index with a partial one that exempts
--    open-ended rows. Race-safe: enforced by the index itself at insert
--    time, not by any application-layer pre-check.
DROP INDEX IF EXISTS uq_rfi_dedupe;
CREATE UNIQUE INDEX uq_rfi_dedupe ON public.rfis (project_id, revision_number, catalog_id)
  WHERE catalog_is_open_ended = false;
