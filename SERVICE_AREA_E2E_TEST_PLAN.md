# Priority 1.1.5 — Commit B Controlled E2E Test Plan

**Branch under test:** `review/service-area-waitlist-commit-b`
**Head commit at time of writing:** `f8972cf46e72233c4db9470b5e78f577c68157de`
**Status:** Plan only. Not executed. No test accounts, records, emails, or Stripe objects have been created.

---

## 0. Contractor B deletion — verified, removed from risk list

Before this plan, a read-only check confirmed Sam's manual deletion of the stale test contractor (id ending `437379388`, "Goldsboro, NC" test account) is complete. Checked directly against production, by exact id match (no ZIP/date filters):

| Location | Rows found |
|---|---|
| `auth.users` | 0 |
| `profiles` | 0 |
| `contractor_profiles` | 0 |
| `contractor_settings` | 0 |
| `contractor_subscriptions` | 0 |
| `contractor_credentials` | 0 |
| `contractor_portfolio_photos` | 0 |
| `service_area_waitlist` (by `user_id`) | 0 |
| `bid_acknowledgments`, `disclaimer_acknowledgments` | 0 |
| Every other FK column in `public` referencing `profiles(id)` (discovered via `information_schema`, 19 columns across `audit_log`, `bids`, `contractor_directory_public`, `coupon_codes`, `inspector_rfis`, `project_attachments`, `project_awards`, `project_inspector_assignments`, `project_revisions`, `projects`, `support_requests`) | 0 |
| `storage.objects` (path containing the id) | 0 |

**Contractor B is fully removed and is no longer an unresolved-account risk.** The only remaining unresolved-account item from the earlier impact report is the other 6 pre-existing UNKNOWN profiles (1 ADMIN, 5 CLIENT) — unaffected by signup/service-area logic since they're not contractors and don't block checkout; no action needed for Commit B itself.

---

## 1. Test Environment Assessment

| Question | Finding |
|---|---|
| Vercel preview deployment for the review branch? | **Yes.** Every push to `review/service-area-waitlist-commit-b` triggers one. |
| Preview URL | `https://onp-git-review-service-area-waitlis-0a7c5b-sam-bravo-s-projects.vercel.app` (branch alias; per-push URLs also exist, e.g. `https://onp-4dg0ynrud-sam-bravo-s-projects.vercel.app` for the current head) |
| Preview build status | **● Error, on all 8 recent preview builds for this branch**, including the current head. Not a code defect in Commit B — see below. |
| Root cause of preview build failure | `next build`'s "Collect page data" step fails on `/api/webhooks/stripe` with `Error: Neither apiKey nor config.authenticator provided` — the Stripe SDK is instantiated at module load, and `STRIPE_SECRET_KEY` (and every other `STRIPE_*` var) is scoped to **Production only** in Vercel, absent from Preview. This is a pre-existing project configuration gap unrelated to any file this task touched. |
| Which Supabase project does Preview use | `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` **are** scoped to Preview (`vercel env ls` shows `Preview, Production`), but both are stored with Vercel's write-only "Sensitive" flag, so even an authenticated `vercel env pull` returns `[SENSITIVE]` instead of the real value — **the actual value cannot be confirmed from the CLI, by design.** Given this project has never had a second Supabase project at any point in this whole effort (confirmed repeatedly across the migration/investigation work — there is exactly one project, `efxjujtetreipxvxxfip`), and Vercel Preview environments default to reusing whatever's scoped to them, the overwhelmingly likely answer is **Preview points at the same production Supabase project as Production.** Flagged as **unconfirmed and needs Sam's direct confirmation** in the Vercel dashboard (Settings → Environment Variables → click into the value) before any Preview-based testing, per stop condition in §6. |
| Does Preview point at production Stripe/Resend | Stripe: **N/A — not present in Preview at all**, which is exactly why the build fails. Resend (`RESEND_API_KEY`): scoped to `Production, Preview` — same masking issue, can't confirm which key, but there's only one Resend account in use throughout this project, so almost certainly the same real account. |
| Can Preview deployments write production cookies correctly | Moot right now — the build never succeeds, so there's no running Preview instance to test against. If the Stripe env gap were fixed, cookie-writing itself would work fine (Server Actions on any successfully deployed Vercel target can set cookies; this isn't Preview-specific). |
| Do Supabase Auth redirect URLs currently permit the preview domain | **Unknown — cannot be checked from here.** This is a Supabase Dashboard → Authentication → URL Configuration setting, not queryable via the Postgres connection, and no Supabase CLI/Management API token is available in this environment (`supabase projects list` returns `LegacyPlatformAuthRequiredError`). Vercel preview URLs are per-deployment random subdomains (`onp-<hash>-sam-bravo-s-projects.vercel.app`), which are essentially never on a default Supabase allow-list unless someone explicitly added a wildcard pattern for `*.vercel.app`. Needs Sam to confirm. |
| Will server actions / email-confirmation signup work from that domain | Cannot verify until the Preview build itself is fixed (out of scope for Commit B — it's a Vercel project setting, not app code) and the redirect-URL question above is answered. |
| Would localhost avoid the redirect-domain issue | **Yes, and it's the recommended environment for this test — see below.** |

### Recommendation: test on `localhost`, not the Vercel Preview URL

1. **Preview is currently non-functional** — the build fails before any page can be served. Fixing that is a separate, unrelated Vercel-configuration task (adding the `STRIPE_*` vars to the Preview scope), not something in scope for Commit B, and not something to do as a side effect of this test plan.
2. **`localhost` has every env var the app needs.** Confirmed present in `.env.local` (names only, no values read into this report): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_*_PRICE_ID`, `RESEND_API_KEY`, `CRON_SECRET`.
3. **Stripe is in test mode locally** — confirmed the key prefixes are `sk_test_` / `pk_test_` (checked the prefix only, never printed the key). Even if the fail-closed gate were somehow bypassed, no real charge could occur.
4. **`localhost:3000` is Supabase's default pre-approved redirect** on new projects, and is far more likely to already be on this project's allow-list than a random Preview subdomain — still needs Sam's confirmation (see §7), but it's the better bet.
5. **Same Supabase project either way.** `.env.local`'s `NEXT_PUBLIC_SUPABASE_URL` is confirmed to point at the same production project (`efxjujtetreipxvxxfip`) referenced throughout this entire effort. There is no separate staging database — testing on localhost against Migration 017 **is** testing against the real production schema and the real `auth.users`/`profiles`/`service_area_waitlist` tables. This is exactly what the task asked for ("verify final application behavior against the live Migration 017 schema"), but it means the no-side-effect and cleanup discipline in §4–§5 is not optional risk-reduction — it's the only thing standing between this test and real production data.
6. **The checked-out code must be the review branch's exact head.** Run `git status --porcelain` (expect clean) and `git rev-parse HEAD` (expect `f8972cf46e72233c4db9470b5e78f577c68157de`) immediately before starting `npm run dev`, and again immediately before each of the two signups, in case anything changes mid-session.
7. **Email confirmation links will not redirect to localhost.** No `/auth/callback` or `/auth/confirm` route exists in this codebase, and `performTrustedSignup()` doesn't pass `emailRedirectTo`, so Supabase Auth uses the project's default Site URL — almost certainly `https://ournextproject.us` — as the redirect target baked into the confirmation email. **This is expected, not a bug**: clicking the link will land on production's domain (harmlessly, since it's just Supabase's own hosted verification hitting `{Site URL}/#access_token=...`), confirming `email_confirmed_at` server-side regardless of where the link happens to redirect the browser afterward. After confirming, separately navigate to `http://localhost:3000/login` to test the app's own login/dashboard behavior. Don't be confused if the post-click landing page looks like production — that's the confirmation redirect, not the environment being tested.

---

## 2. Test Identity Matrix

Both accounts require real, Sam-controlled inboxes capable of receiving Supabase's confirmation email. **No addresses are invented here** — Sam must supply two, ideally using a "+" alias off a single inbox he controls (e.g. `sam+onptest-a@…`, `sam+onptest-b@…`) so both are unambiguously his and trivially distinguishable in cleanup queries, but any two addresses he confirms he owns and can check are acceptable.

| | Test A (Client) | Test B (Contractor) |
|---|---|---|
| Role | CLIENT | CONTRACTOR |
| ZIP entered | `79912` (confirmed present in `LAUNCH_SERVICE_AREA_ZIPS`, El Paso TX) | `10001` (Manhattan, NY — unambiguously outside El Paso/Las Cruces, not near any launch ZIP) |
| Expected `profiles.service_area_status` | `IN_AREA` | `OUT_OF_AREA` |
| Expected `profiles.service_area_zip` | `79912` | `10001` |
| Expected `service_area_waitlist` rows | 0 | exactly 1 |
| Expected waitlist row fields | n/a | `user_id` = Test B's auth id, `intended_role` = `CONTRACTOR`, `source` = `SIGNUP_BLOCKED`, `zip` = `10001`, `email` = normalized (lowercased/trimmed) Test B address |
| Password | any ≥8-char password Sam chooses, not reused elsewhere | same |
| Business name / disclaimer | n/a | any placeholder business name; must check the terms checkbox and type the matching name in the UI (client-side gate) — server-side `terms_agreed` is independently re-validated per Commit B's hardening |

---

## 3. Exact Test Steps

Run `npm run dev` from `C:\Users\samue\Documents\bid-depository` on the `review/service-area-waitlist-commit-b` branch (verify SHA per §1.6) and open `http://localhost:3000`.

### A. Client signup with email confirmation (Test A)

1. Navigate to `/signup`. Enter display name, Test A's email, a password, ZIP `79912`.
2. Submit. **Browser check:** the button shows the busy state (`Creating...`), then a message containing "Check your email to confirm your account" appears — **not** a redirect to `/dashboard` (confirms no session was returned, matching Supabase's email-confirmation-enabled setting).
3. **DB check (immediately after step 2, before touching email):**
   ```sql
   select id, email, email_confirmed_at, raw_user_meta_data
   from auth.users
   where lower(email) = lower('<Test A email>');
   ```
   Expect: exactly one row, `email_confirmed_at IS NULL`, `raw_user_meta_data->>'service_area_zip' = '79912'`, `raw_user_meta_data->>'signup_role' = 'CLIENT'`.
4. **DB check — service-area processing ran despite no session:**
   ```sql
   select id, role, service_area_zip, service_area_status
   from profiles
   where id = '<id from step 3>';
   ```
   Expect: `role = 'CLIENT'`, `service_area_zip = '79912'`, `service_area_status = 'IN_AREA'`. This is the crux of the whole "no-session" fix from the prior revision — confirm it actually fires, not just that the code compiles.
5. **DB check — no waitlist row:**
   ```sql
   select count(*) from service_area_waitlist where user_id = '<id>';
   ```
   Expect `0`.
6. Open the confirmation email in Test A's inbox. Click the confirmation link. **Browser check:** lands on production's domain per §1's note — this is expected. Confirm `auth.users.email_confirmed_at` is now non-null:
   ```sql
   select email_confirmed_at from auth.users where id = '<id>';
   ```
7. Return to `http://localhost:3000/login`, log in as Test A. **Browser check:** redirected to `/dashboard/client` (or `/dashboard`, whichever the login route sends CLIENT to), no out-of-area banner shown, no console errors.

### B. Contractor signup with email confirmation (Test B)

1. Navigate to `/signup/contractor`. Enter business name, Test B's email, password, ZIP `10001`. Type the business name again in the confirmation field, check the terms box.
2. Submit. **Browser check:** busy state, then "Check your email to confirm your account" **plus** the out-of-area waitlist sentence (`emailConfirmationMessage`'s `out_of_area` branch — "Your ZIP (10001) is outside our current service area, so we've also added you to our expansion waitlist.").
3. **DB check — Auth user + metadata:**
   ```sql
   select id, email, email_confirmed_at, raw_user_meta_data
   from auth.users where lower(email) = lower('<Test B email>');
   ```
   Expect `raw_user_meta_data->>'service_area_zip' = '10001'`, `signup_role = 'CONTRACTOR'`, `bid_disclaimer_agreed = true`, `bid_disclaimer_version = 'v1.0-2026-05-25'`.
4. **DB check — profile:**
   ```sql
   select role, service_area_zip, service_area_status from profiles where id = '<id>';
   ```
   Expect `CONTRACTOR` / `10001` / `OUT_OF_AREA`.
5. **DB check — waitlist row created before confirmation** (this is the point of the fix — verify it exists *now*, pre-confirmation, not after):
   ```sql
   select id, email, zip, user_id, intended_role, source, notified_at
   from service_area_waitlist
   where user_id = '<id>';
   ```
   Expect exactly 1 row: `email` = lowercased/trimmed Test B address, `zip = '10001'`, `intended_role = 'CONTRACTOR'`, `source = 'SIGNUP_BLOCKED'`, `notified_at IS NULL`.
6. **Duplicate-retry check:** without touching the DB, resubmit the same contractor signup form with the same email (expect Supabase to reject as "already registered" — that's a separate, expected `auth_failed` path, not a waitlist dedup test). Instead, to test waitlist dedup specifically: go to `/signup/out-of-area?zip=10001&waitlist=failed&role=CONTRACTOR` directly (or reach it by temporarily forcing a failure — simplest is to use the embedded `WaitlistForm` retry on the real out-of-area page Test B was routed to, if reachable, or the `/login#waitlist` form) and submit Test B's same email + ZIP again. **DB check:** row count for that `user_id`/email should still be **1**, and the second call's return value (visible as the green "already on the waitlist" confirmation in the UI) confirms the `23505`-based dedup path, not a second insert.
7. Confirm Test B's email (click the link). Log in at `http://localhost:3000/login`. **Browser check:** contractor dashboard shows the out-of-area waitlist banner with ZIP `10001`.
8. Navigate to `/dashboard/contractor/subscribe`. **Browser check:** no checkout form rendered at all — only the out-of-area blocking message (fail-closed gate from the earlier hardening). Confirm there is no `<form action={createCheckoutSession...}>` in the rendered HTML (view source / inspect).
9. **Stripe check:** in the Stripe test-mode dashboard, confirm no customer or Checkout Session exists for Test B's email. (Expected: none, since the gate blocks the action before any Stripe call — this step is a negative-result confirmation, not expected to find anything.)

### C. Anonymous/manual waitlist — reuse Test B, don't create a third identity

Recommend testing this **using Test A's email with a different ZIP/role**, not Test B's, and not a third identity:
- Reusing **Test B's** email/zip/role would collide with the exact row already asserted in B.5–B.6 and make it ambiguous whether a later assertion is seeing the signup-created row or a new anonymous one.
- Reusing **Test A's** email (already confirmed IN_AREA, no waitlist row) with `intended_role=UNKNOWN, source=HOMEPAGE`, and a different out-of-area ZIP (e.g. `10001` again, or `20001`) on the `/login#waitlist` form creates a **new, distinguishable** row — `(lower(email), zip, intended_role)` differs from anything else in the test — while still only touching identities already in the cleanup set. No third disposable email needed.

Steps: go to `/login`, scroll to the waitlist section, submit Test A's email with ZIP `20001`. **DB check:**
```sql
select * from service_area_waitlist where lower(email) = lower('<Test A email>');
```
Expect exactly 1 row (`intended_role = 'UNKNOWN'`, `source = 'HOMEPAGE'`, `user_id IS NULL` — anonymous form never attaches a user id even though Test A happens to be a real account, since `joinWaitlist` never looks up or requires a session).

### D. Admin verification

1. Log in as an existing ADMIN account (not a new one — reuse whatever admin already exists in production; do not create one).
2. `/dashboard/admin/waitlist`: confirm Test B's row and Test A's anonymous row both appear, with correct ZIP/role/source badges and non-invented city/state (both should show blank/`—` since neither test ZIP has city/state populated by the app — this is expected, not a bug).
3. **Do not** simulate the empty-vs-error distinction by damaging production (e.g. don't revoke DB permissions or drop the table). If verifying that specific behavior is wanted, do it separately in a throwaway database exactly like the one used for Migration 017's own testing — out of scope for this E2E pass, which is about the live schema's happy/expected paths.
4. Click "Export CSV." **Check:** the downloaded file includes both test rows, headers match `email, zip, city, state, intended_role, source, notes, notified_at, created_at`, and any comma/quote in a field (unlikely here, but check) is escaped per the existing logic.
5. Use `updateWaitlistNotes` (if wired to a UI element) or call it once on Test B's row with a short note like `"E2E test — safe to delete"` — confirms the typed success/failure result path added in the admin hardening. Delete this note as part of cleanup (moot, since the whole row gets deleted).
6. **Do not** use the "Notify Waitlist on Expansion" tool at all — leaving it untouched is sufficient to confirm "no expansion email sent." No action needed here beyond restraint.

---

## 4. No-Side-Effect Rules — how each is enforced by this plan

| Rule | Enforcement |
|---|---|
| No Stripe Checkout Sessions | Step B.8–B.9 confirms the fail-closed gate never renders/reaches the checkout action for an OUT_OF_AREA contractor. Test A (CLIENT) never touches the subscribe page at all. |
| No Stripe customers where avoidable | Same as above — customer creation happens only inside `createCheckoutSession`, which is never invoked. |
| No waitlist expansion emails | §3.D.6 — the notify tool is simply never used. |
| No alteration of real users/waitlist entries | Both test accounts are new; `updateWaitlistNotes` in §3.D.5 only touches Test B's own newly-created row. |
| No launch ZIP config changes | Test ZIPs are read-only lookups against the existing `LAUNCH_SERVICE_AREA_ZIPS` set; nothing in this plan edits `launchZips.ts`. |
| No migration/schema changes | Nothing in this plan touches `supabase/migrations/`. |
| No leftover test records | §5 cleanup plan below, verified by id/email, not broad filters. |

---

## 5. Cleanup Plan

### 5.1 Every location that could receive data from these two signups

Derived the same way as the Contractor B verification in §0 — via `information_schema` FK discovery, not just memory:

| Table | Column(s) | Populated by which test |
|---|---|---|
| `auth.users` | `id` | A, B (root identity — everything else cascades from this) |
| `profiles` | `id` | A, B (created by `handle_new_user()` trigger on `auth.users` insert) |
| `contractor_profiles` | `contractor_id` | **Not populated by signup itself** — this table is only written by the separate contractor-profile-completion flow, which these tests never reach. Confirm empty for Test B's id as a check, not a cleanup target. |
| `contractor_settings` | `contractor_id` | Not populated by signup. Same as above — confirm empty. |
| `contractor_subscriptions` | `contractor_id` | Not populated — no checkout ever occurs (§4). Confirm empty. |
| `contractor_credentials` | `contractor_id` | Not populated. Confirm empty. |
| `contractor_portfolio_photos` | `contractor_id` | Not populated. Confirm empty. |
| `bid_acknowledgments` | `contractor_id` | Not populated (no bids placed). Confirm empty. |
| `disclaimer_acknowledgments` | `user_id` | Possibly — check if `bid_disclaimer_agreed` in metadata also inserts a row here separately from the `auth.users` metadata flag; confirm and delete if found. |
| `service_area_waitlist` | `user_id`, and `email` for the anonymous row | B (signup-linked), A (anonymous, §3.C) |
| `storage.objects` | path containing the id | Not expected (no file uploads in these flows). Confirm empty. |
| Every other FK-to-`profiles(id)` column from §0's list (`audit_log.actor_id`, `bids.contractor_id`, `contractor_directory_public.contractor_id`, `coupon_codes.created_by`, `inspector_rfis.*`, `project_attachments.uploaded_by`, `project_awards.*`, `project_inspector_assignments.inspector_id`, `project_revisions.created_by`, `projects.client_id`/`urgent_set_by`, `support_requests.*`) | — | Not expected to be populated by signup alone — confirm empty for both ids as a sweep, same as §0's discovery query. |

### 5.2 Dependency-ordered deletion (children before parents)

Run inside a single transaction, identifying rows **only** by the two disposable auth ids captured during testing (call them `:test_a_id` and `:test_b_id`) and their exact normalized emails — never by ZIP or date range:

```sql
BEGIN;

-- 1. Waitlist rows (both the signup-linked one for B and the anonymous one for A)
DELETE FROM service_area_waitlist
WHERE user_id IN (:test_a_id, :test_b_id)
   OR lower(email) IN (lower(':test_a_email'), lower(':test_b_email'));

-- 2. Any confirmed-empty child tables from §5.1 — included defensively in case
--    something unexpected got written; each is a no-op if truly empty.
DELETE FROM disclaimer_acknowledgments WHERE user_id IN (:test_a_id, :test_b_id);
DELETE FROM bid_acknowledgments WHERE contractor_id IN (:test_a_id, :test_b_id);
DELETE FROM contractor_credentials WHERE contractor_id IN (:test_a_id, :test_b_id);
DELETE FROM contractor_portfolio_photos WHERE contractor_id IN (:test_a_id, :test_b_id);
DELETE FROM contractor_settings WHERE contractor_id IN (:test_a_id, :test_b_id);
DELETE FROM contractor_subscriptions WHERE contractor_id IN (:test_a_id, :test_b_id);
DELETE FROM contractor_profiles WHERE contractor_id IN (:test_a_id, :test_b_id);

-- 3. profiles (references auth.users, must precede the auth.users delete)
DELETE FROM profiles WHERE id IN (:test_a_id, :test_b_id);

COMMIT;
```

```sql
-- 4. auth.users — via the Supabase Admin API (supabaseAdmin.auth.admin.deleteUser),
--    NOT a raw SQL DELETE against auth.users, since Supabase Auth has internal
--    bookkeeping (identities, sessions, refresh tokens) that only its own admin
--    API deletes correctly. Run for both ids separately, confirm each call
--    returns success before proceeding.
```

Storage: confirmed empty in §5.1 — no deletion needed, but re-check post-hoc per §5.3.

### 5.3 Post-cleanup verification (independent re-query, not just "the script said success")

```sql
select count(*) from auth.users where id in (:test_a_id, :test_b_id); -- expect 0
select count(*) from profiles where id in (:test_a_id, :test_b_id); -- expect 0
select count(*) from service_area_waitlist
  where user_id in (:test_a_id, :test_b_id)
     or lower(email) in (lower(':test_a_email'), lower(':test_b_email')); -- expect 0
select count(*) from contractor_profiles where contractor_id in (:test_a_id, :test_b_id); -- expect 0
select count(*) from contractor_subscriptions where contractor_id in (:test_a_id, :test_b_id); -- expect 0
select count(*) from storage.objects where name ilike '%' || :test_a_id || '%' or name ilike '%' || :test_b_id || '%'; -- expect 0
```
Plus a Stripe test-mode dashboard check: search customers/sessions by Test A/B's email — expect no results (none should ever have been created per §4).

### 5.4 Row-count reconciliation

Capture full row counts for every table touched above **immediately before** Test A's signup (the pre-test snapshot in §7) and again **immediately after** cleanup. They must match exactly, except for whatever unrelated legitimate production activity (real signups, real bids, etc.) occurs in the test window — which is why the snapshot should be taken as close to the test start as possible and the comparison should be "no *new* rows other than accounted-for real activity," not a strict equality assumption.

---

## 6. Stop Conditions

Stop immediately, before creating any account, if any of the following is true:

1. Preview environment (if used instead of localhost) turns out to point at anything other than the confirmed production Supabase project — or can't be confirmed at all.
2. Supabase Auth's redirect-URL allow-list does not include the domain actually being used (localhost or Preview) — confirmed by Sam checking the dashboard, not assumed.
3. `git rev-parse HEAD` on the running checkout does not equal `f8972cf46e72233c4db9470b5e78f577c68157de`.
4. Local `.env.local`'s `NEXT_PUBLIC_SUPABASE_URL` does not match the confirmed production project ref (`efxjujtetreipxvxxfip`) — i.e., if it's ever pointed somewhere unexpected.
5. Any step produces `profiles.service_area_status` or `service_area_waitlist` contents different from the expected values in §2/§3 — stop and diagnose before continuing to the next step, don't push through with more test data.
6. Any Stripe object (customer, session, price lookup with a real charge) appears for either test identity.
7. Any query in §3/§5 returns a row that isn't unambiguously identified by the two disposable ids/emails — if cleanup targeting would be ambiguous for any reason (e.g. an id collision, a shared email with a real account), stop and resolve the ambiguity manually before deleting anything.
8. Anything suggests a real user/account was affected (e.g. an unexpected row shows up for an id not in the test set).
9. Stripe keys in use are ever `sk_live_`/`pk_live_` instead of `sk_test_`/`pk_test_` — re-check immediately before testing, not just once now.

---

## 7. Exact information needed from Sam before execution

1. **Two disposable email addresses** he controls and can check for the Supabase confirmation email (see §2 — "+" aliases recommended but not required).
2. **Confirmation that `localhost:3000` (or whichever host/port `npm run dev` actually binds) is on Supabase's Auth redirect allow-list** — Dashboard → Authentication → URL Configuration → Redirect URLs. If not, either add it (a config change, not a code change — outside Commit B's diff) or confirm the plan can proceed anyway since the confirmation link itself doesn't strictly require landing on localhost (see §1.7).
3. **Explicit go-ahead to actually run the two signups** — this plan produces zero test data on its own; nothing happens until Sam approves execution with the two addresses from item 1.
4. Optional but useful: confirmation of which existing ADMIN account to use for §3.D (admin verification), since no new admin should be created.

---

## Estimated external side effects if executed exactly as planned

- **2 real Supabase Auth confirmation emails** sent by Supabase itself to Sam-controlled addresses (expected and authorized once addresses are supplied).
- **0** Stripe objects (test-mode keys in use regardless, and the gate should prevent any call).
- **0** Resend-triggered emails (the only Resend-sending code path, waitlist expansion notification, is never invoked per §3.D.6).
- **2 Auth users, 2 profiles rows, 1–2 `service_area_waitlist` rows** created temporarily, all deleted per §5, verified per §5.3.
- **No changes** to any pre-existing production row, migration, or schema object.
