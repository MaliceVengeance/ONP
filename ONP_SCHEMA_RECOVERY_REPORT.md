# ONP Database Migration Recovery — Priority 1.1 Report

**Method:** Direct introspection of the live Postgres database via `pg_catalog`/`information_schema` (not PostgREST's partial API — a real connection, using a database password you generated for this purpose). This is authoritative ground truth, not inference.

**Per your instructions: no migration has been created yet. This is the report only.**

---

## Summary counts

| Object type | Live count |
|---|---|
| Tables | 41 |
| Columns | 472 |
| Enum types | 9 |
| Constraints (PK/FK/UNIQUE/CHECK) | 125 (41 PK, 65 FK, 11 UNIQUE, 8 CHECK) |
| Functions | 20 |
| Triggers | 3 (2 on `public`, 1 on `auth.users`) |
| RLS policies | 82 |
| Indexes | 94 (41 PK + 53 secondary) |
| Storage buckets | 4 |

---

## 1. Tables missing from tracked migrations

**26 of 41 tables** have no `CREATE TABLE` anywhere in `supabase/migrations/`:

`profiles`, `projects`, `bids`, `bid_versions`, `contractor_profiles`, `project_awards`, `rfis`, `rfi_catalog`, `contractor_subscriptions`†, `client_credits`, `inspector_price_list`, `inspector_upgrade_disputes`, `inspector_flags`, `inspector_rfis`, `inspector_rfi_catalog`, `inspector_responses`, `master_inspector_reviews_log`, `project_inspector_assignments`, `project_attachments`, `project_revisions`, `project_services`, `coupon_codes`, `contractor_verification_log`, `contractor_directory_public`, `platform_settings`, `audit_log`

† `contractor_subscriptions` has a *baseline-capture* migration (`015`) that recreates its columns, but that migration predates this audit and was written from partial (PostgREST-only) information — see §2 for what it's missing.

## 2. Tables already represented in migrations

**15 tables**, all with `CREATE TABLE IF NOT EXISTS` + RLS enable + policies already in source control: `emergency_request_log`, `contractor_settings`, `disclaimer_acknowledgments`, `admin_actions`, `project_messages`, `project_message_reads`, `bid_line_items`, `contractor_portfolio_photos`, `contractor_credentials`, `bid_dismissal_reasons`, `bid_dismissals`, `problem_reports`, `subscription_disputes`, `contractor_subscriptions` (partial — see below), plus `service_area_waitlist` (tracked, but see the anomaly flagged below).

**Gap found even in these 15:** none of their migration files capture the specific **RLS policy definitions** now visible via direct introspection — they enable RLS and add policies, but I haven't cross-diffed each tracked policy against what's actually live to confirm word-for-word match. Given `016` is additive/idempotent, this is a documentation nuance, not a blocking risk — the live policies are authoritative regardless of what the migration file says.

## 3. Missing enums

**9 enum types exist live; 0 have a `CREATE TYPE` in tracked migrations** (only `ALTER TYPE ... ADD VALUE` statements against types assumed to already exist):

| Enum | Values |
|---|---|
| `role_type` | ADMIN, CLIENT, CONTRACTOR, INSPECTOR |
| `project_state` | DRAFT, OPEN, BIDDING_CLOSED, BIDS_UNLOCKED, AWARDED, CANCELED, COMPLETED, PENDING_PAYMENT, EMERGENCY_EXPIRED |
| `project_category` | GENERAL_CONSTRUCTION, ELECTRICAL, PLUMBING, HVAC, ROOFING, CONCRETE, LANDSCAPING, PAINTING, FENCING, FLOORING, RENOVATION, OTHER |
| `bid_status` | IN_PROGRESS, SUBMITTED_CURRENT, REVIEW_REQUIRED, LOCKED_FINAL, DISQUALIFIED_SUBSCRIPTION |
| `subscription_status` | ACTIVE, PAST_DUE, CANCELED, EXPIRED, TRIALING |
| `dispute_status` | SUBMITTED, UNDER_REVIEW, RESOLVED_UPGRADE_JUSTIFIED, RESOLVED_PARTIAL_CREDIT, RESOLVED_REFUND, WITHDRAWN |
| `support_status` | OPEN, ASSIGNED, WAITING_ON_USER, CLOSED |
| `vet_cert_status` | NOT_APPLIED, PENDING_REVIEW, APPROVED, REJECTED, RECHECK_REQUIRED |
| `service_type` | INSPECTOR_TAKEOFF |

Postgres has no native `CREATE TYPE IF NOT EXISTS` — your requirements note "where supported," so the migration will use the `DO $$ ... IF NOT EXISTS (SELECT 1 FROM pg_type ...) THEN CREATE TYPE ... $$` guard pattern already established in this repo's own `015` migration, applied to all 9.

## 4. Missing functions

**All 20 live functions are entirely absent from tracked migrations** — none have ever been captured in source control. Full list (all `public` schema, none extension-owned):

`auth_uid_owns_project`, `award_project_bid`, `clone_project_as_draft`, `current_role`, `get_awarded_project_client_info`, `get_inspector_flag_status`, `get_open_project_detail`, `get_open_project_window`, `get_project_award_for_client`, `handle_new_user`, `is_admin`, `is_admin_safe`, `is_within_dispute_window`, `list_my_active_bids`, `list_my_awarded_projects`, `list_open_projects`, `list_project_bids_for_client`, `project_is_open_for_bidding`, `set_updated_at`, `sync_contractor_directory_public`.

These are directly called by the app via `.rpc(...)` (e.g., `list_open_projects`, `award_project_bid`, `clone_project_as_draft` — all confirmed referenced in `src/`) or fire as trigger bodies (`handle_new_user`, `set_updated_at`, `sync_contractor_directory_public`). I have their exact `CREATE OR REPLACE FUNCTION` bodies from `pg_get_functiondef()` — full fidelity, not reconstructed.

## 5. Missing triggers

**All 3 live triggers are absent from tracked migrations:**

| Trigger | Table | Fires |
|---|---|---|
| `on_auth_user_created` | `auth.users` | AFTER INSERT → `handle_new_user()` — creates the matching `profiles` row on signup |
| `contractor_profiles_set_updated_at` | `contractor_profiles` | → `set_updated_at()` |
| `contractor_profiles_sync_directory` | `contractor_profiles` | → `sync_contractor_directory_public()` — keeps `contractor_directory_public` in sync |

Note: `contractor_directory_public` is a **real table** kept in sync by this trigger, not a view as I described in an earlier report this session — correcting that here. It's still functionally unused (no app code queries it; the live `/contractors` pages query `contractor_profiles` directly), but it *is* being actively maintained by the trigger regardless.

## 6. Missing RLS policies

**82 policies exist live; effectively 0 are captured in tracked migrations** (the 15 tracked tables have *some* policies written in their migration files, but I have not line-by-line diffed them against the live policy text — treat the live database as authoritative). Policy count per table ranges from 0 to 9. **9 tables have RLS enabled with zero policies** — meaning all access to them is denied by default except via the service-role key, which bypasses RLS entirely: `audit_log`, `contractor_directory_public`, `inspector_responses`, `inspector_rfi_catalog`, `inspector_rfis`, `problem_reports`, `project_attachments`, `project_revisions`, `project_services`, `subscription_disputes`. For the tables your app code actually writes to (`problem_reports`, `subscription_disputes`) this is intentional — those are written exclusively via `supabaseAdmin`. For the others, it's consistent with them being unused/dead code (see the architecture report from earlier this session).

**Good news, resolves the prior open question:** **all 41 tables have RLS enabled**, including the 26 previously unverifiable ones — `profiles`, `projects`, and `bids` included. This was the top risk flagged in the earlier architecture report; it's now confirmed enabled. (Whether each policy's *logic* is correct is a separate question — that's explicitly Priority 1.2, out of scope here.)

## 7. Missing indexes

**94 total indexes; 41 are primary keys (implicit, recreated automatically by the `PRIMARY KEY` constraint) and 53 are secondary indexes** — none of the 53 secondary indexes exist in tracked migrations except the handful added by this session's own migrations (`012`–`015`). These include performance-critical ones like `idx_bids_project`, `idx_bids_contractor`, `bids_one_per_contractor_per_project` (a uniqueness constraint enforced via index), and status/lookup indexes across most tables.

## 8. Missing storage configuration

**4 buckets exist live; 0 are represented in any tracked migration** (bucket creation for this project has always happened via direct Storage API calls, confirmed from this session's own prior work):

| Bucket | Public | Size limit | MIME restriction |
|---|---|---|---|
| `bid-quotes` | No | none set | none set |
| `contractor-portfolio` | **Yes** | none set | none set |
| `problem-report-screenshots` | No | none set | none set |
| `project-files` | No | none set | none set |

Storage bucket creation isn't standard SQL DDL — Supabase stores bucket config in `storage.buckets`, a real table, so it *can* be captured via `INSERT ... ON CONFLICT DO NOTHING` in the migration, which is what I'll do.

---

## Anomaly found (not part of the 8 requested sections, but load-bearing)

**`service_area_waitlist` has a tracked migration (`005_service_area.sql`) but does not exist in the live database.** Confirmed via direct `pg_catalog` query — it is not among the 41 live tables, under this name or any obvious variant.

This is not just a documentation gap — **the app actively reads and writes this table in 8 places today** (`src/lib/serviceArea/actions.ts`, `src/app/dashboard/admin/waitlist/*`, `src/app/api/admin/waitlist-export/route.ts`, `src/app/dashboard/admin/page.tsx`), including the out-of-area signup waitlist-join flow. Every one of those calls is currently hitting a table that doesn't exist in production. This is a live, active bug — separate from the schema-recovery task itself, but I found it as a direct byproduct of this audit and it would be irresponsible not to flag it immediately rather than bury it. **I have not touched this** (no app code or database changes made), per your instructions — flagging only.

---

## What I recommend for the `016` migration, pending your review

- Recreate all 9 enum types (idempotent guard pattern).
- Recreate all 26 untracked tables with their exact live columns, types, defaults, nullability (`CREATE TABLE IF NOT EXISTS`).
- Recreate all 65 foreign keys with their **exact live `ON DELETE`/`ON UPDATE` behavior** (I have this precisely — e.g., `bids.project_id → projects` is `CASCADE`, but `bids.contractor_id → profiles` is `NO ACTION`; getting this wrong in a rebuild would silently change cascade behavior, which your requirements explicitly prohibit).
- Recreate all 11 UNIQUE and 8 CHECK constraints.
- Recreate all 53 secondary indexes.
- Recreate all 20 functions verbatim (`CREATE OR REPLACE FUNCTION`, using the real `pg_get_functiondef()` output — not reconstructed from guesses).
- Recreate all 3 triggers.
- Recreate all 82 RLS policies verbatim (`CREATE POLICY` guarded with a pre-check so re-running is safe).
- Insert the 4 storage bucket rows (`ON CONFLICT (id) DO NOTHING`).
- **Explicitly exclude `service_area_waitlist`** from the "current live state" migration, since it isn't part of current live state — and flag the anomaly in the migration's header comment rather than silently recreating a table that was apparently dropped for a reason I don't know.

**One packaging question before I write it:** 82 policies + 20 full function bodies + 65 FK definitions is a lot of SQL — likely 1,500+ lines in one file. Do you want it all in the single `016_complete_schema_baseline.sql` file as specified, or would you rather I split it into a few files (e.g., tables+enums, then functions+triggers, then policies) for easier review, still all under the same migration number/sequence? I'll default to the single file you asked for unless you'd rather split it.
