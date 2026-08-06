# ONP Database Recovery

**Baseline snapshot date:** 2026-08-05 (revised/validated 2026-08-06)
**Baseline commit:** `96288ac55900f71e992d99b2f36de1d8ce19897d`
**Baseline file:** `supabase/migrations/016_complete_schema_baseline.sql`

This document explains how to rebuild the ONP database schema from nothing — disaster recovery, a new environment, or a fresh Supabase project — and why the recovery procedure is not "run every migration file in order."

---

## 1. Why migrations 001–015 are not a replayable from-scratch chain

Migrations 001 through 015 were written incrementally against a database that **already had its foundational tables** — `profiles`, `projects`, `contractor_profiles`, `bids`, `bid_versions`, and 22 others. Those tables were created directly in the Supabase dashboard early in this project's life, before any migration file existed. 001–015 only ever `ALTER` or add to that pre-existing foundation; none of them create it.

This was confirmed empirically, not assumed: running 001 through 015 in ascending order against a genuinely empty database fails immediately in `001_emergency_bid.sql`:

```
relation "projects" does not exist
```

because 001 tries to `ALTER TABLE projects` before anything has created `projects`.

A second, independent problem compounds this: most of 001–015 were written as one-time "run this once in the SQL Editor" scripts, not idempotent, replayable migrations. Confirmed by direct inspection — `002`, `003`, `005`, `006`, `008`, `010`, and `012` all contain at least one bare `CREATE POLICY` (or similar) with no `DROP POLICY IF EXISTS` or other existence guard. Running any of them a second time against a database that already has their target objects fails outright.

**Net effect:** 001–015, as a set, can only ever have been run correctly once, in order, against the specific pre-existing database they were written for. They cannot rebuild a database from nothing, and they cannot be safely re-run against a database that already has their objects.

## 2. Why migration 016 must be used alone for a fresh ONP Supabase database

`016_complete_schema_baseline.sql` is a **complete, point-in-time capture** of the live production schema as it actually exists — not an incremental step. It was generated programmatically from a direct introspection of production (`pg_catalog`/`information_schema`, not the partial PostgREST API), covering every table, enum, constraint, function, trigger, RLS policy, index, and storage bucket. It already contains everything 001–015 would have produced, plus everything that was only ever created directly in the dashboard and never captured in any migration at all.

Because 016 is a complete end-state snapshot, running 001–015 afterward is not just unnecessary — it fails, for the same reason described in §1 (those files aren't idempotent, and 016 has already created what they'd try to create again).

This was validated, not assumed: 016 was applied alone against a genuinely empty, separate Postgres database (not merely an isolated schema in the same database — that distinction mattered in practice, since production's own system-catalog rows leaked into unqualified lookups when testing inside a shared database, masking a real bug). It succeeded, twice in a row from empty (proving both the fresh-create path and idempotency), and a full content diff against the production snapshot showed zero discrepancies across every category.

**016 is the entire recovery migration. Nothing else needs to run alongside it.**

## 3. Recovery order

1. **Provision a fresh Supabase project.** This gives you the platform-level foundation ONP's own migrations assume already exists: the `auth` schema (including `auth.users` and `auth.uid()`), the `storage` schema (`storage.buckets`, `storage.objects`), and the standard role set (`anon`, `authenticated`, `service_role`, `authenticator`).

2. **Confirm required Supabase platform schemas/extensions are available.** Before applying 016, verify the new project has: the `auth` and `storage` schemas present, and the extensions `pgcrypto`, `uuid-ossp`, `pg_stat_statements`, `plpgsql`, and `supabase_vault` available (016 declares each with `CREATE EXTENSION IF NOT EXISTS`, so it will provision them itself if they're merely *available* but not yet installed — this step is about confirming they're available at all, which is normally guaranteed by Supabase's own project bootstrap, but worth a direct check since it couldn't be independently verified against the live platform during this audit).

3. **Apply `016_complete_schema_baseline.sql` alone.** Run it once, in full, in the Supabase SQL Editor (or via any tool that can execute a `.sql` file against the project's Postgres connection). Do not run any of 001–015 before or after it.

4. **Configure Auth dashboard settings.** Not covered by any migration: email templates, redirect URLs, JWT expiry, password policy, and any OAuth provider configuration. These live in Supabase project settings, not in the database schema.

5. **Configure environment variables and external services.** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, Stripe keys (Products/Prices/webhook must be recreated in the new Stripe environment or pointed at the existing one), the Resend API key, the Mapbox token, and GA4 configuration. None of these are database objects and none can be captured by any SQL migration.

6. **Verify storage buckets, functions, triggers, RLS, and application connectivity.** After applying 016:
   - Confirm all 4 storage buckets exist (`bid-quotes`, `contractor-portfolio`, `problem-report-screenshots`, `project-files`) with the correct public/private flags.
   - Confirm the 3 triggers fire (`on_auth_user_created` on `auth.users`, plus `contractor_profiles_set_updated_at` and `contractor_profiles_sync_directory` on `contractor_profiles`).
   - Confirm RLS is enabled on all 41 tables and spot-check a policy from each role's perspective.
   - Point the application at the new project's connection details and confirm signup, login, and a basic authenticated read/write all work end-to-end before considering recovery complete.

## 4. Scope: schema only, not data

016 recreates **structure**, not **content**. A fresh database built from 016 has zero rows in every table and zero accounts in `auth.users`. It does not restore production data, does not restore user accounts, and does not restore Storage file contents (only the bucket configuration rows in `storage.buckets`). Data recovery, if ever needed, is a separate exercise (a `pg_dump --data-only` / point-in-time-restore from Supabase's own backups) and is out of scope for this document.

## 5. Deliberate exclusion: `service_area_waitlist`

`016` does **not** create the `service_area_waitlist` table or the `profiles.service_area_zip` / `profiles.service_area_status` columns, even though a tracked migration (`005_service_area.sql`) appears to add them. This is intentional: direct evidence (the live `handle_new_user()` function body still matches the *pre*-005 version, byte-for-byte) confirmed that migration 005 was **never actually applied to production**. These objects were genuinely absent from the database at the snapshot date, so a faithful baseline capture must not include them — 016's job is to reproduce what production *is*, not what a tracked migration file *claims* it should be. Full evidence is in the companion investigation (`SERVICE_AREA_WAITLIST_INVESTIGATION.md`). Repairing this gap is intentionally deferred to a future, separate migration — not part of 016.

## 6. Migrations after 016

Any migration written after 016 (017 onward, not yet started) should be a genuine, ordered, idempotent migration in the traditional sense: it should assume 016's baseline already exists, use `IF NOT EXISTS`/catalog-guarded patterns consistent with what 016 established, and be safe to re-run. Each should be verified after deployment — confirm it applied cleanly against the actual production database, not just tested in isolation — since this audit's central finding is that assumptions about what migrations do versus what production actually has can silently diverge over time.

## 7. Why 016 should not normally be applied to the existing production database

Production is the **source** 016 was captured from, not a target it needs to be applied to. Every statement in 016 is a guarded no-op against objects that already exist, so applying it to production is technically harmless — but there is no reason to do so under normal circumstances, since it cannot add anything production doesn't already have. The only legitimate reasons to run it against production would be defensive verification (confirming no drift has occurred) or recovering from a partial/failed manual change — not routine operation.

---

## Reference: object counts

Confirmed via a genuine from-scratch rebuild in a separate database, cross-checked with a full content diff against the production snapshot (zero discrepancies):

| Object type | Count |
|---|---|
| Tables | 41 |
| Enums | 9 |
| Foreign keys | 65 |
| Unique constraints | 11 |
| Check constraints | 8 |
| Functions | 20 |
| Triggers | 3 |
| Secondary indexes | 53 |
| RLS policies (public schema) | 82 |
| Storage buckets | 4 |
| Storage-object RLS policies | 6 |

---

## Warning

**Do not run migrations 001 through 015 either before or after 016 in a clean recovery environment.** Running them first fails immediately (§1). Running them after 016 also fails, for a different reason (§2). The only correct recovery procedure is 016 alone, per §3 above.
