-- ============================================================================
-- Migration 026: RFI Catalog Recovery Seed
-- ============================================================================
--
-- PURPOSE
--   016_complete_schema_baseline.sql creates public.rfi_catalog (id uuid
--   DEFAULT gen_random_uuid(), code text UNIQUE, prompt text,
--   requires_upload_type text) but no migration -- 016 or any other -- ever
--   inserts the 11 catalog rows the application requires. That row data was
--   created out-of-band, per environment, at some point outside version
--   control: production has all 11 rows; staging has zero of them. This was
--   the root cause of a production bug where the "OTHER" open-ended RFI
--   question type's dedupe-exemption logic (see 027) could never be
--   meaningfully validated in staging, and is a standing recovery-chain gap
--   -- a fresh Supabase project rebuilt purely from the migration chain gets
--   an empty rfi_catalog table, silently breaking every RFI dropdown/lookup
--   that depends on these rows existing.
--
--   This migration closes that gap by seeding the 11 rows exactly as
--   audited from production, keyed by the stable `code` column.
--
-- WHY CODE, NOT ID
--   rfi_catalog.id is `gen_random_uuid()` -- confirmed non-deterministic and
--   already divergent between production and any other environment that has
--   ever run its own INSERT. A full audit of every rfi_catalog reference in
--   src/ (8 call sites) confirmed the application always keys by `code` or a
--   dynamically-fetched `id` -- never a hardcoded/literal UUID. So the seed
--   is written against `code`, and ON CONFLICT (code) DO UPDATE is safe: it
--   converges every environment on the same content without depending on,
--   or needing to match, any particular UUID.
--
-- SAFETY / IDEMPOTENCY
--   ON CONFLICT (code) DO UPDATE SET prompt, requires_upload_type:
--     - Production (and any environment that already has these 11 rows):
--       each row's existing `id` is preserved untouched (UPDATE does not
--       change the primary key), and prompt/requires_upload_type are
--       reconciled to this migration's canonical text -- a no-op today,
--       since these values were captured directly from production.
--     - A fresh/staging environment with zero matching rows: all 11 INSERTs
--       apply normally, each generating its own gen_random_uuid().
--   Re-running this migration is a no-op in either case (idempotent).
--
-- SCOPE
--   Row data only. No DDL, no changes to 016, no changes to any other
--   table. Does not touch inspector_price_list, which has the same
--   unseeded-catalog-table gap (confirmed by the same audit) and a
--   hardcoded 'COMPREHENSIVE' pricing_key dependency in Stripe webhook /
--   inspector upgrade-pay code -- tracked as a separate, not-yet-scheduled
--   recovery task, deliberately not addressed here.
-- ============================================================================

INSERT INTO public.rfi_catalog (code, prompt, requires_upload_type) VALUES
  ('SCOPE_CLARIFICATION', 'Can you clarify the scope of work for a specific area?', NULL),
  ('MATERIAL_SPEC', 'What materials or brands are preferred or required?', NULL),
  ('SITE_ACCESS', 'What are the site access requirements and hours?', NULL),
  ('TIMELINE_CONSTRAINT', 'Are there specific timeline constraints or required start dates?', NULL),
  ('PHOTO_REQUEST', 'Can you provide additional photos of the area?', NULL),
  ('MEASUREMENT_CLARIFICATION', 'Can you confirm the measurements or square footage?', NULL),
  ('EXISTING_CONDITIONS', 'Are there existing conditions I should be aware of? (e.g. asbestos, mold, lead paint, structural issues, previous water damage)', NULL),
  ('OTHER', 'I have a specific question not covered above. (Note: this will be reviewed by ONP admin before being posted.)', NULL),
  ('GOALS', 'What are the primary goals of this project?', NULL),
  ('PLANS_BLUEPRINTS', 'Do you have established plans or blueprints, or does design and engineering need to be included in the proposal?', NULL),
  ('MATERIALS_FINISHES', 'Are there specific materials or finishes you prefer?', NULL)
ON CONFLICT (code) DO UPDATE
SET
  prompt = EXCLUDED.prompt,
  requires_upload_type = EXCLUDED.requires_upload_type;
