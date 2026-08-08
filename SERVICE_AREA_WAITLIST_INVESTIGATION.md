# Investigation: `service_area_waitlist` Discrepancy

**Method:** Direct live-database queries (`pg_catalog`, all schemas) — no code or database changes made.

---

## 1. Does the application currently write waitlist entries anywhere in the live database?

**No.** Two write paths exist in the code and both execute against a table that doesn't exist:
- `src/lib/serviceArea/actions.ts:26` — `processSignupServiceArea()`, called on every signup, tries to insert an out-of-area signup into `service_area_waitlist`.
- `src/lib/serviceArea/actions.ts:49` — `joinWaitlist()`, the homepage/login waitlist-join form action.

Neither call checks the returned `error` (both are bare `await supabaseAdmin.from(...).insert(...)` with no destructured `{ error }` and no throw), so every attempt fails against Postgres (`relation "service_area_waitlist" does not exist`) and is silently discarded. **No waitlist entry has ever been successfully written**, and none of the historical attempts are recoverable — Postgres doesn't queue failed inserts.

## 2. Exact table/schema used by the waitlist feature, if any

**None exists.** Searched every schema in the database (not just `public`) for any object — table, view, sequence, index — with "waitlist" anywhere in the name:

```sql
select n.nspname, c.relname, c.relkind from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where c.relname ilike '%waitlist%'
```
Zero rows. There is no waitlist table under this name, a variant name, or in a different schema. The feature has no backing store at all today.

## 3. If the feature is non-functional, identify precisely why

It's non-functional for a more specific reason than "the table is missing" — and the blast radius is larger than that one table. Migration `005_service_area.sql` was supposed to do three things; **none of them landed**:

1. Create `service_area_waitlist` — confirmed absent (§2).
2. Add `profiles.service_area_zip` and `profiles.service_area_status` — **also confirmed absent.** I checked the live `profiles` table's actual column list directly; neither column exists.
3. Update the `handle_new_user()` trigger function to populate `service_area_zip` on signup — **also never applied.** I pulled the live function body via `pg_get_functiondef()`:
   ```sql
   CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
   AS $function$
   BEGIN
     INSERT INTO public.profiles (id, role, display_name, company_name)
     VALUES (NEW.id, COALESCE(...), NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'company_name')
     ON CONFLICT (id) DO NOTHING;
     RETURN NEW;
   END;
   $function$
   ```
   This is the **pre-005 version** — it doesn't reference `service_area_zip` at all, matching what migration `005` was written to *replace*, not what it was written to produce.

**Consequence, more precisely than "the waitlist doesn't work":** five separate pages read `profiles.service_area_zip`/`service_area_status` and none check for query errors either (`dashboard/client/page.tsx:24`, `dashboard/contractor/page.tsx:69`, `dashboard/contractor/subscribe/page.tsx:20`, `dashboard/admin/users/[id]/page.tsx:56`). Every one of those `.select()` calls fails (nonexistent columns) and silently returns `null`, so `isOutOfArea` evaluates `false` everywhere, unconditionally.

**What still works vs. what doesn't**, because of one saving detail: `processSignupServiceArea()` computes `inArea` via `isInServiceArea(zip)` — a pure in-memory ZIP lookup, not a database read — *before* attempting the (failing) database writes, and returns that computed value regardless of whether the writes succeeded. So:
- ✅ **The signup-time redirect to `/signup/out-of-area` still works.** A user signing up from an out-of-area ZIP is correctly redirected, right now, today.
- ❌ **Nothing about that status persists.** The moment they leave that page, the system has no record they're out-of-area.
- ❌ **The "you're on the waitlist" banners never show again** (`dashboard/client/page.tsx:168`, `dashboard/contractor/page.tsx:154`) — they always read `isOutOfArea = false` on every subsequent visit.
- ❌ **The contractor subscribe-page out-of-area block doesn't function on return visits** (`dashboard/contractor/subscribe/page.tsx:600`) — same silent-false issue.
- ❌ **The waitlist itself is empty and has always been empty** — the admin waitlist page, CSV export, and bulk-notify-by-ZIP tooling all operate on zero real rows, and every out-of-area lead that ever tried to sign up has been lost with no record.

## 4. If the table was renamed, identify when and how

**It was not renamed.** §2's cross-schema search would have found a renamed table (renaming doesn't change internal identity in a way that hides it from `pg_class`) — there is no candidate table anywhere with a matching or similar structure that could plausibly be this table under a new name. Combined with §3's finding that the *entire* migration 005 — table, columns, and function update alike — is absent, the far more likely explanation is straightforward: **the migration file was written and committed to the repo, but was never actually run against the production database.**

## 5. If the migration exists but was never applied, confirm that with evidence

**Confirmed, with direct evidence** — this is the strongest finding in this investigation, not an inference:

- The live `handle_new_user()` function body (quoted in full in §3) is **byte-for-byte the pre-005 version**. Migration 005 doesn't just add a table alongside existing behavior — it explicitly `CREATE OR REPLACE`s this function with a version that includes a 5th `service_area_zip` column in the `INSERT`. If 005 had been run and something later reverted just the table, the function would still show the post-005 version (nothing else in this codebase touches `handle_new_user` again until migrations well after 005). The fact that the live function matches the *pre*-005 source exactly, is direct proof the migration script never executed — not partially, not once, not ever.
- Separately, I checked for a Supabase CLI migration-tracking table (`supabase_migrations.schema_migrations`) that would log which migrations have been applied via `supabase db push`. **It doesn't exist in this project.** Only the internal `auth.schema_migrations`, `storage.migrations`, and `realtime.schema_migrations` tables exist (Supabase's own internal bookkeeping, unrelated to this app's migrations). This confirms migrations in this project have never been run via the Supabase CLI's tracked-migration workflow — they've always been applied manually (pasted into the Supabase SQL Editor), consistent with this session's own established workflow. There is no ledger to consult; the function-body evidence above is the definitive proof instead.

## 6. Recommendation: fix before `016`, or document and handle afterward?

**Document now (done, both here and in the earlier Priority 1.1 report), fix afterward in its own deliberate migration — not folded into `016`.**

Reasoning:

- **Including it in `016` would violate your own stated constraints for that migration.** `016`'s explicit purpose is to capture *current live state* without changing database behavior. `service_area_waitlist` not existing, and `profiles` lacking those two columns, **is the current live behavior** — silently broken as that behavior is. Creating the table and columns as part of a "baseline capture" would make `016` simultaneously a schema-history migration *and* a undocumented feature-repair migration, which blurs exactly the line you drew when you scoped this as capture-only.
- **This bug and the `016` effort are unrelated in cause.** `016`'s gap exists because migrations were never written for tables created directly in the dashboard. This bug exists because a migration *was* written correctly and simply never got run. Bundling them would misrepresent the fix in the commit history — a future reader of `016` shouldn't have to guess whether a given `CREATE TABLE` reflects "this always existed in prod" or "this was silently missing and I quietly turned it on."
- **There's no data-loss risk either way** — the table has zero rows because it's never existed, so there's nothing to preserve by acting urgently, and nothing extra lost by waiting until right after `016` ships.
- **There is an ongoing cost to waiting, worth naming plainly:** every real signup from an out-of-area ZIP between now and whenever this is fixed is a permanently lost lead — not delayed, lost, since nothing is queued or retried. That's a business reason to fix it *soon*, just not a reason to fix it *inside* the schema-recovery migration.

**Suggested handling:** once `016` is reviewed and shipped, raise this as its own explicit fix — a new migration (`017_service_area_waitlist_repair.sql` or similar) that actually runs `005`'s contents against production, plus a small app-code follow-up to add proper error handling to the four silent call sites in `serviceArea/actions.ts` and the five read sites listed in §3, so a future schema drift like this fails loudly instead of silently. That second part is a real app-code change and would need its own explicit go-ahead from you, separate from this investigation.
