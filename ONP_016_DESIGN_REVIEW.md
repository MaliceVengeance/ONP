# Priority 1.1 — Migration 016 Design Review

No SQL below. This is the implementation plan, for review before I write anything.

---

## 1. Idempotency Strategy

General principle: every statement must be safe to run against a database that already has the object in its final live form (this migration's primary use case — production) *and* against a database that has nothing (a fresh Supabase project — the disaster-recovery use case). Postgres's idempotency primitives differ by object type, so each category needs a different technique.

**Tables** — `CREATE TABLE IF NOT EXISTS`. Native, fully idempotent. No risk.

**Views** — Not applicable here: direct introspection confirmed `contractor_directory_public` (the one object I'd previously assumed was a view) is actually a real table kept in sync by a trigger, not a view. There are zero views in the live schema. Nothing to do in this category.

**Enums** — Postgres has no `CREATE TYPE IF NOT EXISTS`. I'll use the guard pattern already established in this repo's own `011_subscription_terms.sql`/`015_contractor_subscriptions_baseline.sql`:
```sql
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_name') THEN
    CREATE TYPE public.enum_name AS ENUM (...);
  END IF;
END $$;
```
Fully idempotent. One nuance: if an enum already exists live but I'm wrong about one of its values, `CREATE TYPE` won't run at all (the guard skips it), so a value mismatch would be silently ignored rather than erroring — I'm mitigating this by using the exact live values pulled via `pg_enum`, not reconstructed from memory, so there shouldn't be a mismatch to begin with. I'll note this as a residual assumption in the migration's header comment regardless.

**Functions** — `CREATE OR REPLACE FUNCTION`. Natively idempotent and safe to re-run — it overwrites the function body with byte-identical SQL each time, so re-running against production is a no-op in effect (same definition in, same definition out). This is the one category where "idempotent" and "safe to overwrite" are the same guarantee, which is good: it also means if I've made any transcription error, running this migration would *actively correct* a function back to what I captured — worth flagging as a reason to double-check the captured bodies carefully before this ships, since a wrong capture would become live truth the moment it's run.

**Triggers** — No `CREATE TRIGGER IF NOT EXISTS` in Postgres. I'll use `DROP TRIGGER IF EXISTS ... ; CREATE TRIGGER ...` paired statements. This is safe specifically because the trigger body (`CREATE OR REPLACE FUNCTION` above) is captured verbatim from production — a drop-and-recreate of the trigger binding itself doesn't touch data and only has a sub-millisecond window where the trigger doesn't exist, which is immaterial for these three triggers (none are on a table with concurrent high-frequency writes at INSERT-time contention levels this project operates at).

**Trigger bindings** — same mechanism as triggers (a trigger binding *is* the `CREATE TRIGGER` statement — table + timing + function). Covered above.

**RLS enablement** — `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` is natively idempotent — re-enabling already-enabled RLS is a documented no-op, no error, no state change.

**RLS policies** — No `CREATE POLICY IF NOT EXISTS` in Postgres (added in PG 15 actually — I'll verify the live server version before relying on it; if unavailable I'll use the drop-and-recreate guard: `DROP POLICY IF EXISTS "name" ON table; CREATE POLICY "name" ON table ...`). Same reasoning as triggers: the policy text is captured verbatim from `pg_policies`, so re-creating it is a no-op in effect. I'll confirm the PG version from the live `SELECT version()` I already captured — it reported PostgreSQL 17.6, so `CREATE POLICY IF NOT EXISTS` is actually available and I'll prefer that where it simplifies the file, falling back to drop-and-recreate only if I hit a case it doesn't handle cleanly.

**Indexes** — `CREATE INDEX IF NOT EXISTS` / `CREATE UNIQUE INDEX IF NOT EXISTS`. Native, fully idempotent.

**Constraints** — This is the one category with **no fully native idempotent form** for anything other than `NOT NULL` (which is captured as part of the column definition, not separately). For PK/FK/UNIQUE/CHECK constraints added via `ALTER TABLE ... ADD CONSTRAINT`, Postgres has no `IF NOT EXISTS` variant. I'll handle this the same way `015_contractor_subscriptions_baseline.sql` already does it in this repo: constraints that are part of the initial `CREATE TABLE IF NOT EXISTS` statement (inline `PRIMARY KEY`, inline `REFERENCES ... ON DELETE ...`, inline `CHECK (...)`) are automatically idempotent as a side effect of the table-creation guard — if the table already exists, the whole statement (including its inline constraints) is skipped entirely, so there's no double-add risk. This means the practical approach is: **define every constraint inline inside the `CREATE TABLE IF NOT EXISTS` block wherever the table itself doesn't already exist**, and skip constraint statements entirely for tables that already exist live (all 41 already do, in production) — which is correct anyway, since defining constraints on a table that's about to be skipped by the `IF NOT EXISTS` guard would otherwise require a separate idempotency check I'd have to hand-roll with a `DO $$ IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '...') $$` guard per constraint. I'll use that guard pattern for the few cases where a constraint needs to be independently checkable (none currently anticipated, since every table already exists in production — this only becomes relevant in the fresh-rebuild scenario, where the table won't exist yet and the inline path handles it automatically).

**Storage bucket configuration** — `storage.buckets` is a real table with a primary key on `id`. I'll use `INSERT INTO storage.buckets (...) VALUES (...) ON CONFLICT (id) DO NOTHING`. Fully idempotent, and deliberately `DO NOTHING` rather than `DO UPDATE` — if someone has changed a bucket's public/private flag or size limit live since this migration was written, an `UPDATE` would silently overwrite that intentional change; `DO NOTHING` guarantees this migration can never clobber a bucket config that's since evolved.

**Storage policies** — These are RLS policies on `storage.objects`, a table Supabase owns. Same mechanism as any other RLS policy (`CREATE POLICY IF NOT EXISTS` on `storage.objects`, scoped by `bucket_id = '...'` in the policy's `USING`/`WITH CHECK` clause, exactly as they're written live). I confirmed via direct query: only 6 such policies exist, all scoped to the `project-files` bucket; the other three buckets have no bucket-specific storage policies at all (access to them goes entirely through the service-role key, which bypasses RLS, or — for `contractor-portfolio` specifically — through its `public = true` flag, which lets unauthenticated `GET` requests through Storage's own public-bucket serving path independent of RLS).

**Objects that cannot be made perfectly idempotent, and how I'll handle them:**
- **None, functionally.** Every object category above has either a native idempotent form or a reliable guard-pattern equivalent already precedented in this repo's own prior migrations. The one honest caveat: idempotency here means "safe to re-run without erroring or duplicating," not "guaranteed to detect and preserve a manual change someone made directly in the dashboard after this migration was written." If someone hand-edits a policy in the Supabase dashboard between now and whenever this migration might be re-run, the drop-and-recreate approach for policies/triggers would silently revert that edit back to what's captured here. I don't think this is avoidable in general (there's no Postgres primitive for "only replace if unchanged since a known baseline"), so I'll call this out explicitly in the migration's header comment as an operating assumption, not silently accept the risk.

---

## 2. Fresh Environment Rebuild

**Running 001→016 on a brand-new Supabase project would get functionally very close, but not 100%, and I want to be precise about the gap rather than round it up.**

### Verified automated recreation (confirmed via direct introspection, not assumed)
- All 41 tables, exact columns/types/defaults/nullability
- All 9 enum types and their values
- All 65 foreign keys with exact `ON DELETE`/`ON UPDATE` behavior
- All 11 UNIQUE and 8 CHECK constraints
- All 53 secondary indexes
- All 20 functions, verbatim bodies
- All 3 triggers
- All 82 RLS policies, verbatim
- 4 storage bucket rows (name/public flag) + their 6 object-level RLS policies

### Manual post-deployment steps required regardless of what's in 016

- **Extensions.** Live project has `pg_stat_statements`, `pgcrypto`, `plpgsql`, `supabase_vault`, `uuid-ossp` installed. None have a `CREATE EXTENSION` statement anywhere in tracked migrations (001–015), because — I should flag this rather than assume — every one of these is part of Supabase's *default* project template and is provisioned automatically for any new project, before any migration ever runs. I have not independently verified that claim against Supabase's current onboarding behavior for a project created today; I'm flagging it as a reasonable assumption based on which extensions these are (all standard/platform-provided, none custom), not as something I've confirmed. If I'm wrong, this is a one-line manual fix (`CREATE EXTENSION IF NOT EXISTS ...`) that I'd rather have you verify on an actual fresh project than have me silently bake an assumption into 016 as fact.
- **Auth configuration.** Email templates, redirect URLs, JWT expiry, OAuth provider setup (if any), password policy — none of this lives in the `public` schema and none of it is something I have visibility into via this database connection. 100% manual, dashboard-only, every time.
- **Secrets / environment variables.** `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, Stripe keys, Resend key, etc. — none of these are database objects. Entirely a Vercel/local `.env` concern, unrelated to what a migration can capture.
- **Scheduled jobs (cron).** The 4 Vercel Cron routes (`emergency-auto-close`, `credit-expiry`, `dispute-sla`, `message-notifications`) are application-level, defined in `vercel.json`/Vercel's dashboard, not database-level `pg_cron` jobs — I checked, there's no `cron` schema or `pg_cron` extension installed, so these aren't a database-migration concern at all. Worth naming explicitly so it's not assumed to be a gap in 016 when it was never in scope for a DB migration to cover.
- **Storage bucket size limits / MIME restrictions.** All 4 buckets currently have `file_size_limit: null` and `allowed_mime_types: null` live (no restriction set at the bucket level — the app enforces its own size limits in code, e.g. the 10MB checks in `uploadProjectFile`). 016 will faithfully reproduce this "no restriction" state, which is correct for matching production — just noting it's not an oversight.
- **External integrations.** Stripe Products/Prices/webhook endpoint, Resend domain verification, Mapbox token, GA4 property — none of these are database objects and none can be captured by any Postgres migration. These would need to be recreated through their respective dashboards/APIs exactly as we did for the Stripe live-mode flip earlier this session.
- **`auth.users` rows themselves.** A schema rebuild recreates the *shape* of the database, not user accounts. A fresh project has zero users, zero sessions. This is inherent to what "schema baseline" means and isn't a gap in 016 — just worth stating plainly so "functionally equivalent" isn't misread as "identical data."

---

## 3. Baseline Philosophy

Confirmed: 016 will represent production exactly as it exists today. Specifically committing to:
- No repair of any known-broken behavior (the `service_area_waitlist` gap included — see §4).
- No refactoring — column names, types, and constraint names stay exactly as they are live, even where I might otherwise suggest a cleaner name.
- No optimization — I will not add an index I think *should* exist if it doesn't exist live, no matter how obviously useful it might look. Only the 53 that actually exist get captured.
- No removal of unused objects — `project_services`, `inspector_rfi_catalog`, `inspector_responses`, `contractor_directory_public`, `audit_log`, and the other dead/write-only tables identified in the Priority 1.1 report all get captured exactly as-is, dead code and all. Their aliveness or deadness is a separate, later decision — not this migration's call to make.
- No renaming — including places where a name is arguably confusing (e.g., `project_awards.contractor_id` existing alongside `project_awards.awarded_contractor_id` as apparent duplicate/legacy columns on the same table — both get captured as-is, unexplained, exactly as they are live).
- No new behavior — nothing in 016 will cause the running application to behave differently than it does right now, before the migration runs.

**One exception I want to flag before writing anything, not slip in silently:** the migration file itself will necessarily contain the *verbatim SQL bodies* of all 20 functions and 82 policies. Reading that SQL will surface implementation details (like the `project_awards` dual-column oddity above, or any other quirks in the live logic) that aren't currently visible anywhere in the tracked codebase. Capturing them isn't a behavior change — it's the opposite, it's making existing behavior visible — but I want to name upfront that this migration will likely surface a few more "huh, that's odd" observations like the waitlist one, purely as a side effect of finally being able to read what's actually running. I'll note anything notable in the migration's header comments as observations, clearly separated from the DDL itself, rather than silently "fixing" anything I notice.

---

## 4. Waitlist Investigation — Confirmation & Follow-Up Structure

**Confirmed: `service_area_waitlist` will not be created, and the `profiles.service_area_zip`/`service_area_status` columns will not be added, inside 016.** Per §3, 016 represents current production, and production doesn't have these. Including them would be a behavior change dressed up as a baseline capture.

**Proposed structure for the follow-up repair migration** (not written yet, per your instruction — this is the plan only):

- **Own migration file**, sequenced after 016 (e.g., `017_service_area_waitlist_repair.sql`), with a header comment explaining *why* it exists (links back to this investigation) rather than reading like a normal incremental feature migration — future readers should immediately understand this is closing a gap, not adding something new.
- **Contents:** effectively migration `005`'s original body — create `service_area_waitlist`, add the two `profiles` columns, restore the `service_area_zip`-aware version of `handle_new_user()` — but re-verified against the *current* live schema rather than copy-pasted blind, in case anything else has shifted around `profiles`/`handle_new_user` since 005 was originally written back when the project was younger.
- **Explicitly out of scope for that migration:** the app-code error-handling fix (the silent-failure pattern in `serviceArea/actions.ts` and the five read sites). That's a code change, not a database change, and deserves its own explicit go-ahead and its own review — I'd flag it as a strongly recommended companion fix, not bundle it in automatically, since fixing the silent-swallow behavior is exactly the kind of "new behavior" change that shouldn't ride along with a database migration unannounced.
- **Sequencing suggestion:** ship 017 (the DB fix) and the app-code error-handling fix together in the same work session once you give the go-ahead, since a DB fix without the code fix leaves the same class of bug able to hide silently again next time; but as two clearly separate commits (one SQL migration, one application code change), so each is independently reviewable and revertable.

---

## 5. Risk Review

| Risk | Level | Mitigation |
|---|---|---|
| A captured function/policy body has a subtle transcription error, and `CREATE OR REPLACE`/policy-recreate silently overwrites live logic with the wrong version | **High** | Every object is pulled programmatically via `pg_get_functiondef()`/`pg_policies` — not retyped by hand — which eliminates transcription error as a mechanism. Residual risk is a bug in *my* extraction/assembly script, not manual transcription. Mitigation: before this runs against production, I'll do a diff-style validation — re-query the live database after a **dry run against a scratch/throwaway schema first** (see §6), comparing extracted vs. re-extracted definitions, rather than trusting the first pass. |
| Running this against production takes an exclusive lock on a table mid-transaction, causing a brief app-facing outage | **Low** | Every operation here is additive/idempotent against objects that already exist (`IF NOT EXISTS` skips real work entirely for all 41 tables). Postgres DDL on an already-existing, already-matching object is fast — this isn't a data migration touching rows, so lock duration should be milliseconds, not the kind of long-running rewrite that causes real contention. I'll still run it during a low-traffic window as standard practice, not because I expect a problem. |
| The FK `ON DELETE` behavior I captured is misread or mis-transcribed for one of the 65 foreign keys, and a rebuild silently gets different cascade behavior than production | **Medium** | Captured via `confdeltype` directly from `pg_constraint`, machine-mapped to the SQL keyword (not hand-typed per row) — same eliminate-transcription-risk logic as above. This only matters for the *fresh-rebuild* scenario anyway (§2) since production already has the real behavior; it can't silently change production's own cascade behavior, because the constraint already exists there and the guarded statement won't touch it. |
| The migration is large (~1,500+ lines estimated) and hard to review carefully, increasing the chance an error slips past human review | **Medium** | This is the reason I asked last time whether you wanted it split into multiple files — still open. Splitting by object category (tables+enums, then functions+triggers, then policies) would make each piece independently reviewable without changing any of the guarantees above. Your call — I'll follow whichever you prefer. |
| Storage bucket `INSERT ... ON CONFLICT DO NOTHING` silently no-ops if a bucket's config has changed since I captured it, giving false confidence that buckets are "covered" by this migration when they might drift again later | **Low** | This is working as intended (§1's reasoning for `DO NOTHING` over `DO UPDATE`), but worth naming as a known limitation rather than a hidden one: this migration captures buckets *as of today*, not an ongoing sync. |
| `service_area_waitlist` gets accidentally swept into 016 by a future me not double-checking scope, given how much other work is happening in the same session | **Low** | Explicit exclusion, stated in writing here and to be restated in 016's own header comment, plus it's simply not present in the introspected live-table list I'm generating DDL from — there's nothing to accidentally include since it isn't in the source data at all. |
| Someone runs 016 against a database that already has *manually diverged* from what I captured (e.g., an admin added a policy by hand in the dashboard last week, after this investigation's snapshot) | **Medium** | Inherent to any point-in-time schema capture — not fixable by better SQL, only by re-running the same introspection close to whenever 016 actually gets applied. I'll note the snapshot timestamp in the migration header and recommend re-verifying against live state immediately before running it, rather than treating this report's data as permanently current. |

---

## 6. Success Criteria

I'd consider 016 complete and ready for your review when all of the following are true:

1. **Every one of the 41 live tables** has a corresponding `CREATE TABLE IF NOT EXISTS` block with column-for-column, type-for-type, default-for-default, nullable-for-nullable fidelity to what I extracted.
2. **All 9 enums, all 65 FKs (with correct `ON DELETE`/`ON UPDATE`), all 11 UNIQUE and 8 CHECK constraints, all 53 secondary indexes, all 20 functions, all 3 triggers, all 82 RLS policies, and the 4 storage bucket rows + 6 storage policies** are present in the file.
3. **`service_area_waitlist` and the two `profiles` service-area columns are absent**, with a header comment explaining why, referencing the investigation.
4. **The file runs clean, twice in a row, against a scratch copy of the schema** (not production) — once against an empty schema (proving the fresh-rebuild path works) and once against a copy that already has everything (proving the idempotent/no-op path works) — before I'd propose running it against production itself.
5. **A line-count/object-count self-check** at the end of the migration (or in the accompanying commit message) stating exactly how many of each object type it contains, so you can cross-check that count against this design review's numbers before approving — no silent scope drift between what we agreed here and what actually ships in the file.
6. **You've reviewed and approved** the file-splitting question (§5) and this design review overall, since several of the idempotency choices above (drop-and-recreate for triggers/policies vs. `IF NOT EXISTS` where available) are judgment calls I'd rather have explicit sign-off on than assume.

I have not started writing SQL. Waiting on your review of the above, plus a decision on the single-file-vs-split question, before I do.
