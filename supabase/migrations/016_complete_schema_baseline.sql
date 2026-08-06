-- ============================================================================
-- Migration 016: Complete Schema Baseline
-- ============================================================================
--
-- PURPOSE
--   Captures the live production database schema in full: all tables,
--   enums, constraints, functions, triggers, RLS policies, indexes, and
--   storage bucket configuration, as it exists in production as of the
--   snapshot below. Snapshot taken via direct pg_catalog/information_schema
--   introspection on 2026-08-05 (revised 2026-08-06 after independent
--   review -- see REVISION NOTES below).
--
-- FRESH-REBUILD PATH -- READ BEFORE APPLYING TO A NEW ENVIRONMENT
--   For a genuine from-scratch rebuild, run THIS FILE ALONE. Do not also
--   run 001 through 015 afterward -- this file is a COMPLETE baseline
--   (every table, enum, constraint, function, trigger, policy, index, and
--   storage bucket as they exist in production today, i.e. the end state
--   AFTER 001-015 were applied), so 001-015 have nothing left to add.
--
--   This was verified empirically, not assumed, in two stages:
--     1. Running 001 through 016 in literal ascending filename order
--        against a genuinely empty database fails immediately in
--        001_emergency_bid.sql with "relation projects does not exist" --
--        migrations 001-015 all assume a pre-existing base schema
--        (profiles, projects, contractor_profiles, bids, etc.) that, in
--        this project's real history, was created directly in the
--        Supabase dashboard before migration 001 was ever written. 016 is
--        the first migration to ever create those tables.
--     2. Running 016 FIRST and then 001-015 also fails -- not on table
--        creation (016 already created everything), but because most of
--        001-015 (002, 003, 005, 006, 008, 010, 012 confirmed) create
--        policies with a bare CREATE POLICY and no DROP POLICY IF EXISTS
--        or other guard. They were written as one-time "run this once in
--        the SQL Editor" scripts, not idempotent/repeatable migrations --
--        so once 016 has already created the policy they're about to
--        create, they fail on "policy already exists" rather than no-op.
--
--   Conclusion: 016 is self-sufficient. Verified by running it alone,
--   twice in a row, against a genuinely separate, empty Postgres database
--   (not just a schema within the same database as production, which
--   would let production's own catalog rows leak into unqualified system
--   catalog lookups and mask certain classes of bug) -- see the companion
--   validation report for exact commands and results.
--
--   Against PRODUCTION, none of this matters -- every statement in this
--   file is a guarded no-op against objects that already exist, regardless
--   of run order relative to 001-015.
--
-- SCOPE / WHAT THIS MIGRATION DELIBERATELY DOES NOT DO
--   Documentary baseline capture only: no repair, no refactor, no
--   optimization, no renames, no removals, no new behavior. Every quirk
--   found in production is captured exactly as-is.
--
--   EXCLUDED ON PURPOSE: "service_area_waitlist" and
--   "profiles.service_area_zip" / "profiles.service_area_status" --
--   confirmed absent from production (migration 005 was never actually
--   applied). See the dedicated investigation report. Fix belongs in a
--   later, separate migration -- not started here.
--
-- IDEMPOTENCY STRATEGY
--   - Extensions:  CREATE EXTENSION IF NOT EXISTS               (native)
--   - Enums:       DO block guarded by a pg_type existence check (no native IF NOT EXISTS for CREATE TYPE)
--   - Tables:      CREATE TABLE IF NOT EXISTS, PK/UNIQUE/CHECK inline (native)
--   - Foreign keys: DO block guarded by a pg_constraint existence check, added
--                   AFTER every table exists (see REVISION NOTES -- this is new)
--   - Functions:   CREATE OR REPLACE FUNCTION                   (native, safe to re-run verbatim)
--   - Triggers:    DO block guarded by a pg_trigger existence check  (no DROP -- purely additive)
--   - RLS enable:  ALTER TABLE ... ENABLE ROW LEVEL SECURITY     (native no-op if already enabled)
--   - RLS policies: DO block guarded by a pg_policies existence check (no DROP -- purely additive)
--   - Indexes:     CREATE [UNIQUE] INDEX IF NOT EXISTS           (native)
--   - Storage buckets:  INSERT ... ON CONFLICT (id) DO NOTHING
--   - Storage policies: same DO-block guard pattern, scoped to storage.objects
--
--   CREATE POLICY IF NOT EXISTS and CREATE TRIGGER IF NOT EXISTS were
--   verified empirically to be invalid syntax on this Postgres version
--   (17.6) -- confirmed by direct test, not assumed.
--
-- REVISION NOTES (this version)
--   Independent review correctly identified that inline foreign keys
--   inside alphabetically-ordered CREATE TABLE statements would fail a
--   genuine fresh-rebuild test (e.g. bid_dismissals, created before
--   "bids" and "projects" alphabetically, inline-references both).
--   Fixed by moving all 65 foreign keys out of CREATE TABLE and into a
--   new SECTION: CONSTRAINTS block that runs after every table exists,
--   each one individually guarded so re-running is always safe and nothing
--   is ever dropped. Table creation order no longer matters at all.
--
--   Also fixed: the enum-existence guard checked pg_type.typname with no
--   namespace filter, which is unsafe in general (not just a test
--   artifact) -- now properly joins pg_namespace and filters on
--   nspname = 'public'.
--
--   Also determined, via a genuinely separate empty database (not just an
--   isolated schema, which would let production's own pg_type catalog
--   rows leak into unqualified lookups): 016 is self-sufficient for a
--   fresh rebuild on its own. Running 001-015 afterward is unnecessary
--   and fails, since most of them create policies with no idempotency
--   guard. See FRESH-REBUILD PATH above.
--
-- OBJECT COUNTS (cross-check before applying)
--   41 tables · 9 enums · 65 foreign keys · 11 unique constraints ·
--   8 check constraints · 53 secondary indexes · 20 functions ·
--   3 triggers · 82 RLS policies · 4 storage buckets · 6 storage policies
-- ============================================================================


-- ============================================================================
-- SECTION: EXTENSIONS
-- ============================================================================
-- Confirmed present in pg_available_extensions on this Supabase Postgres
-- instance. supabase_vault is Supabase-platform-specific and will only
-- succeed on a Supabase-hosted project.

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SECTION: ENUMS
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'bid_status'
  ) THEN
    CREATE TYPE public.bid_status AS ENUM ('IN_PROGRESS', 'SUBMITTED_CURRENT', 'REVIEW_REQUIRED', 'LOCKED_FINAL', 'DISQUALIFIED_SUBSCRIPTION');
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'dispute_status'
  ) THEN
    CREATE TYPE public.dispute_status AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'RESOLVED_UPGRADE_JUSTIFIED', 'RESOLVED_PARTIAL_CREDIT', 'RESOLVED_REFUND', 'WITHDRAWN');
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'project_category'
  ) THEN
    CREATE TYPE public.project_category AS ENUM ('GENERAL_CONSTRUCTION', 'ELECTRICAL', 'PLUMBING', 'HVAC', 'ROOFING', 'CONCRETE', 'LANDSCAPING', 'PAINTING', 'FENCING', 'FLOORING', 'RENOVATION', 'OTHER');
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'project_state'
  ) THEN
    CREATE TYPE public.project_state AS ENUM ('DRAFT', 'OPEN', 'BIDDING_CLOSED', 'BIDS_UNLOCKED', 'AWARDED', 'CANCELED', 'COMPLETED', 'PENDING_PAYMENT', 'EMERGENCY_EXPIRED');
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'role_type'
  ) THEN
    CREATE TYPE public.role_type AS ENUM ('ADMIN', 'CLIENT', 'CONTRACTOR', 'INSPECTOR');
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'service_type'
  ) THEN
    CREATE TYPE public.service_type AS ENUM ('INSPECTOR_TAKEOFF');
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'subscription_status'
  ) THEN
    CREATE TYPE public.subscription_status AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED', 'TRIALING');
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'support_status'
  ) THEN
    CREATE TYPE public.support_status AS ENUM ('OPEN', 'ASSIGNED', 'WAITING_ON_USER', 'CLOSED');
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'vet_cert_status'
  ) THEN
    CREATE TYPE public.vet_cert_status AS ENUM ('NOT_APPLIED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'RECHECK_REQUIRED');
  END IF;
END $$;

-- ============================================================================
-- SECTION: TABLES
-- ============================================================================
-- All 41 live tables. PRIMARY KEY and CHECK constraints are inline -- no
-- cross-table ordering dependency, safely idempotent as part of the
-- CREATE TABLE IF NOT EXISTS guard. FOREIGN KEY constraints are deferred
-- to SECTION: CONSTRAINTS so table creation order never matters. A UNIQUE
-- constraint is ALSO deferred whenever its column set exactly matches the
-- table's own PRIMARY KEY -- verified empirically that PostgreSQL silently
-- merges a same-column PK + UNIQUE declared together in one CREATE TABLE
-- into a single object (keeping the UNIQUE constraint's name but the PK's
-- type), which would silently lose one of two genuinely distinct
-- constraint objects that exist separately in production today (e.g.
-- contractor_directory_public, whose PK and UNIQUE constraint were
-- evidently added at different times historically). All other UNIQUE
-- constraints (distinct columns from the PK) stay inline as before.


CREATE TABLE IF NOT EXISTS public."admin_actions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "admin_id" uuid NOT NULL,
  "action_type" text NOT NULL,
  "target_user_id" uuid,
  "target_entity_id" uuid,
  "notes" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."audit_log" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "actor_id" uuid,
  "action" text NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" uuid NOT NULL,
  "details" jsonb,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."bid_acknowledgments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "contractor_id" uuid NOT NULL,
  "bid_id" uuid NOT NULL,
  "bid_version_number" integer DEFAULT 1 NOT NULL,
  "disclaimer_version" text DEFAULT 'v1.0-2026-05-25'::text NOT NULL,
  "acknowledged_at" timestamptz DEFAULT now() NOT NULL,
  "terms_checked" boolean DEFAULT true NOT NULL,
  "credentials_checked" boolean DEFAULT true NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."bid_dismissal_reasons" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "code" text NOT NULL,
  "label" text NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT "bid_dismissal_reasons_code_key" UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS public."bid_dismissals" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid NOT NULL,
  "contractor_id" uuid NOT NULL,
  "bid_id" uuid NOT NULL,
  "reason_code" text,
  "reason_other_text" text,
  "dismissed_at" timestamptz DEFAULT now() NOT NULL,
  "dismissed_by" uuid NOT NULL,
  "contains_profanity" boolean DEFAULT false NOT NULL,
  "moderation_status" text DEFAULT 'not_applicable'::text NOT NULL,
  "reviewed_at" timestamptz,
  "reviewed_by" uuid,
  PRIMARY KEY (id),
  CONSTRAINT "bid_dismissals_bid_id_key" UNIQUE (bid_id),
  CONSTRAINT "bid_dismissals_moderation_status_check" CHECK ((moderation_status = ANY (ARRAY['not_applicable'::text, 'pending_review'::text, 'approved'::text, 'rejected'::text])))
);

CREATE TABLE IF NOT EXISTS public."bid_line_items" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "bid_version_id" uuid NOT NULL,
  "description" text NOT NULL,
  "quantity" numeric DEFAULT 1 NOT NULL,
  "unit_price_cents" bigint DEFAULT 0 NOT NULL,
  "tax_pct" numeric DEFAULT 0 NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."bid_versions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "bid_id" uuid NOT NULL,
  "version_number" integer NOT NULL,
  "project_revision_number" integer NOT NULL,
  "amount_cents" integer NOT NULL,
  "duration_days" integer,
  "start_window" text,
  "inclusions" jsonb,
  "exclusions" jsonb,
  "submitted_at" timestamptz DEFAULT now() NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "notes" text,
  "warranty_terms" text,
  "deposit_terms" text,
  "scope_disclaimers" text,
  "estimate_valid_until" date,
  "quote_pdf_path" text,
  "quote_pdf_filename" text,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."bids" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid NOT NULL,
  "contractor_id" uuid NOT NULL,
  "status" public.bid_status DEFAULT 'IN_PROGRESS'::bid_status NOT NULL,
  "latest_version_id" uuid,
  "ack_project_revision_number" integer DEFAULT 0 NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "review_rank" integer,
  "review_note" text,
  "review_amount_cents" bigint,
  PRIMARY KEY (id),
  CONSTRAINT "bids_project_id_contractor_id_key" UNIQUE (project_id, contractor_id)
);

CREATE TABLE IF NOT EXISTS public."client_credits" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "client_id" uuid NOT NULL,
  "amount_cents" integer NOT NULL,
  "source" text DEFAULT 'DISPUTE_RESOLUTION'::text NOT NULL,
  "source_reference_id" uuid,
  "status" text DEFAULT 'AVAILABLE'::text NOT NULL,
  "expires_at" timestamptz,
  "used_at" timestamptz,
  "used_for_reference_id" uuid,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "expiry_reminder_sent_at" timestamptz,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."contractor_credentials" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "contractor_id" uuid NOT NULL,
  "credential_type" text NOT NULL,
  "state" text,
  "city" text,
  "credential_number" text,
  "issuing_authority" text,
  "trade" text,
  "expiration_date" date,
  "bond_amount_cents" bigint,
  "bonding_company" text,
  "verified" boolean DEFAULT false NOT NULL,
  "verified_at" timestamptz,
  "verified_by" uuid,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT "contractor_credentials_credential_type_check" CHECK ((credential_type = ANY (ARRAY['STATE_LICENSE'::text, 'CITY_REGISTRATION'::text, 'TRADE_LICENSE'::text, 'BOND'::text])))
);

CREATE TABLE IF NOT EXISTS public."contractor_directory_public" (
  "contractor_id" uuid NOT NULL,
  "contractor_public_name" text NOT NULL,
  "company_name" text,
  "service_categories" jsonb,
  "service_area" text,
  "years_experience" integer,
  "about" text,
  "license_verified" boolean DEFAULT false NOT NULL,
  "insurance_verified" boolean DEFAULT false NOT NULL,
  "is_certified_veteran_owned" boolean DEFAULT false NOT NULL,
  "min_job_cents" integer,
  "typical_project_cents" integer,
  "max_project_cents" integer,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "business_name" text,
  "city" text,
  "state" text,
  "veteran_verified" boolean,
  PRIMARY KEY (contractor_id)
);

CREATE TABLE IF NOT EXISTS public."contractor_portfolio_photos" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "contractor_id" uuid NOT NULL,
  "storage_path" text NOT NULL,
  "caption" text,
  "display_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."contractor_profiles" (
  "contractor_id" uuid NOT NULL,
  "business_name" text,
  "city" text,
  "state" text,
  "categories" text[] DEFAULT '{}'::text[] NOT NULL,
  "description" text,
  "is_listed" boolean DEFAULT true NOT NULL,
  "veteran_applied_at" timestamptz,
  "veteran_verified" boolean DEFAULT false NOT NULL,
  "veteran_verified_at" timestamptz,
  "veteran_verified_by" uuid,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "military_branch" text,
  "license_number" text,
  "license_expiry" date,
  "coi_provider" text,
  "coi_policy_number" text,
  "coi_expiry" date,
  "coi_amount" integer,
  "directory_verified" boolean DEFAULT false,
  "directory_verified_at" timestamptz,
  "directory_verified_by" uuid,
  "phone" text,
  "has_no_license" boolean DEFAULT false,
  "has_no_insurance" boolean DEFAULT false,
  "address_line1" text,
  "address_line2" text,
  "address_zip" text,
  "veteran_credential_type" text,
  "veteran_credential_reference" text,
  "veteran_rejection_reason" text,
  "bbb_url" text,
  PRIMARY KEY (contractor_id),
  CONSTRAINT "contractor_profiles_veteran_credential_type_check" CHECK ((veteran_credential_type = ANY (ARRAY['TVC_VVL'::text, 'VA_VETCERT'::text])))
);

CREATE TABLE IF NOT EXISTS public."contractor_settings" (
  "contractor_id" uuid NOT NULL,
  "emergency_notifications_enabled" boolean DEFAULT true NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (contractor_id)
);

CREATE TABLE IF NOT EXISTS public."contractor_subscriptions" (
  "contractor_id" uuid NOT NULL,
  "status" public.subscription_status NOT NULL,
  "plan_interval" text NOT NULL,
  "price_cents" integer NOT NULL,
  "currency" text DEFAULT 'USD'::text NOT NULL,
  "current_period_start" timestamptz NOT NULL,
  "current_period_end" timestamptz NOT NULL,
  "auto_renew" boolean DEFAULT true NOT NULL,
  "grace_until" timestamptz,
  "provider" text,
  "provider_customer_id" text,
  "provider_subscription_id" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "stripe_customer_id" text,
  "stripe_subscription_id" text,
  "plan_type" text,
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "cancel_at_period_end" boolean DEFAULT false,
  "term_months" integer,
  "commitment_ends_at" timestamptz,
  PRIMARY KEY (id),
  CONSTRAINT "contractor_subscriptions_contractor_id_key" UNIQUE (contractor_id),
  CONSTRAINT "contractor_subscriptions_plan_interval_check" CHECK ((plan_interval = ANY (ARRAY['MONTHLY'::text, 'QUARTERLY'::text, 'SEMIANNUAL'::text, 'YEARLY'::text])))
);

CREATE TABLE IF NOT EXISTS public."contractor_verification_log" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "contractor_id" uuid NOT NULL,
  "admin_id" uuid NOT NULL,
  "admin_email" text,
  "action_type" text NOT NULL,
  "note" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."coupon_codes" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "code" text NOT NULL,
  "stripe_coupon_id" text NOT NULL,
  "months_free" integer NOT NULL,
  "description" text,
  "created_by" uuid,
  "created_at" timestamptz DEFAULT now(),
  "is_active" boolean DEFAULT true,
  PRIMARY KEY (id),
  CONSTRAINT "coupon_codes_code_key" UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS public."disclaimer_acknowledgments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "disclaimer_type" text NOT NULL,
  "disclaimer_version" text NOT NULL,
  "acknowledged_at" timestamptz DEFAULT now() NOT NULL,
  "context" jsonb,
  "project_id" uuid,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."emergency_request_log" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "client_id" uuid NOT NULL,
  "project_id" uuid,
  "charged_amount_cents" integer NOT NULL,
  "stripe_payment_intent_id" text,
  "payment_status" text NOT NULL,
  "counts_against_limit" boolean DEFAULT true NOT NULL,
  "admin_granted" boolean DEFAULT false NOT NULL,
  "admin_granted_by" uuid,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "closed_at" timestamptz,
  "close_reason" text,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."inspector_flags" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "inspector_id" uuid NOT NULL,
  "dispute_id" uuid NOT NULL,
  "flag_reason" text DEFAULT 'UPGRADE_NOT_JUSTIFIED'::text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."inspector_price_list" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "pricing_key" text NOT NULL,
  "display_name" text NOT NULL,
  "description" text,
  "fee_cents" integer NOT NULL,
  "inspector_share_percent" integer DEFAULT 65 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT "inspector_price_list_pricing_key_key" UNIQUE (pricing_key)
);

CREATE TABLE IF NOT EXISTS public."inspector_responses" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "inspector_rfi_id" uuid NOT NULL,
  "response_summary" text,
  "revision_id" uuid,
  "attachment_id" uuid,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."inspector_rfi_catalog" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "code" text NOT NULL,
  "prompt" text NOT NULL,
  "allows_upload" boolean DEFAULT false NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT "inspector_rfi_catalog_code_key" UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS public."inspector_rfis" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid NOT NULL,
  "contractor_id" uuid NOT NULL,
  "inspector_id" uuid NOT NULL,
  "catalog_id" uuid NOT NULL,
  "status" text DEFAULT 'SENT'::text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."inspector_upgrade_disputes" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "inspector_request_id" uuid NOT NULL,
  "project_id" uuid NOT NULL,
  "client_id" uuid NOT NULL,
  "original_inspector_id" uuid NOT NULL,
  "client_statement" text NOT NULL,
  "inspector_showed_reasons_on_site" boolean,
  "client_evidence_urls" text[],
  "status" public.dispute_status DEFAULT 'SUBMITTED'::dispute_status NOT NULL,
  "master_inspector_id" uuid,
  "assigned_at" timestamptz,
  "original_inspector_statement" text,
  "original_inspector_responded_at" timestamptz,
  "resolution_decision" public.dispute_status,
  "resolution_reasoning" text,
  "refund_cents" integer DEFAULT 0,
  "credit_cents" integer DEFAULT 0,
  "resolved_at" timestamptz,
  "upgrade_charge_cents" integer NOT NULL,
  "escrow_status" text DEFAULT 'HELD'::text NOT NULL,
  "stripe_refund_id" text,
  "upgrade_charged_at" timestamptz NOT NULL,
  "dispute_window_expires_at" timestamptz NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "sla_day3_sent_at" timestamptz,
  "sla_day5_sent_at" timestamptz,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."master_inspector_reviews_log" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "dispute_id" uuid NOT NULL,
  "master_inspector_id" uuid NOT NULL,
  "decision" public.dispute_status NOT NULL,
  "reasoning" text NOT NULL,
  "review_duration_seconds" integer,
  "payout_cents" integer DEFAULT 5000 NOT NULL,
  "payout_status" text DEFAULT 'PENDING'::text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."platform_settings" (
  "key" text NOT NULL,
  "value" text DEFAULT 'false'::text NOT NULL,
  "updated_at" timestamptz DEFAULT now(),
  PRIMARY KEY (key)
);

CREATE TABLE IF NOT EXISTS public."problem_reports" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "page_url" text NOT NULL,
  "description" text NOT NULL,
  "screenshot_path" text,
  "user_id" uuid,
  "user_email" text,
  "user_role" text,
  "status" text DEFAULT 'OPEN'::text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT "problem_reports_status_check" CHECK ((status = ANY (ARRAY['OPEN'::text, 'RESOLVED'::text])))
);

CREATE TABLE IF NOT EXISTS public."profiles" (
  "id" uuid NOT NULL,
  "role" public.role_type NOT NULL,
  "display_name" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "contractor_public_name" text,
  "company_name" text,
  "service_categories" jsonb,
  "service_area" text,
  "years_experience" integer,
  "about" text,
  "license_verified" boolean DEFAULT false NOT NULL,
  "insurance_verified" boolean DEFAULT false NOT NULL,
  "vet_cert_status" public.vet_cert_status DEFAULT 'NOT_APPLIED'::vet_cert_status NOT NULL,
  "vet_cert_verified_at" timestamptz,
  "vet_cert_verified_by" uuid,
  "vet_cert_next_recheck_at" timestamptz,
  "vet_cert_notes" text,
  "inspector_employee_id" text,
  "inspector_active" boolean DEFAULT true NOT NULL,
  "phone" text,
  "address_line1" text,
  "address_line2" text,
  "address_city" text,
  "address_state" text,
  "address_zip" text,
  "deactivated" boolean DEFAULT false,
  "is_master_inspector" boolean DEFAULT false NOT NULL,
  "master_inspector_since" timestamptz,
  "master_inspector_regions" text[],
  "upgrade_blocked" boolean DEFAULT false NOT NULL,
  "upgrade_stripe_payment_intent_id" text,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."project_attachments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid NOT NULL,
  "revision_id" uuid,
  "uploaded_by" uuid NOT NULL,
  "storage_path" text NOT NULL,
  "file_type" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."project_awards" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid NOT NULL,
  "awarded_contractor_id" uuid NOT NULL,
  "awarded_bid_version_id" uuid NOT NULL,
  "awarded_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" uuid NOT NULL,
  "bid_id" uuid,
  "contractor_id" uuid,
  "awarded_by" uuid,
  PRIMARY KEY (id),
  CONSTRAINT "project_awards_project_id_key" UNIQUE (project_id)
);

CREATE TABLE IF NOT EXISTS public."project_inspector_assignments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid NOT NULL,
  "inspector_id" uuid,
  "assigned_at" timestamptz DEFAULT now() NOT NULL,
  "unassigned_at" timestamptz,
  "is_takeoff_provider" boolean DEFAULT true NOT NULL,
  "notes" text,
  "requested_at" timestamptz,
  "request_status" text DEFAULT 'PENDING'::text,
  "takeoff_report" text,
  "takeoff_completed_at" timestamptz,
  "client_id" uuid,
  "pricing_key" text,
  "fee_charged_cents" integer,
  "inspector_share_cents" integer,
  "onp_share_cents" integer,
  "stripe_payment_intent_id" text,
  "payment_status" text DEFAULT 'PENDING'::text NOT NULL,
  "upgrade_payment_status" text DEFAULT 'NONE'::text NOT NULL,
  "upgrade_justification" text,
  "upgrade_requested_at" timestamptz,
  "upgrade_charged_at" timestamptz,
  "upgrade_fee_cents" integer,
  "upgrade_stripe_session_id" text,
  "upgrade_stripe_payment_intent_id" text,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."project_message_reads" (
  "project_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "last_read_at" timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS public."project_messages" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid NOT NULL,
  "sender_id" uuid NOT NULL,
  "sender_role" text NOT NULL,
  "body" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "notification_sent" boolean DEFAULT false NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT "project_messages_body_check" CHECK ((length(TRIM(BOTH FROM body)) > 0)),
  CONSTRAINT "project_messages_sender_role_check" CHECK ((sender_role = ANY (ARRAY['CLIENT'::text, 'CONTRACTOR'::text, 'ADMIN'::text])))
);

CREATE TABLE IF NOT EXISTS public."project_revisions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid NOT NULL,
  "revision_number" integer NOT NULL,
  "created_by" uuid NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "change_summary" text,
  "is_scope_change" boolean DEFAULT true NOT NULL,
  "deadline_extension_applied" boolean DEFAULT false NOT NULL,
  "new_deadline_at" timestamptz,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."project_services" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid NOT NULL,
  "service_type" public.service_type NOT NULL,
  "price_cents" integer NOT NULL,
  "status" text DEFAULT 'PENDING_PAYMENT'::text NOT NULL,
  "purchased_at" timestamptz,
  "provider_payment_id" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."projects" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "client_id" uuid NOT NULL,
  "state" public.project_state DEFAULT 'DRAFT'::project_state NOT NULL,
  "title" text NOT NULL,
  "category" text,
  "description" text,
  "location_general" text,
  "published_at" timestamptz,
  "deadline_at" timestamptz,
  "min_open_days" integer DEFAULT 5 NOT NULL,
  "max_open_days" integer DEFAULT 10 NOT NULL,
  "revision_number" integer DEFAULT 1 NOT NULL,
  "deadline_reset_count" integer DEFAULT 0 NOT NULL,
  "max_deadline_resets" integer DEFAULT 2 NOT NULL,
  "urgent_override" boolean DEFAULT false NOT NULL,
  "urgent_reason" text,
  "urgent_set_by" uuid,
  "uses_inspector_takeoff" boolean DEFAULT false NOT NULL,
  "inspector_assignment_id" uuid,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "city" text,
  "override_requested_at" timestamptz,
  "override_requested_reason" text,
  "override_requested_by" uuid,
  "zip_code" text,
  "emergency_bid_mode" boolean DEFAULT false,
  "is_emergency" boolean DEFAULT false NOT NULL,
  "emergency_paid_at" timestamptz,
  "emergency_payment_id" text,
  "emergency_auto_close_at" timestamptz,
  "emergency_admin_granted" boolean DEFAULT false NOT NULL,
  "inspector_hold_started_at" timestamptz,
  "target_start_date" date,
  "completion_requested_at" timestamptz,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."rfi_catalog" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "code" text NOT NULL,
  "prompt" text NOT NULL,
  "requires_upload_type" text,
  PRIMARY KEY (id),
  CONSTRAINT "rfi_catalog_code_key" UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS public."rfis" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid NOT NULL,
  "contractor_id" uuid,
  "revision_number" integer NOT NULL,
  "catalog_id" uuid NOT NULL,
  "status" text DEFAULT 'SENT'::text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "question" text,
  "response" text,
  "responded_at" timestamptz,
  "responded_by" uuid,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."subscription_disputes" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "stripe_dispute_id" text NOT NULL,
  "stripe_payment_intent_id" text,
  "stripe_customer_id" text,
  "contractor_id" uuid,
  "amount_cents" bigint,
  "currency" text,
  "reason" text,
  "stripe_status" text,
  "status" text DEFAULT 'OPEN'::text NOT NULL,
  "admin_note" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "resolved_at" timestamptz,
  "resolved_by" uuid,
  PRIMARY KEY (id),
  CONSTRAINT "subscription_disputes_stripe_dispute_id_key" UNIQUE (stripe_dispute_id),
  CONSTRAINT "subscription_disputes_status_check" CHECK ((status = ANY (ARRAY['OPEN'::text, 'RESOLVED'::text])))
);

CREATE TABLE IF NOT EXISTS public."support_requests" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "created_by" uuid NOT NULL,
  "project_id" uuid,
  "type" text NOT NULL,
  "status" public.support_status DEFAULT 'OPEN'::support_status NOT NULL,
  "assigned_to" uuid,
  "subject" text NOT NULL,
  "description" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id)
);

-- ============================================================================
-- SECTION: CONSTRAINTS
-- ============================================================================
-- All 65 foreign keys, added here (after every table in SECTION: TABLES
-- already exists) rather than inline, so table-creation order never
-- matters. Also includes the 1 UNIQUE constraint(s) whose
-- columns exactly duplicate their table's own PRIMARY KEY (see SECTION:
-- TABLES for why those can't be declared inline). Each statement here is
-- individually guarded via a pg_constraint existence check -- purely
-- additive, nothing is ever dropped or replaced, and this can never alter
-- an existing production constraint's behavior since it only runs when
-- the named constraint doesn't already exist.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_actions_admin_id_fkey' AND conrelid = 'public.admin_actions'::regclass
  ) THEN
    ALTER TABLE public."admin_actions" ADD CONSTRAINT "admin_actions_admin_id_fkey" FOREIGN KEY (admin_id) REFERENCES auth.users(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_actions_target_user_id_fkey' AND conrelid = 'public.admin_actions'::regclass
  ) THEN
    ALTER TABLE public."admin_actions" ADD CONSTRAINT "admin_actions_target_user_id_fkey" FOREIGN KEY (target_user_id) REFERENCES auth.users(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'audit_log_actor_id_fkey' AND conrelid = 'public.audit_log'::regclass
  ) THEN
    ALTER TABLE public."audit_log" ADD CONSTRAINT "audit_log_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES profiles(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bid_dismissals_project_id_fkey' AND conrelid = 'public.bid_dismissals'::regclass
  ) THEN
    ALTER TABLE public."bid_dismissals" ADD CONSTRAINT "bid_dismissals_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bid_dismissals_bid_id_fkey' AND conrelid = 'public.bid_dismissals'::regclass
  ) THEN
    ALTER TABLE public."bid_dismissals" ADD CONSTRAINT "bid_dismissals_bid_id_fkey" FOREIGN KEY (bid_id) REFERENCES bids(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bid_dismissals_reason_code_fkey' AND conrelid = 'public.bid_dismissals'::regclass
  ) THEN
    ALTER TABLE public."bid_dismissals" ADD CONSTRAINT "bid_dismissals_reason_code_fkey" FOREIGN KEY (reason_code) REFERENCES bid_dismissal_reasons(code);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bid_line_items_bid_version_id_fkey' AND conrelid = 'public.bid_line_items'::regclass
  ) THEN
    ALTER TABLE public."bid_line_items" ADD CONSTRAINT "bid_line_items_bid_version_id_fkey" FOREIGN KEY (bid_version_id) REFERENCES bid_versions(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bid_versions_bid_id_fkey' AND conrelid = 'public.bid_versions'::regclass
  ) THEN
    ALTER TABLE public."bid_versions" ADD CONSTRAINT "bid_versions_bid_id_fkey" FOREIGN KEY (bid_id) REFERENCES bids(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bids_project_id_fkey' AND conrelid = 'public.bids'::regclass
  ) THEN
    ALTER TABLE public."bids" ADD CONSTRAINT "bids_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bids_contractor_id_fkey' AND conrelid = 'public.bids'::regclass
  ) THEN
    ALTER TABLE public."bids" ADD CONSTRAINT "bids_contractor_id_fkey" FOREIGN KEY (contractor_id) REFERENCES profiles(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_credits_client_id_fkey' AND conrelid = 'public.client_credits'::regclass
  ) THEN
    ALTER TABLE public."client_credits" ADD CONSTRAINT "client_credits_client_id_fkey" FOREIGN KEY (client_id) REFERENCES auth.users(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contractor_credentials_contractor_id_fkey' AND conrelid = 'public.contractor_credentials'::regclass
  ) THEN
    ALTER TABLE public."contractor_credentials" ADD CONSTRAINT "contractor_credentials_contractor_id_fkey" FOREIGN KEY (contractor_id) REFERENCES contractor_profiles(contractor_id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contractor_directory_public_contractor_id_fkey' AND conrelid = 'public.contractor_directory_public'::regclass
  ) THEN
    ALTER TABLE public."contractor_directory_public" ADD CONSTRAINT "contractor_directory_public_contractor_id_fkey" FOREIGN KEY (contractor_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contractor_portfolio_photos_contractor_id_fkey' AND conrelid = 'public.contractor_portfolio_photos'::regclass
  ) THEN
    ALTER TABLE public."contractor_portfolio_photos" ADD CONSTRAINT "contractor_portfolio_photos_contractor_id_fkey" FOREIGN KEY (contractor_id) REFERENCES contractor_profiles(contractor_id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contractor_profiles_veteran_verified_by_fkey' AND conrelid = 'public.contractor_profiles'::regclass
  ) THEN
    ALTER TABLE public."contractor_profiles" ADD CONSTRAINT "contractor_profiles_veteran_verified_by_fkey" FOREIGN KEY (veteran_verified_by) REFERENCES profiles(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contractor_profiles_contractor_id_fkey' AND conrelid = 'public.contractor_profiles'::regclass
  ) THEN
    ALTER TABLE public."contractor_profiles" ADD CONSTRAINT "contractor_profiles_contractor_id_fkey" FOREIGN KEY (contractor_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contractor_settings_contractor_id_fkey' AND conrelid = 'public.contractor_settings'::regclass
  ) THEN
    ALTER TABLE public."contractor_settings" ADD CONSTRAINT "contractor_settings_contractor_id_fkey" FOREIGN KEY (contractor_id) REFERENCES auth.users(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contractor_subscriptions_contractor_id_fkey' AND conrelid = 'public.contractor_subscriptions'::regclass
  ) THEN
    ALTER TABLE public."contractor_subscriptions" ADD CONSTRAINT "contractor_subscriptions_contractor_id_fkey" FOREIGN KEY (contractor_id) REFERENCES profiles(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contractor_verification_log_admin_id_fkey' AND conrelid = 'public.contractor_verification_log'::regclass
  ) THEN
    ALTER TABLE public."contractor_verification_log" ADD CONSTRAINT "contractor_verification_log_admin_id_fkey" FOREIGN KEY (admin_id) REFERENCES auth.users(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'coupon_codes_created_by_fkey' AND conrelid = 'public.coupon_codes'::regclass
  ) THEN
    ALTER TABLE public."coupon_codes" ADD CONSTRAINT "coupon_codes_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'disclaimer_acknowledgments_user_id_fkey' AND conrelid = 'public.disclaimer_acknowledgments'::regclass
  ) THEN
    ALTER TABLE public."disclaimer_acknowledgments" ADD CONSTRAINT "disclaimer_acknowledgments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'emergency_request_log_client_id_fkey' AND conrelid = 'public.emergency_request_log'::regclass
  ) THEN
    ALTER TABLE public."emergency_request_log" ADD CONSTRAINT "emergency_request_log_client_id_fkey" FOREIGN KEY (client_id) REFERENCES auth.users(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'emergency_request_log_admin_granted_by_fkey' AND conrelid = 'public.emergency_request_log'::regclass
  ) THEN
    ALTER TABLE public."emergency_request_log" ADD CONSTRAINT "emergency_request_log_admin_granted_by_fkey" FOREIGN KEY (admin_granted_by) REFERENCES auth.users(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'emergency_request_log_project_id_fkey' AND conrelid = 'public.emergency_request_log'::regclass
  ) THEN
    ALTER TABLE public."emergency_request_log" ADD CONSTRAINT "emergency_request_log_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inspector_flags_inspector_id_fkey' AND conrelid = 'public.inspector_flags'::regclass
  ) THEN
    ALTER TABLE public."inspector_flags" ADD CONSTRAINT "inspector_flags_inspector_id_fkey" FOREIGN KEY (inspector_id) REFERENCES auth.users(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inspector_flags_dispute_id_fkey' AND conrelid = 'public.inspector_flags'::regclass
  ) THEN
    ALTER TABLE public."inspector_flags" ADD CONSTRAINT "inspector_flags_dispute_id_fkey" FOREIGN KEY (dispute_id) REFERENCES inspector_upgrade_disputes(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inspector_responses_revision_id_fkey' AND conrelid = 'public.inspector_responses'::regclass
  ) THEN
    ALTER TABLE public."inspector_responses" ADD CONSTRAINT "inspector_responses_revision_id_fkey" FOREIGN KEY (revision_id) REFERENCES project_revisions(id) ON DELETE SET NULL;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inspector_responses_inspector_rfi_id_fkey' AND conrelid = 'public.inspector_responses'::regclass
  ) THEN
    ALTER TABLE public."inspector_responses" ADD CONSTRAINT "inspector_responses_inspector_rfi_id_fkey" FOREIGN KEY (inspector_rfi_id) REFERENCES inspector_rfis(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inspector_responses_attachment_id_fkey' AND conrelid = 'public.inspector_responses'::regclass
  ) THEN
    ALTER TABLE public."inspector_responses" ADD CONSTRAINT "inspector_responses_attachment_id_fkey" FOREIGN KEY (attachment_id) REFERENCES project_attachments(id) ON DELETE SET NULL;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inspector_rfis_catalog_id_fkey' AND conrelid = 'public.inspector_rfis'::regclass
  ) THEN
    ALTER TABLE public."inspector_rfis" ADD CONSTRAINT "inspector_rfis_catalog_id_fkey" FOREIGN KEY (catalog_id) REFERENCES inspector_rfi_catalog(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inspector_rfis_inspector_id_fkey' AND conrelid = 'public.inspector_rfis'::regclass
  ) THEN
    ALTER TABLE public."inspector_rfis" ADD CONSTRAINT "inspector_rfis_inspector_id_fkey" FOREIGN KEY (inspector_id) REFERENCES profiles(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inspector_rfis_contractor_id_fkey' AND conrelid = 'public.inspector_rfis'::regclass
  ) THEN
    ALTER TABLE public."inspector_rfis" ADD CONSTRAINT "inspector_rfis_contractor_id_fkey" FOREIGN KEY (contractor_id) REFERENCES profiles(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inspector_rfis_project_id_fkey' AND conrelid = 'public.inspector_rfis'::regclass
  ) THEN
    ALTER TABLE public."inspector_rfis" ADD CONSTRAINT "inspector_rfis_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inspector_upgrade_disputes_inspector_request_id_fkey' AND conrelid = 'public.inspector_upgrade_disputes'::regclass
  ) THEN
    ALTER TABLE public."inspector_upgrade_disputes" ADD CONSTRAINT "inspector_upgrade_disputes_inspector_request_id_fkey" FOREIGN KEY (inspector_request_id) REFERENCES project_inspector_assignments(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inspector_upgrade_disputes_master_inspector_id_fkey' AND conrelid = 'public.inspector_upgrade_disputes'::regclass
  ) THEN
    ALTER TABLE public."inspector_upgrade_disputes" ADD CONSTRAINT "inspector_upgrade_disputes_master_inspector_id_fkey" FOREIGN KEY (master_inspector_id) REFERENCES auth.users(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inspector_upgrade_disputes_original_inspector_id_fkey' AND conrelid = 'public.inspector_upgrade_disputes'::regclass
  ) THEN
    ALTER TABLE public."inspector_upgrade_disputes" ADD CONSTRAINT "inspector_upgrade_disputes_original_inspector_id_fkey" FOREIGN KEY (original_inspector_id) REFERENCES auth.users(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inspector_upgrade_disputes_client_id_fkey' AND conrelid = 'public.inspector_upgrade_disputes'::regclass
  ) THEN
    ALTER TABLE public."inspector_upgrade_disputes" ADD CONSTRAINT "inspector_upgrade_disputes_client_id_fkey" FOREIGN KEY (client_id) REFERENCES auth.users(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inspector_upgrade_disputes_project_id_fkey' AND conrelid = 'public.inspector_upgrade_disputes'::regclass
  ) THEN
    ALTER TABLE public."inspector_upgrade_disputes" ADD CONSTRAINT "inspector_upgrade_disputes_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'master_inspector_reviews_log_master_inspector_id_fkey' AND conrelid = 'public.master_inspector_reviews_log'::regclass
  ) THEN
    ALTER TABLE public."master_inspector_reviews_log" ADD CONSTRAINT "master_inspector_reviews_log_master_inspector_id_fkey" FOREIGN KEY (master_inspector_id) REFERENCES auth.users(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'master_inspector_reviews_log_dispute_id_fkey' AND conrelid = 'public.master_inspector_reviews_log'::regclass
  ) THEN
    ALTER TABLE public."master_inspector_reviews_log" ADD CONSTRAINT "master_inspector_reviews_log_dispute_id_fkey" FOREIGN KEY (dispute_id) REFERENCES inspector_upgrade_disputes(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_vet_cert_verified_by_fkey' AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_vet_cert_verified_by_fkey" FOREIGN KEY (vet_cert_verified_by) REFERENCES profiles(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_attachments_uploaded_by_fkey' AND conrelid = 'public.project_attachments'::regclass
  ) THEN
    ALTER TABLE public."project_attachments" ADD CONSTRAINT "project_attachments_uploaded_by_fkey" FOREIGN KEY (uploaded_by) REFERENCES profiles(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_attachments_project_id_fkey' AND conrelid = 'public.project_attachments'::regclass
  ) THEN
    ALTER TABLE public."project_attachments" ADD CONSTRAINT "project_attachments_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_attachments_revision_id_fkey' AND conrelid = 'public.project_attachments'::regclass
  ) THEN
    ALTER TABLE public."project_attachments" ADD CONSTRAINT "project_attachments_revision_id_fkey" FOREIGN KEY (revision_id) REFERENCES project_revisions(id) ON DELETE SET NULL;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_awards_created_by_fkey' AND conrelid = 'public.project_awards'::regclass
  ) THEN
    ALTER TABLE public."project_awards" ADD CONSTRAINT "project_awards_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_awards_awarded_bid_version_id_fkey' AND conrelid = 'public.project_awards'::regclass
  ) THEN
    ALTER TABLE public."project_awards" ADD CONSTRAINT "project_awards_awarded_bid_version_id_fkey" FOREIGN KEY (awarded_bid_version_id) REFERENCES bid_versions(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_awards_awarded_contractor_id_fkey' AND conrelid = 'public.project_awards'::regclass
  ) THEN
    ALTER TABLE public."project_awards" ADD CONSTRAINT "project_awards_awarded_contractor_id_fkey" FOREIGN KEY (awarded_contractor_id) REFERENCES profiles(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_awards_project_id_fkey' AND conrelid = 'public.project_awards'::regclass
  ) THEN
    ALTER TABLE public."project_awards" ADD CONSTRAINT "project_awards_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_inspector_assignments_pricing_key_fkey' AND conrelid = 'public.project_inspector_assignments'::regclass
  ) THEN
    ALTER TABLE public."project_inspector_assignments" ADD CONSTRAINT "project_inspector_assignments_pricing_key_fkey" FOREIGN KEY (pricing_key) REFERENCES inspector_price_list(pricing_key);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_inspector_assignments_project_id_fkey' AND conrelid = 'public.project_inspector_assignments'::regclass
  ) THEN
    ALTER TABLE public."project_inspector_assignments" ADD CONSTRAINT "project_inspector_assignments_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_inspector_assignments_inspector_id_fkey' AND conrelid = 'public.project_inspector_assignments'::regclass
  ) THEN
    ALTER TABLE public."project_inspector_assignments" ADD CONSTRAINT "project_inspector_assignments_inspector_id_fkey" FOREIGN KEY (inspector_id) REFERENCES profiles(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_message_reads_project_id_fkey' AND conrelid = 'public.project_message_reads'::regclass
  ) THEN
    ALTER TABLE public."project_message_reads" ADD CONSTRAINT "project_message_reads_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_messages_project_id_fkey' AND conrelid = 'public.project_messages'::regclass
  ) THEN
    ALTER TABLE public."project_messages" ADD CONSTRAINT "project_messages_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_revisions_project_id_fkey' AND conrelid = 'public.project_revisions'::regclass
  ) THEN
    ALTER TABLE public."project_revisions" ADD CONSTRAINT "project_revisions_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_revisions_created_by_fkey' AND conrelid = 'public.project_revisions'::regclass
  ) THEN
    ALTER TABLE public."project_revisions" ADD CONSTRAINT "project_revisions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_services_project_id_fkey' AND conrelid = 'public.project_services'::regclass
  ) THEN
    ALTER TABLE public."project_services" ADD CONSTRAINT "project_services_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_urgent_set_by_fkey' AND conrelid = 'public.projects'::regclass
  ) THEN
    ALTER TABLE public."projects" ADD CONSTRAINT "projects_urgent_set_by_fkey" FOREIGN KEY (urgent_set_by) REFERENCES profiles(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_client_id_fkey' AND conrelid = 'public.projects'::regclass
  ) THEN
    ALTER TABLE public."projects" ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY (client_id) REFERENCES profiles(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rfis_project_id_fkey' AND conrelid = 'public.rfis'::regclass
  ) THEN
    ALTER TABLE public."rfis" ADD CONSTRAINT "rfis_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rfis_contractor_id_fkey' AND conrelid = 'public.rfis'::regclass
  ) THEN
    ALTER TABLE public."rfis" ADD CONSTRAINT "rfis_contractor_id_fkey" FOREIGN KEY (contractor_id) REFERENCES profiles(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rfis_catalog_id_fkey' AND conrelid = 'public.rfis'::regclass
  ) THEN
    ALTER TABLE public."rfis" ADD CONSTRAINT "rfis_catalog_id_fkey" FOREIGN KEY (catalog_id) REFERENCES rfi_catalog(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'support_requests_project_id_fkey' AND conrelid = 'public.support_requests'::regclass
  ) THEN
    ALTER TABLE public."support_requests" ADD CONSTRAINT "support_requests_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'support_requests_created_by_fkey' AND conrelid = 'public.support_requests'::regclass
  ) THEN
    ALTER TABLE public."support_requests" ADD CONSTRAINT "support_requests_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'support_requests_assigned_to_fkey' AND conrelid = 'public.support_requests'::regclass
  ) THEN
    ALTER TABLE public."support_requests" ADD CONSTRAINT "support_requests_assigned_to_fkey" FOREIGN KEY (assigned_to) REFERENCES profiles(id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contractor_directory_public_contractor_id_key' AND conrelid = 'public.contractor_directory_public'::regclass
  ) THEN
    ALTER TABLE public."contractor_directory_public" ADD CONSTRAINT "contractor_directory_public_contractor_id_key" UNIQUE (contractor_id);
  END IF;
END $$;

-- ============================================================================
-- SECTION: EARLIER-MIGRATION BACKFILL
-- ============================================================================
-- Found during an independent-review comparison of migrations 001-015
-- against live captured truth: disclaimer_acknowledgments.project_id
-- exists in production but is not created by 001_emergency_bid.sql (the
-- only migration that otherwise defines this table). This means if 001
-- alone were ever (re-)applied to a database that doesn't already have
-- this column, the table would be missing it, since 016's own
-- CREATE TABLE IF NOT EXISTS above no-ops once the table already exists
-- from 001. Backfilled here defensively, via native idempotent
-- ADD COLUMN IF NOT EXISTS -- this never touches production (which
-- already has the column) and never overwrites or removes anything.
ALTER TABLE public.disclaimer_acknowledgments
  ADD COLUMN IF NOT EXISTS project_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'disclaimer_acknowledgments_project_id_fkey' AND conrelid = 'public.disclaimer_acknowledgments'::regclass
  ) THEN
    ALTER TABLE public.disclaimer_acknowledgments ADD CONSTRAINT "disclaimer_acknowledgments_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id);
  END IF;
END $$;

-- ============================================================================
-- SECTION: FUNCTIONS
-- ============================================================================
-- CREATE OR REPLACE FUNCTION is natively idempotent. Bodies below are
-- verbatim from pg_get_functiondef(), not retyped by hand.

CREATE OR REPLACE FUNCTION public.auth_uid_owns_project(p_project_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM projects
    WHERE id = p_project_id AND client_id = auth.uid()
  );
$function$
;
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
begin
  -- who is calling?
  select role::text into v_role
  from public.profiles
  where id = auth.uid();

  if v_role is null then
    raise exception 'Not authenticated';
  end if;

  -- load project
  select client_id, deadline_at, state::text
    into v_client_id, v_deadline, v_state
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
  select bv.id
    into v_awarded_bid_version_id
  from public.bid_versions bv
  where bv.bid_id = p_bid_id
  order by bv.version_number desc
  limit 1;

  if v_awarded_bid_version_id is null then
    raise exception 'Cannot award: bid has no versions';
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
$function$
;
CREATE OR REPLACE FUNCTION public.clone_project_as_draft(p_project_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_client_id uuid;
  v_new_id uuid;
begin
  select client_id into v_client_id
  from public.projects
  where id = p_project_id;

  if v_client_id is null then
    raise exception 'Project not found';
  end if;

  if v_client_id <> auth.uid() and not is_admin() then
    raise exception 'Forbidden';
  end if;

  insert into public.projects (
    client_id,
    state,
    title,
    category,
    description,
    location_general,
    city,
    min_open_days,
    max_open_days,
    revision_number,
    deadline_reset_count,
    max_deadline_resets,
    urgent_override,
    urgent_reason,
    urgent_set_by,
    uses_inspector_takeoff,
    published_at,
    deadline_at
  )
  select
    client_id,
    'DRAFT'::project_state,
    title,
    category,
    description,
    location_general,
    city,
    min_open_days,
    max_open_days,
    0,
    0,
    max_deadline_resets,
    false,
    null,
    null,
    uses_inspector_takeoff,
    null,
    null
  from public.projects
  where id = p_project_id
  returning id into v_new_id;

  return v_new_id;
end;
$function$
;
CREATE OR REPLACE FUNCTION public."current_role"()
 RETURNS text
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select role::text from public.profiles where id = auth.uid()
$function$
;
CREATE OR REPLACE FUNCTION public.get_awarded_project_client_info(p_project_id uuid)
 RETURNS TABLE(client_name text, client_phone text, client_email text, client_address text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    pr.display_name as client_name,
    pr.phone as client_phone,
    au.email as client_email,
    concat_ws(', ',
      pr.address_line1,
      pr.address_city,
      pr.address_state,
      pr.address_zip
    ) as client_address
  from public.project_awards pa
  join public.projects p on p.id = pa.project_id
  join public.profiles pr on pr.id = p.client_id
  join auth.users au on au.id = p.client_id
  where pa.project_id = p_project_id
    and pa.awarded_contractor_id = auth.uid();
$function$
;
CREATE OR REPLACE FUNCTION public.get_inspector_flag_status(p_inspector_id uuid)
 RETURNS TABLE(inspector_id uuid, flags_12mo bigint, inspections_12mo bigint, flag_rate numeric, status text, last_flag_at timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with
    cutoff as (select now() - interval '12 months' as ts),
    flags as (
      select count(*) as cnt, max(f.created_at) as last_at
      from inspector_flags f
      where f.inspector_id = p_inspector_id
        and f.created_at >= (select ts from cutoff)
    ),
    inspections as (
      select count(*) as cnt
      from project_inspector_assignments a
      where a.inspector_id = p_inspector_id
        and a.request_status = 'COMPLETED'
        and a.takeoff_completed_at >= (select ts from cutoff)
    )
  select
    p_inspector_id,
    flags.cnt,
    inspections.cnt,
    case when inspections.cnt > 0
      then round(flags.cnt::numeric / inspections.cnt::numeric, 4)
      else 0::numeric
    end,
    case
      when inspections.cnt < 10 then
        case when flags.cnt >= 2 then 'SOFT_ALERT' else 'OK' end
      when inspections.cnt > 0 and
           (flags.cnt::numeric / inspections.cnt::numeric) >= 0.15 and flags.cnt >= 3
        then 'SUSPENSION_RECOMMENDED'
      when inspections.cnt > 0 and
           (flags.cnt::numeric / inspections.cnt::numeric) >= 0.10 and flags.cnt >= 3
        then 'MANDATORY_REVIEW'
      when inspections.cnt > 0 and
           (flags.cnt::numeric / inspections.cnt::numeric) >= 0.05 and flags.cnt >= 2
        then 'SOFT_ALERT'
      else 'OK'
    end,
    flags.last_at
  from flags, inspections;
$function$
;
CREATE OR REPLACE FUNCTION public.get_open_project_detail(p_project_id uuid)
 RETURNS TABLE(id uuid, title text, description text, category text, location_general text, state text, deadline_at timestamp with time zone, published_at timestamp with time zone, revision_number integer, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with me as (
    select role::text as role_txt
    from public.profiles
    where id = auth.uid()
  )
  select
    p.id,
    p.title,
    p.description,
    p.category::text,
    p.location_general,
    p.state::text,
    p.deadline_at,
    p.published_at,
    p.revision_number,
    p.created_at,
    p.updated_at
  from public.projects p
  cross join me
  where me.role_txt in ('CONTRACTOR', 'ADMIN')
    and p.id = p_project_id
    and (
      p.state = 'OPEN'
      or exists (
        select 1 from public.project_awards pa
        where pa.project_id = p.id
          and pa.awarded_contractor_id = auth.uid()
      )
    );
$function$
;
CREATE OR REPLACE FUNCTION public.get_open_project_window(p_project_id uuid)
 RETURNS TABLE(id uuid, state text, deadline_at timestamp with time zone, revision_number integer)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with me as (
    select role::text as role_txt
    from public.profiles
    where id = auth.uid()
  )
  select
    p.id,
    p.state::text as state,
    p.deadline_at,
    p.revision_number
  from public.projects p
  cross join me
  where me.role_txt in ('CONTRACTOR','ADMIN')
    and p.id = p_project_id;
$function$
;
CREATE OR REPLACE FUNCTION public.get_project_award_for_client(p_project_id uuid)
 RETURNS TABLE(project_id uuid, bid_id uuid, contractor_id uuid, awarded_at timestamp with time zone, contractor jsonb)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with me as (
    select
      auth.uid() as uid,
      (select role::text from public.profiles where id = auth.uid()) as role_txt
  ),
  proj as (
    select id, client_id
    from public.projects
    where id = p_project_id
  ),
  allowed as (
    select 1 as ok
    from me
    join proj on true
    where (proj.client_id = me.uid or me.role_txt = 'ADMIN')
  )
  select
    pa.project_id,
    pa.bid_id,
    pa.awarded_contractor_id as contractor_id,
    pa.awarded_at,
    (
      select jsonb_build_object(
        'business_name', cp.business_name,
        'city', cp.city,
        'state', cp.state,
        'veteran_verified', cp.veteran_verified
      )
      from public.contractor_profiles cp
      where cp.contractor_id = pa.awarded_contractor_id
      limit 1
    ) as contractor
  from public.project_awards pa
  join allowed a on true
  where pa.project_id = p_project_id
  limit 1;
$function$
;
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, role, display_name, company_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'signup_role', 'CLIENT')::role_type,
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'company_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'ADMIN'
  );
$function$
;
CREATE OR REPLACE FUNCTION public.is_admin_safe()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role::text = 'ADMIN'
  );
$function$
;
CREATE OR REPLACE FUNCTION public.is_within_dispute_window(p_inspector_request_id uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT dispute_window_expires_at >= now()
     FROM public.inspector_upgrade_disputes
     WHERE inspector_request_id = p_inspector_request_id
     LIMIT 1),
    (SELECT (upgrade_charged_at + INTERVAL '14 days') >= now()
     FROM public.project_inspector_assignments
     WHERE id = p_inspector_request_id
       AND upgrade_charged_at IS NOT NULL
     LIMIT 1),
    false
  );
$function$
;
CREATE OR REPLACE FUNCTION public.list_my_active_bids()
 RETURNS TABLE(project_id uuid, project_title text, category text, location_general text, deadline_at timestamp with time zone, project_state text, bid_id uuid, latest_amount_cents bigint, version_number integer, bid_updated_at timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with my_bids as (
    select
      b.id as bid_id,
      b.project_id,
      b.updated_at
    from public.bids b
    where b.contractor_id = auth.uid()
  ),
  latest_versions as (
    select distinct on (bv.bid_id)
      bv.bid_id,
      bv.amount_cents,
      bv.version_number,
      bv.created_at
    from public.bid_versions bv
    order by bv.bid_id, bv.version_number desc
  )
  select
    p.id as project_id,
    p.title as project_title,
    p.category,
    p.location_general,
    p.deadline_at,
    p.state::text as project_state,
    mb.bid_id,
    lv.amount_cents,
    lv.version_number,
    mb.updated_at as bid_updated_at
  from my_bids mb
  join public.projects p on p.id = mb.project_id
  join latest_versions lv on lv.bid_id = mb.bid_id
  order by
    case when p.state = 'OPEN' then 0 else 1 end,
    p.deadline_at asc nulls last,
    mb.updated_at desc;
$function$
;
CREATE OR REPLACE FUNCTION public.list_my_awarded_projects()
 RETURNS TABLE(project_id uuid, project_title text, location_general text, category text, awarded_at timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    p.id as project_id,
    p.title as project_title,
    p.location_general,
    p.category,
    pa.awarded_at
  from public.project_awards pa
  join public.projects p on p.id = pa.project_id
  where pa.awarded_contractor_id = auth.uid()
  order by pa.awarded_at desc;
$function$
;
CREATE OR REPLACE FUNCTION public.list_open_projects(p_sort text DEFAULT 'deadline'::text)
 RETURNS TABLE(id uuid, title text, category text, location_general text, description text, published_at timestamp with time zone, deadline_at timestamp with time zone, min_open_days integer, max_open_days integer)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with me as (
    select p.role::text as role_txt
    from public.profiles p
    where p.id = auth.uid()
  )
  select
    pr.id,
    pr.title,
    pr.category,
    pr.location_general,
    pr.description,
    pr.published_at,
    pr.deadline_at,
    pr.min_open_days,
    pr.max_open_days
  from public.projects pr
  cross join me
  where me.role_txt in ('CONTRACTOR','ADMIN')
    and pr.state = 'OPEN'
    and pr.deadline_at > now()
  order by
    case when p_sort = 'newest' then pr.published_at end desc nulls last,
    case when p_sort <> 'newest' then pr.deadline_at end asc nulls last,
    pr.published_at desc nulls last,
    pr.deadline_at asc nulls last;
$function$
;
CREATE OR REPLACE FUNCTION public.list_project_bids_for_client(p_project_id uuid, p_min_cents bigint DEFAULT NULL::bigint, p_max_cents bigint DEFAULT NULL::bigint, p_sort text DEFAULT 'amount_asc'::text)
 RETURNS TABLE(bid_id uuid, amount_cents bigint, version_number integer, submitted_at timestamp with time zone, notes text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with me as (
    select
      auth.uid() as uid,
      (select role::text from public.profiles where id = auth.uid()) as role_txt
  ),
  proj as (
    select p.id, p.client_id, p.deadline_at, p.state::text as state_txt
    from public.projects p
    where p.id = p_project_id
  ),
  allowed as (
    select 1 as ok
    from me
    join proj on true
    where
      (proj.client_id = me.uid or me.role_txt = 'ADMIN')
      and (
        (proj.deadline_at is not null and proj.deadline_at <= now())
        or proj.state_txt <> 'OPEN'
      )
  ),
  latest_versions as (
    select distinct on (bv.bid_id)
      bv.bid_id,
      bv.amount_cents,
      bv.version_number,
      bv.created_at as submitted_at,
      bv.notes
    from public.bid_versions bv
    join public.bids b on b.id = bv.bid_id
    where b.project_id = p_project_id
    order by bv.bid_id, bv.version_number desc
  )
  select
    lv.bid_id,
    lv.amount_cents,
    lv.version_number,
    lv.submitted_at,
    lv.notes
  from latest_versions lv
  join allowed a on true
  where
    (p_min_cents is null or lv.amount_cents >= p_min_cents)
    and (p_max_cents is null or lv.amount_cents <= p_max_cents)
  order by
    case when p_sort = 'amount_desc' then lv.amount_cents end desc nulls last,
    case when p_sort <> 'amount_desc' then lv.amount_cents end asc nulls last,
    lv.submitted_at desc;
$function$
;
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
      AND NOT EXISTS (
        SELECT 1 FROM public.project_awards pa
        WHERE pa.project_id = p.id
      )
  );
$function$
;
CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.sync_contractor_directory_public()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_public_name text;
begin
  -- Required field in contractor_directory_public
  v_public_name :=
    nullif(new.business_name, '');

  if v_public_name is null then
    -- fallback that is never null; avoids leaking identity
    v_public_name := 'Contractor';
  end if;

  insert into public.contractor_directory_public (
    contractor_id,
    contractor_public_name,
    business_name,
    city,
    state,
    veteran_verified,
    updated_at
  )
  values (
    new.contractor_id,
    v_public_name,
    new.business_name,
    new.city,
    new.state,
    new.veteran_verified,
    now()
  )
  on conflict (contractor_id)
  do update set
    contractor_public_name = excluded.contractor_public_name,
    business_name = excluded.business_name,
    city = excluded.city,
    state = excluded.state,
    veteran_verified = excluded.veteran_verified,
    updated_at = excluded.updated_at;

  return new;
end;
$function$
;

-- ============================================================================
-- SECTION: TRIGGERS
-- ============================================================================
-- No native CREATE TRIGGER IF NOT EXISTS (verified empirically). Guarded
-- via a pg_trigger existence check -- purely additive.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger tg
    JOIN pg_class c ON c.oid = tg.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'contractor_profiles' AND tg.tgname = 'contractor_profiles_set_updated_at' AND NOT tg.tgisinternal
  ) THEN
    CREATE TRIGGER contractor_profiles_set_updated_at BEFORE UPDATE ON public.contractor_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger tg
    JOIN pg_class c ON c.oid = tg.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'contractor_profiles' AND tg.tgname = 'contractor_profiles_sync_directory' AND NOT tg.tgisinternal
  ) THEN
    CREATE TRIGGER contractor_profiles_sync_directory AFTER INSERT OR UPDATE ON public.contractor_profiles FOR EACH ROW EXECUTE FUNCTION sync_contractor_directory_public();
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger tg
    JOIN pg_class c ON c.oid = tg.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'auth' AND c.relname = 'users' AND tg.tgname = 'on_auth_user_created' AND NOT tg.tgisinternal
  ) THEN
    CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
  END IF;
END $$;

-- ============================================================================
-- SECTION: RLS
-- ============================================================================
-- Enabling RLS is natively idempotent. Policies use the same catalog-guard
-- DO-block pattern as triggers (CREATE POLICY IF NOT EXISTS verified
-- empirically to not be valid syntax on this server).

ALTER TABLE public."admin_actions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."audit_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."bid_acknowledgments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."bid_dismissal_reasons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."bid_dismissals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."bid_line_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."bid_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."bids" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."client_credits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."contractor_credentials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."contractor_directory_public" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."contractor_portfolio_photos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."contractor_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."contractor_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."contractor_subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."contractor_verification_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."coupon_codes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."disclaimer_acknowledgments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."emergency_request_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."inspector_flags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."inspector_price_list" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."inspector_responses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."inspector_rfi_catalog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."inspector_rfis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."inspector_upgrade_disputes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."master_inspector_reviews_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."platform_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."problem_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."project_attachments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."project_awards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."project_inspector_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."project_message_reads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."project_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."project_revisions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."project_services" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."rfi_catalog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."rfis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."subscription_disputes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."support_requests" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_actions' AND policyname = 'admin_actions_admin_only'
  ) THEN
    CREATE POLICY "admin_actions_admin_only" ON public."admin_actions" FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::role_type)))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_actions' AND policyname = 'admins can read admin_actions'
  ) THEN
    CREATE POLICY "admins can read admin_actions" ON public."admin_actions" FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::role_type)))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_actions' AND policyname = 'admins_read_admin_actions'
  ) THEN
    CREATE POLICY "admins_read_admin_actions" ON public."admin_actions" FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::role_type)))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bid_acknowledgments' AND policyname = 'contractors can insert own acknowledgments'
  ) THEN
    CREATE POLICY "contractors can insert own acknowledgments" ON public."bid_acknowledgments" FOR INSERT TO authenticated WITH CHECK ((contractor_id = auth.uid()));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bid_dismissal_reasons' AND policyname = 'authenticated_read_dismissal_reasons'
  ) THEN
    CREATE POLICY "authenticated_read_dismissal_reasons" ON public."bid_dismissal_reasons" FOR SELECT TO authenticated USING (true);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bid_dismissals' AND policyname = 'client_insert_own_dismissals'
  ) THEN
    CREATE POLICY "client_insert_own_dismissals" ON public."bid_dismissals" FOR INSERT TO public WITH CHECK ((dismissed_by = auth.uid()));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bid_dismissals' AND policyname = 'client_read_own_dismissals'
  ) THEN
    CREATE POLICY "client_read_own_dismissals" ON public."bid_dismissals" FOR SELECT TO public USING (((dismissed_by = auth.uid()) OR (contractor_id = auth.uid())));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bid_line_items' AND policyname = 'contractor_manage_own_line_items'
  ) THEN
    CREATE POLICY "contractor_manage_own_line_items" ON public."bid_line_items" FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM (bid_versions bv
     JOIN bids b ON ((b.id = bv.bid_id)))
  WHERE ((bv.id = bid_line_items.bid_version_id) AND (b.contractor_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (bid_versions bv
     JOIN bids b ON ((b.id = bv.bid_id)))
  WHERE ((bv.id = bid_line_items.bid_version_id) AND (b.contractor_id = auth.uid())))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bid_versions' AND policyname = 'admins can read all bid_versions'
  ) THEN
    CREATE POLICY "admins can read all bid_versions" ON public."bid_versions" FOR SELECT TO public USING (is_admin_safe());
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bid_versions' AND policyname = 'bid_versions_insert_own'
  ) THEN
    CREATE POLICY "bid_versions_insert_own" ON public."bid_versions" FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM bids b
  WHERE ((b.id = bid_versions.bid_id) AND (b.contractor_id = auth.uid()) AND project_is_open_for_bidding(b.project_id)))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bid_versions' AND policyname = 'bid_versions_select_own'
  ) THEN
    CREATE POLICY "bid_versions_select_own" ON public."bid_versions" FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM bids b
  WHERE ((b.id = bid_versions.bid_id) AND (b.contractor_id = auth.uid())))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bids' AND policyname = 'admins can read all bids'
  ) THEN
    CREATE POLICY "admins can read all bids" ON public."bids" FOR SELECT TO public USING (is_admin_safe());
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bids' AND policyname = 'bids_insert_own'
  ) THEN
    CREATE POLICY "bids_insert_own" ON public."bids" FOR INSERT TO authenticated WITH CHECK (((contractor_id = auth.uid()) AND project_is_open_for_bidding(project_id)));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bids' AND policyname = 'bids_select_own'
  ) THEN
    CREATE POLICY "bids_select_own" ON public."bids" FOR SELECT TO authenticated USING ((contractor_id = auth.uid()));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bids' AND policyname = 'bids_update_own'
  ) THEN
    CREATE POLICY "bids_update_own" ON public."bids" FOR UPDATE TO authenticated USING ((contractor_id = auth.uid())) WITH CHECK (((contractor_id = auth.uid()) AND project_is_open_for_bidding(project_id)));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bids' AND policyname = 'clients can read bids for own projects'
  ) THEN
    CREATE POLICY "clients can read bids for own projects" ON public."bids" FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = bids.project_id) AND (p.client_id = auth.uid())))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'client_credits' AND policyname = 'admins see all credits'
  ) THEN
    CREATE POLICY "admins see all credits" ON public."client_credits" FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::role_type)))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'client_credits' AND policyname = 'clients see own credits'
  ) THEN
    CREATE POLICY "clients see own credits" ON public."client_credits" FOR SELECT TO public USING ((client_id = auth.uid()));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contractor_credentials' AND policyname = 'contractor_manage_own_credentials'
  ) THEN
    CREATE POLICY "contractor_manage_own_credentials" ON public."contractor_credentials" FOR ALL TO public USING ((contractor_id = auth.uid())) WITH CHECK ((contractor_id = auth.uid()));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contractor_credentials' AND policyname = 'public_read_verified_listed_contractor_credentials'
  ) THEN
    CREATE POLICY "public_read_verified_listed_contractor_credentials" ON public."contractor_credentials" FOR SELECT TO public USING (((verified = true) AND (EXISTS ( SELECT 1
   FROM contractor_profiles cp
  WHERE ((cp.contractor_id = contractor_credentials.contractor_id) AND (cp.is_listed = true) AND (cp.directory_verified = true))))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contractor_portfolio_photos' AND policyname = 'contractor_manage_own_portfolio_photos'
  ) THEN
    CREATE POLICY "contractor_manage_own_portfolio_photos" ON public."contractor_portfolio_photos" FOR ALL TO public USING ((contractor_id = auth.uid())) WITH CHECK ((contractor_id = auth.uid()));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contractor_portfolio_photos' AND policyname = 'public_read_listed_contractor_photos'
  ) THEN
    CREATE POLICY "public_read_listed_contractor_photos" ON public."contractor_portfolio_photos" FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM contractor_profiles cp
  WHERE ((cp.contractor_id = contractor_portfolio_photos.contractor_id) AND (cp.is_listed = true) AND (cp.directory_verified = true)))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contractor_profiles' AND policyname = 'contractor_profiles_admin_all'
  ) THEN
    CREATE POLICY "contractor_profiles_admin_all" ON public."contractor_profiles" FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contractor_profiles' AND policyname = 'contractor_profiles_insert_self'
  ) THEN
    CREATE POLICY "contractor_profiles_insert_self" ON public."contractor_profiles" FOR INSERT TO authenticated WITH CHECK ((contractor_id = auth.uid()));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contractor_profiles' AND policyname = 'contractor_profiles_public_select'
  ) THEN
    CREATE POLICY "contractor_profiles_public_select" ON public."contractor_profiles" FOR SELECT TO anon,authenticated USING ((is_listed = true));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contractor_profiles' AND policyname = 'contractor_profiles_select_self'
  ) THEN
    CREATE POLICY "contractor_profiles_select_self" ON public."contractor_profiles" FOR SELECT TO public USING ((contractor_id = auth.uid()));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contractor_profiles' AND policyname = 'contractor_profiles_update_self'
  ) THEN
    CREATE POLICY "contractor_profiles_update_self" ON public."contractor_profiles" FOR UPDATE TO authenticated USING ((contractor_id = auth.uid())) WITH CHECK ((contractor_id = auth.uid()));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contractor_settings' AND policyname = 'contractors_manage_own_settings'
  ) THEN
    CREATE POLICY "contractors_manage_own_settings" ON public."contractor_settings" FOR ALL TO public USING ((auth.uid() = contractor_id));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contractor_subscriptions' AND policyname = 'Contractors can read own subscription'
  ) THEN
    CREATE POLICY "Contractors can read own subscription" ON public."contractor_subscriptions" FOR SELECT TO public USING ((contractor_id = auth.uid()));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contractor_subscriptions' AND policyname = 'Service role can manage subscriptions'
  ) THEN
    CREATE POLICY "Service role can manage subscriptions" ON public."contractor_subscriptions" FOR ALL TO public USING ((auth.role() = 'service_role'::text));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contractor_verification_log' AND policyname = 'Admins can read verification log'
  ) THEN
    CREATE POLICY "Admins can read verification log" ON public."contractor_verification_log" FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::role_type)))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'coupon_codes' AND policyname = 'admins manage coupons'
  ) THEN
    CREATE POLICY "admins manage coupons" ON public."coupon_codes" FOR ALL TO public USING (is_admin_safe()) WITH CHECK (is_admin_safe());
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'coupon_codes' AND policyname = 'contractors read active coupons'
  ) THEN
    CREATE POLICY "contractors read active coupons" ON public."coupon_codes" FOR SELECT TO public USING ((is_active = true));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'disclaimer_acknowledgments' AND policyname = 'users_insert_own_disclaimers'
  ) THEN
    CREATE POLICY "users_insert_own_disclaimers" ON public."disclaimer_acknowledgments" FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'disclaimer_acknowledgments' AND policyname = 'users_select_own_disclaimers'
  ) THEN
    CREATE POLICY "users_select_own_disclaimers" ON public."disclaimer_acknowledgments" FOR SELECT TO public USING ((auth.uid() = user_id));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'emergency_request_log' AND policyname = 'admins_read_all_emergency_log'
  ) THEN
    CREATE POLICY "admins_read_all_emergency_log" ON public."emergency_request_log" FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::role_type)))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'emergency_request_log' AND policyname = 'clients_read_own_emergency_log'
  ) THEN
    CREATE POLICY "clients_read_own_emergency_log" ON public."emergency_request_log" FOR SELECT TO public USING ((auth.uid() = client_id));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'inspector_flags' AND policyname = 'admins see all flags'
  ) THEN
    CREATE POLICY "admins see all flags" ON public."inspector_flags" FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::role_type)))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'inspector_flags' AND policyname = 'inspectors see own flags'
  ) THEN
    CREATE POLICY "inspectors see own flags" ON public."inspector_flags" FOR SELECT TO public USING ((inspector_id = auth.uid()));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'inspector_price_list' AND policyname = 'admins can manage price list'
  ) THEN
    CREATE POLICY "admins can manage price list" ON public."inspector_price_list" FOR ALL TO public USING (is_admin_safe()) WITH CHECK (is_admin_safe());
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'inspector_price_list' AND policyname = 'anyone authenticated can read price list'
  ) THEN
    CREATE POLICY "anyone authenticated can read price list" ON public."inspector_price_list" FOR SELECT TO authenticated USING (true);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'inspector_upgrade_disputes' AND policyname = 'admins see all disputes'
  ) THEN
    CREATE POLICY "admins see all disputes" ON public."inspector_upgrade_disputes" FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::role_type)))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'inspector_upgrade_disputes' AND policyname = 'admins update all disputes'
  ) THEN
    CREATE POLICY "admins update all disputes" ON public."inspector_upgrade_disputes" FOR UPDATE TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::role_type)))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'inspector_upgrade_disputes' AND policyname = 'clients can file disputes within window'
  ) THEN
    CREATE POLICY "clients can file disputes within window" ON public."inspector_upgrade_disputes" FOR INSERT TO public WITH CHECK (((client_id = auth.uid()) AND is_within_dispute_window(inspector_request_id)));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'inspector_upgrade_disputes' AND policyname = 'clients can withdraw own disputes'
  ) THEN
    CREATE POLICY "clients can withdraw own disputes" ON public."inspector_upgrade_disputes" FOR UPDATE TO public USING ((client_id = auth.uid()));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'inspector_upgrade_disputes' AND policyname = 'clients see own disputes'
  ) THEN
    CREATE POLICY "clients see own disputes" ON public."inspector_upgrade_disputes" FOR SELECT TO public USING ((client_id = auth.uid()));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'inspector_upgrade_disputes' AND policyname = 'master inspectors see assigned disputes'
  ) THEN
    CREATE POLICY "master inspectors see assigned disputes" ON public."inspector_upgrade_disputes" FOR SELECT TO public USING ((master_inspector_id = auth.uid()));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'inspector_upgrade_disputes' AND policyname = 'master inspectors update assigned disputes'
  ) THEN
    CREATE POLICY "master inspectors update assigned disputes" ON public."inspector_upgrade_disputes" FOR UPDATE TO public USING ((master_inspector_id = auth.uid()));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'inspector_upgrade_disputes' AND policyname = 'original inspector can submit statement'
  ) THEN
    CREATE POLICY "original inspector can submit statement" ON public."inspector_upgrade_disputes" FOR UPDATE TO public USING ((original_inspector_id = auth.uid()));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'inspector_upgrade_disputes' AND policyname = 'original inspector sees their disputes'
  ) THEN
    CREATE POLICY "original inspector sees their disputes" ON public."inspector_upgrade_disputes" FOR SELECT TO public USING ((original_inspector_id = auth.uid()));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'master_inspector_reviews_log' AND policyname = 'admins see all review log'
  ) THEN
    CREATE POLICY "admins see all review log" ON public."master_inspector_reviews_log" FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::role_type)))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'master_inspector_reviews_log' AND policyname = 'master inspectors see own review log'
  ) THEN
    CREATE POLICY "master inspectors see own review log" ON public."master_inspector_reviews_log" FOR SELECT TO public USING ((master_inspector_id = auth.uid()));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'platform_settings' AND policyname = 'admin_only'
  ) THEN
    CREATE POLICY "admin_only" ON public."platform_settings" FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::role_type)))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_read_self'
  ) THEN
    CREATE POLICY "profiles_read_self" ON public."profiles" FOR SELECT TO authenticated USING ((id = auth.uid()));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_update_self'
  ) THEN
    CREATE POLICY "profiles_update_self" ON public."profiles" FOR UPDATE TO authenticated USING ((id = auth.uid())) WITH CHECK ((id = auth.uid()));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'project_awards' AND policyname = 'admins can manage project awards'
  ) THEN
    CREATE POLICY "admins can manage project awards" ON public."project_awards" FOR ALL TO public USING (is_admin_safe()) WITH CHECK (is_admin_safe());
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'project_awards' AND policyname = 'contractors can view own award'
  ) THEN
    CREATE POLICY "contractors can view own award" ON public."project_awards" FOR SELECT TO public USING ((contractor_id = auth.uid()));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'project_inspector_assignments' AND policyname = 'admins can manage assignments'
  ) THEN
    CREATE POLICY "admins can manage assignments" ON public."project_inspector_assignments" FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role)::text = 'ADMIN'::text)))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'project_inspector_assignments' AND policyname = 'clients can request inspectors'
  ) THEN
    CREATE POLICY "clients can request inspectors" ON public."project_inspector_assignments" FOR INSERT TO authenticated WITH CHECK (((client_id = auth.uid()) AND auth_uid_owns_project(project_id) AND (payment_status = 'PENDING'::text)));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'project_inspector_assignments' AND policyname = 'clients can view own assignments'
  ) THEN
    CREATE POLICY "clients can view own assignments" ON public."project_inspector_assignments" FOR SELECT TO authenticated USING (((client_id = auth.uid()) OR (inspector_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role)::text = 'ADMIN'::text))))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'project_inspector_assignments' AND policyname = 'inspectors can update assignments'
  ) THEN
    CREATE POLICY "inspectors can update assignments" ON public."project_inspector_assignments" FOR UPDATE TO authenticated USING ((inspector_id = auth.uid())) WITH CHECK ((inspector_id = auth.uid()));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'project_message_reads' AND policyname = 'user_manage_own_read_receipts'
  ) THEN
    CREATE POLICY "user_manage_own_read_receipts" ON public."project_message_reads" FOR ALL TO public USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'project_messages' AND policyname = 'admin_insert_messages'
  ) THEN
    CREATE POLICY "admin_insert_messages" ON public."project_messages" FOR INSERT TO public WITH CHECK (((sender_id = auth.uid()) AND (sender_role = 'ADMIN'::text) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::role_type))))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'project_messages' AND policyname = 'admin_read_all_messages'
  ) THEN
    CREATE POLICY "admin_read_all_messages" ON public."project_messages" FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::role_type)))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'project_messages' AND policyname = 'client_insert_messages'
  ) THEN
    CREATE POLICY "client_insert_messages" ON public."project_messages" FOR INSERT TO public WITH CHECK (((sender_id = auth.uid()) AND (sender_role = 'CLIENT'::text) AND (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_messages.project_id) AND (projects.client_id = auth.uid()) AND (projects.state = 'AWARDED'::project_state))))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'project_messages' AND policyname = 'client_read_own_project_messages'
  ) THEN
    CREATE POLICY "client_read_own_project_messages" ON public."project_messages" FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_messages.project_id) AND (projects.client_id = auth.uid())))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'project_messages' AND policyname = 'contractor_insert_messages'
  ) THEN
    CREATE POLICY "contractor_insert_messages" ON public."project_messages" FOR INSERT TO public WITH CHECK (((sender_id = auth.uid()) AND (sender_role = 'CONTRACTOR'::text) AND (EXISTS ( SELECT 1
   FROM project_awards
  WHERE ((project_awards.project_id = project_messages.project_id) AND (project_awards.contractor_id = auth.uid())))) AND (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_messages.project_id) AND (projects.state = 'AWARDED'::project_state))))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'project_messages' AND policyname = 'contractor_read_awarded_project_messages'
  ) THEN
    CREATE POLICY "contractor_read_awarded_project_messages" ON public."project_messages" FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM project_awards
  WHERE ((project_awards.project_id = project_messages.project_id) AND (project_awards.contractor_id = auth.uid())))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'projects' AND policyname = 'inspectors can read assigned projects'
  ) THEN
    CREATE POLICY "inspectors can read assigned projects" ON public."projects" FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM project_inspector_assignments pia
  WHERE ((pia.project_id = projects.id) AND (pia.inspector_id = auth.uid())))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'projects' AND policyname = 'projects_delete_client'
  ) THEN
    CREATE POLICY "projects_delete_client" ON public."projects" FOR DELETE TO authenticated USING (((client_id = auth.uid()) OR is_admin_safe()));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'projects' AND policyname = 'projects_insert_client'
  ) THEN
    CREATE POLICY "projects_insert_client" ON public."projects" FOR INSERT TO authenticated WITH CHECK (((client_id = auth.uid()) OR is_admin_safe()));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'projects' AND policyname = 'projects_select_awarded_contractor'
  ) THEN
    CREATE POLICY "projects_select_awarded_contractor" ON public."projects" FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM project_awards pa
  WHERE ((pa.project_id = projects.id) AND (pa.contractor_id = auth.uid())))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'projects' AND policyname = 'projects_select_client'
  ) THEN
    CREATE POLICY "projects_select_client" ON public."projects" FOR SELECT TO authenticated USING (((client_id = auth.uid()) OR is_admin_safe()));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'projects' AND policyname = 'projects_update_client'
  ) THEN
    CREATE POLICY "projects_update_client" ON public."projects" FOR UPDATE TO authenticated USING (((client_id = auth.uid()) OR is_admin_safe())) WITH CHECK (((client_id = auth.uid()) OR is_admin_safe()));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rfi_catalog' AND policyname = 'rfi_catalog_select_all'
  ) THEN
    CREATE POLICY "rfi_catalog_select_all" ON public."rfi_catalog" FOR SELECT TO authenticated USING (true);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rfis' AND policyname = 'read rfis for published projects'
  ) THEN
    CREATE POLICY "read rfis for published projects" ON public."rfis" FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = rfis.project_id) AND (p.state <> ALL (ARRAY['DRAFT'::project_state, 'PENDING_PAYMENT'::project_state]))))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rfis' AND policyname = 'rfis_all_admin'
  ) THEN
    CREATE POLICY "rfis_all_admin" ON public."rfis" FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role)::text = 'ADMIN'::text)))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rfis' AND policyname = 'rfis_insert_contractor'
  ) THEN
    CREATE POLICY "rfis_insert_contractor" ON public."rfis" FOR INSERT TO authenticated WITH CHECK (((contractor_id = auth.uid()) AND project_is_open_for_bidding(project_id)));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rfis' AND policyname = 'rfis_select_client'
  ) THEN
    CREATE POLICY "rfis_select_client" ON public."rfis" FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = rfis.project_id) AND (p.client_id = auth.uid())))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rfis' AND policyname = 'rfis_select_contractor'
  ) THEN
    CREATE POLICY "rfis_select_contractor" ON public."rfis" FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role)::text = ANY (ARRAY['CONTRACTOR'::text, 'ADMIN'::text]))))) AND project_is_open_for_bidding(project_id)));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rfis' AND policyname = 'rfis_update_client'
  ) THEN
    CREATE POLICY "rfis_update_client" ON public."rfis" FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = rfis.project_id) AND (p.client_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = rfis.project_id) AND (p.client_id = auth.uid())))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'support_requests' AND policyname = 'admins can manage support requests'
  ) THEN
    CREATE POLICY "admins can manage support requests" ON public."support_requests" FOR ALL TO public USING (is_admin_safe()) WITH CHECK (is_admin_safe());
  END IF;
END $$;

-- ============================================================================
-- SECTION: INDEXES
-- ============================================================================
-- Primary-key indexes are created automatically by their inline PRIMARY
-- KEY constraint in SECTION: TABLES. Only the 53 secondary indexes are
-- listed here, using their live indexdef verbatim.

CREATE UNIQUE INDEX IF NOT EXISTS bid_dismissal_reasons_code_key ON public.bid_dismissal_reasons USING btree (code);
CREATE UNIQUE INDEX IF NOT EXISTS bid_dismissals_bid_id_key ON public.bid_dismissals USING btree (bid_id);
CREATE INDEX IF NOT EXISTS bid_dismissals_contractor_id_idx ON public.bid_dismissals USING btree (contractor_id);
CREATE INDEX IF NOT EXISTS bid_dismissals_dismissed_by_idx ON public.bid_dismissals USING btree (dismissed_by);
CREATE INDEX IF NOT EXISTS bid_dismissals_moderation_status_idx ON public.bid_dismissals USING btree (moderation_status);
CREATE INDEX IF NOT EXISTS bid_dismissals_project_id_idx ON public.bid_dismissals USING btree (project_id);
CREATE INDEX IF NOT EXISTS bid_line_items_bid_version_id_idx ON public.bid_line_items USING btree (bid_version_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_bid_version_num ON public.bid_versions USING btree (bid_id, version_number);
CREATE UNIQUE INDEX IF NOT EXISTS bids_one_per_contractor_per_project ON public.bids USING btree (project_id, contractor_id);
CREATE UNIQUE INDEX IF NOT EXISTS bids_project_id_contractor_id_key ON public.bids USING btree (project_id, contractor_id);
CREATE INDEX IF NOT EXISTS idx_bids_contractor ON public.bids USING btree (contractor_id);
CREATE INDEX IF NOT EXISTS idx_bids_project ON public.bids USING btree (project_id);
CREATE INDEX IF NOT EXISTS idx_bids_status ON public.bids USING btree (status);
CREATE INDEX IF NOT EXISTS client_credits_available_idx ON public.client_credits USING btree (client_id, status) WHERE (status = 'AVAILABLE'::text);
CREATE INDEX IF NOT EXISTS contractor_credentials_contractor_id_idx ON public.contractor_credentials USING btree (contractor_id);
CREATE UNIQUE INDEX IF NOT EXISTS contractor_directory_public_contractor_id_key ON public.contractor_directory_public USING btree (contractor_id);
CREATE INDEX IF NOT EXISTS idx_dir_area ON public.contractor_directory_public USING btree (service_area);
CREATE INDEX IF NOT EXISTS idx_dir_price ON public.contractor_directory_public USING btree (min_job_cents, max_project_cents);
CREATE INDEX IF NOT EXISTS contractor_portfolio_photos_contractor_id_idx ON public.contractor_portfolio_photos USING btree (contractor_id);
CREATE INDEX IF NOT EXISTS contractor_profiles_listed_idx ON public.contractor_profiles USING btree (is_listed);
CREATE INDEX IF NOT EXISTS contractor_profiles_veteran_queue_idx ON public.contractor_profiles USING btree (veteran_verified, veteran_applied_at);
CREATE UNIQUE INDEX IF NOT EXISTS contractor_subscriptions_contractor_id_key ON public.contractor_subscriptions USING btree (contractor_id);
CREATE INDEX IF NOT EXISTS idx_subs_contractor ON public.contractor_subscriptions USING btree (contractor_id);
CREATE INDEX IF NOT EXISTS idx_subs_status ON public.contractor_subscriptions USING btree (status);
CREATE INDEX IF NOT EXISTS contractor_verification_log_contractor_id_idx ON public.contractor_verification_log USING btree (contractor_id);
CREATE UNIQUE INDEX IF NOT EXISTS coupon_codes_code_key ON public.coupon_codes USING btree (code);
CREATE INDEX IF NOT EXISTS disclaimer_ack_user_type_idx ON public.disclaimer_acknowledgments USING btree (user_id, disclaimer_type);
CREATE INDEX IF NOT EXISTS emergency_request_log_client_id_created_at_idx ON public.emergency_request_log USING btree (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS emergency_request_log_project_id_idx ON public.emergency_request_log USING btree (project_id);
CREATE INDEX IF NOT EXISTS inspector_flags_inspector_idx ON public.inspector_flags USING btree (inspector_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS inspector_price_list_pricing_key_key ON public.inspector_price_list USING btree (pricing_key);
CREATE UNIQUE INDEX IF NOT EXISTS inspector_rfi_catalog_code_key ON public.inspector_rfi_catalog USING btree (code);
CREATE INDEX IF NOT EXISTS inspector_upgrade_disputes_client_idx ON public.inspector_upgrade_disputes USING btree (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS inspector_upgrade_disputes_inspector_idx ON public.inspector_upgrade_disputes USING btree (original_inspector_id, resolved_at);
CREATE INDEX IF NOT EXISTS inspector_upgrade_disputes_status_idx ON public.inspector_upgrade_disputes USING btree (status, assigned_at);
CREATE INDEX IF NOT EXISTS problem_reports_created_at_idx ON public.problem_reports USING btree (created_at);
CREATE INDEX IF NOT EXISTS problem_reports_status_idx ON public.problem_reports USING btree (status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles USING btree (role);
CREATE INDEX IF NOT EXISTS idx_profiles_vet_status ON public.profiles USING btree (vet_cert_status);
CREATE INDEX IF NOT EXISTS profiles_master_inspector_idx ON public.profiles USING btree (is_master_inspector) WHERE (is_master_inspector = true);
CREATE UNIQUE INDEX IF NOT EXISTS project_awards_one_per_project ON public.project_awards USING btree (project_id);
CREATE UNIQUE INDEX IF NOT EXISTS project_awards_project_id_key ON public.project_awards USING btree (project_id);
CREATE INDEX IF NOT EXISTS idx_assignments_inspector ON public.project_inspector_assignments USING btree (inspector_id);
CREATE INDEX IF NOT EXISTS idx_assignments_project ON public.project_inspector_assignments USING btree (project_id);
CREATE INDEX IF NOT EXISTS project_messages_project_idx ON public.project_messages USING btree (project_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS uq_project_revision_num ON public.project_revisions USING btree (project_id, revision_number);
CREATE INDEX IF NOT EXISTS idx_projects_client ON public.projects USING btree (client_id);
CREATE INDEX IF NOT EXISTS idx_projects_state_deadline ON public.projects USING btree (state, deadline_at);
CREATE UNIQUE INDEX IF NOT EXISTS rfi_catalog_code_key ON public.rfi_catalog USING btree (code);
CREATE UNIQUE INDEX IF NOT EXISTS uq_rfi_dedupe ON public.rfis USING btree (project_id, revision_number, catalog_id);
CREATE INDEX IF NOT EXISTS subscription_disputes_contractor_id_idx ON public.subscription_disputes USING btree (contractor_id);
CREATE INDEX IF NOT EXISTS subscription_disputes_status_idx ON public.subscription_disputes USING btree (status);
CREATE UNIQUE INDEX IF NOT EXISTS subscription_disputes_stripe_dispute_id_key ON public.subscription_disputes USING btree (stripe_dispute_id);

-- ============================================================================
-- SECTION: STORAGE
-- ============================================================================
-- Bucket rows use ON CONFLICT DO NOTHING (never overwrites a live config
-- change). Storage object-level RLS policies use the same catalog-guard
-- pattern as SECTION: RLS.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('bid-quotes', 'bid-quotes', false, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('contractor-portfolio', 'contractor-portfolio', true, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('problem-report-screenshots', 'problem-report-screenshots', false, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('project-files', 'project-files', false, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'admins can read all project files'
  ) THEN
    CREATE POLICY "admins can read all project files" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'project-files'::text) AND ( SELECT ((profiles.role)::text = 'ADMIN'::text)
   FROM profiles
  WHERE (profiles.id = auth.uid()))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'clients can delete own project files'
  ) THEN
    CREATE POLICY "clients can delete own project files" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'project-files'::text) AND ( SELECT (p.client_id = auth.uid())
   FROM projects p
  WHERE ((p.id)::text = (string_to_array(objects.name, '/'::text))[1]))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'clients can read own project files'
  ) THEN
    CREATE POLICY "clients can read own project files" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'project-files'::text) AND ( SELECT (p.client_id = auth.uid())
   FROM projects p
  WHERE ((p.id)::text = (string_to_array(objects.name, '/'::text))[1]))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'clients can upload project files'
  ) THEN
    CREATE POLICY "clients can upload project files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'project-files'::text) AND ( SELECT (p.client_id = auth.uid())
   FROM projects p
  WHERE ((p.id)::text = (string_to_array(objects.name, '/'::text))[1]))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'contractors can list open project files'
  ) THEN
    CREATE POLICY "contractors can list open project files" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'project-files'::text) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role)::text = ANY (ARRAY['CONTRACTOR'::text, 'ADMIN'::text])))))));
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'contractors can read open project files'
  ) THEN
    CREATE POLICY "contractors can read open project files" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'project-files'::text) AND ( SELECT (p.state = 'OPEN'::project_state)
   FROM projects p
  WHERE ((p.id)::text = (string_to_array(objects.name, '/'::text))[1]))));
  END IF;
END $$;

-- ============================================================================
-- SECTION: FINAL VALIDATION NOTES
-- ============================================================================
-- Expected object counts, for cross-check before applying:
--
--   Tables ............... 41
--   Enums ................ 9
--   Foreign keys .......... 65
--   Unique constraints .... 11
--   Check constraints ..... 8
--   Functions ............. 20
--   Triggers .............. 3
--   Secondary indexes ..... 53
--   Public-schema RLS policies ... 82
--   Storage buckets ........ 4
--   Storage policies ....... 6
--
-- Deliberately excluded: service_area_waitlist, profiles.service_area_zip,
-- profiles.service_area_status (see header + investigation report).
--
-- FRESH REBUILD: run this file ALONE. It is a complete, self-sufficient
-- baseline -- running 001-015 afterward is unnecessary (016 already
-- created everything they would) and will fail (most of 001-015 create
-- policies with no idempotency guard, verified empirically).
-- Run order is irrelevant when applying to an existing database
-- (production) -- every statement here is a guarded no-op there.
-- ============================================================================
