# Priority 1.1.5 — Service Area Waitlist Repair: Design Review

No database or application changes made. No SQL written. This is the design review only, per instruction.

---

## 1. Existing Intended Design

### Workflow A — New client, in-area ZIP
1. Client fills out `/signup` (name, email, password, ZIP).
2. `supabase.auth.signUp()` fires client-side, with `service_area_zip` embedded in `options.data` (→ `auth.users.raw_user_meta_data`, durable regardless of what happens next — see §9).
3. `handle_new_user()` trigger fires, inserts a `profiles` row. **Only `id, role, display_name, company_name`** — the live trigger is the pre-005 version and never touches `service_area_zip`.
4. Client code calls `processSignupServiceArea(userId, zip, email, "CLIENT")`.
5. `isInServiceArea(zip)` (pure in-memory ZIP-list check, `src/lib/serviceArea/launchZips.ts`) returns `true`.
6. **DB write attempted:** `profiles.update({ service_area_zip, service_area_status: "IN_AREA" }).eq("id", userId)` — **fails silently** (columns don't exist), error never checked.
7. No waitlist insert (in-area branch skips it).
8. Redirect: `router.push("/dashboard")`.
9. **User-facing message:** none — clean redirect, no error surfaced.
10. **Net effect:** account works normally. The only casualty is that `profiles.service_area_status` was never durably set to `IN_AREA` — invisible today because nothing currently blocks in-area users on that status.

### Workflow B — New contractor, in-area ZIP
Same shape as A, via `/signup/contractor`, role `"CONTRACTOR"`, plus the bid-disclaimer acknowledgment fields (unrelated to this repair). Same silent-failure outcome.

### Workflow C — New client, out-of-area ZIP
Steps 1-4 as above, then:
5. `isInServiceArea(zip)` returns `false`.
6. **DB write attempted:** same `profiles.update(...)` with `status: "OUT_OF_AREA"` — fails silently.
7. **DB write attempted:** `service_area_waitlist.insert({ email, zip, intended_role: "CLIENT", source: "SIGNUP_BLOCKED" })` — **fails, table doesn't exist**, error never checked.
8. Redirect: `router.push("/signup/out-of-area?zip=...")`.
9. **User-facing message:** the out-of-area page states, as fact, *"We've automatically added you to our expansion waitlist"* — **this is currently false**. It also says to *"update your ZIP in your profile to unlock full access"*, linking to `/dashboard/client/profile` — that page's ZIP field is `address_zip` (business mailing address), a completely different column with no connection to `service_area_status`. **Following that instruction does nothing to unlock access even if the columns existed.**
10. **Net effect:** the client can browse the dashboard but is never actually captured as a lead, and the one recovery path the UI offers doesn't work by design, not just by bug.

### Workflow D — New contractor, out-of-area ZIP
Same as C via `/signup/contractor`. Same false claim, same broken recovery link (this one points to the contractor profile page instead, same underlying issue — `address_zip` there is likewise unrelated to service-area gating).

### Workflow E — Anonymous visitor joins waitlist without signing up
Two entry points, both public, no auth required:
- `/login#waitlist` (homepage-style widget on the login page) — hidden fields `source=HOMEPAGE`, `intended_role=UNKNOWN`.
- `/dashboard/client/projects/new` — shown to an already-out-of-area logged-in client trying to post a project; hidden field `source=PROJECT_POST_BLOCKED`.

Both submit to the same server action, `joinWaitlist(formData)`:
- **Input:** email, zip (both required, else silently returns with no error).
- **DB write attempted:** `service_area_waitlist.insert({ email, zip, intended_role, source })` — fails, table doesn't exist, error never checked.
- **Redirect:** none. `joinWaitlist` never calls `redirect()`.
- **User-facing message:** both call sites render a success banner gated on a URL search param (`sp.waitlist === "joined"`) that **nothing ever sets** — since there's no redirect, the URL never changes, so **this confirmation banner can never appear through normal use**, independent of the missing-table bug. Two separate defects stacking on the same feature.
- **Net effect:** the visitor sees the form just sit there (page re-renders via Next's default server-action revalidation, nothing visibly changes), gets no confirmation, and no row is written.

### Workflow F — Admin reviews, exports, filters, and notifies
`/dashboard/admin/waitlist` (`page.tsx`):
- **Reads:** `service_area_waitlist.select("id, email, zip, city, state, intended_role, source, notes, notified_at, created_at")`, optionally filtered by `state`/`source`. Computes total/notified/last-30-days counts and top-ZIP/top-state aggregates client-side from the result set.
- Since the table doesn't exist, this query's `data` is `null` → `rows = []` → the page renders "No waitlist entries yet." — **not an error state, a plausible-looking empty state**, which is arguably worse than a visible error since it gives no signal anything is wrong.
- Also worth noting even once the table exists: **`city`/`state` are never populated by either write path** (`processSignupServiceArea` and `joinWaitlist` only ever insert `email`/`zip`/`intended_role`/`source`). The "Top States" panel is designed to always be empty regardless of the persistence bug, unless something is added to derive city/state from ZIP.
- **CSV export** (`/api/admin/waitlist-export`): same columns, same table, same current failure mode (empty CSV, not an error).
- **Bulk notify** (`notifyWaitlistByZips`): parses a ZIP list from a textarea, queries `service_area_waitlist` for unnotified rows matching those ZIPs, sends each an email via `sendWaitlistExpansionEmail` (confirmed present in `src/lib/email.ts`), marks `notified_at` on success, redirects with a count. Currently always redirects to the `no_entries` error path, since the query always returns nothing.
- **Admin dashboard tile** (`dashboard/admin/page.tsx`): counts unnotified waitlist rows for a summary badge — always reads 0 today.
- **`updateWaitlistNotes`**: admin-editable free-text note per row — currently unreachable since no rows exist to edit.

---

## 2. Migration 005 Review

Read line-by-line against live schema, `016`, current app code, and the live `handle_new_user()`.

**Table definition (`service_area_waitlist`)** — schema itself is not obviously wrong, but:
- **Obsolete assumption:** written as if it would be applied once, immediately, to a database with no history. It was never applied at all (confirmed with direct evidence in the earlier investigation), so there's no drift from *changes since* — the drift is that **zero** of it reflects current reality.
- **No `user_id` column** — `processSignupServiceArea` receives a `userId` but never stores it on the waitlist row. A registered user's waitlist entry and their account are only ever linkable by matching `email` strings. This was true in 005's original design too — not a regression, but worth re-deciding now (§4).
- **No uniqueness constraint at all** — every resubmission (a user refreshing the out-of-area page, retrying a flaky request, or hitting the homepage form twice) creates a fresh duplicate row forever. Not caught by anything at the DB layer. Real gap (§5).
- **Indexes** (`zip`, `state, zip`) are reasonable for the current filter UI. No index on `email` — would help both dedup lookups and the future "visitor joins, then signs up" reconciliation (§5).

**Column/default mismatches:** none found relative to what the *table* was meant to have — the table simply doesn't exist, so there's nothing live to mismatch against. The real column mismatch is `profiles`, not `service_area_waitlist`.

**`profiles.service_area_zip` / `profiles.service_area_status`:** 005 adds these with `service_area_status DEFAULT 'UNKNOWN'`. Given the trigger and app code, this default is reasonable *if applied at signup time going forward* — but see §3 for the backfill question, which 005 never addressed for **existing** rows (005 was written assuming it would run before any users existed, or at least didn't consider the backfill case explicitly).

**Trigger-function conflict:** confirmed directly — the live `handle_new_user()` is the *pre*-005 version. 005's version is a `CREATE OR REPLACE`, which is safe to reapply (idempotent by nature), but it must be re-verified against the *current* function, not blindly reused, because other migrations may have touched `handle_new_user()` between 005 being written and today. Checked: no other tracked migration touches `handle_new_user()`. It's safe to reapply 005's version as-is, column-wise — but seven months of drift is long enough that "safe and complete today" needs re-confirmation on every rebuild, not a standing assumption once and for all.

**Missing constraints:** no `CHECK` on `intended_role` (comment lists 4 valid values, nothing enforces them — a typo'd role value would silently corrupt filtering/aggregation) or on `source` (comment lists 3 valid values, same issue). Neither existed in 005 originally; worth adding now since we're deciding this deliberately rather than copying blind.

**Missing indexes:** no `email` index (see above).

**Missing RLS policies:** 005's 3 policies (anyone can INSERT, admin-only SELECT, admin-only UPDATE) are a reasonable starting point but don't distinguish an authenticated user updating their *own* pending row (there is no update-your-own-entry use case in the app today, so this is fine as originally scoped — flagging only because §7 revisits this from a security angle).

**Duplicate-entry behavior:** not addressed at all in 005 (no unique constraint, no `ON CONFLICT` in either app-code insert). Real gap, addressed in §5.

**Nullability concerns:** `city`/`state`/`notes`/`intended_role`/`notified_at` all nullable — reasonable, matches that they're either optional or state-transition fields. `email`/`zip` NOT NULL — correct, both are always provided by every current call site.

**Role or account-type assumptions:** `intended_role` stores a free-text guess (`CLIENT`/`CONTRACTOR`/`BOTH`/`UNKNOWN`), not a foreign key to anything, and isn't reconciled against the account's actual `profiles.role` if/when they do sign up. Acceptable for a lead-capture table (the account doesn't necessarily exist yet), but worth naming as an inherent limitation, not an oversight.

**Conclusion: 005 is not safe to reuse verbatim.** The table shape is close but needs a `user_id` column, a uniqueness strategy, two `CHECK` constraints, and an `email` index added on top of what 005 originally specified. The `handle_new_user()` update is reusable as-is, contents-wise, but must be captured fresh from a re-diff against the *current* live function at the moment 017 is actually written, not copy-pasted from 005 or from this review.

---

## 3. Proposed Migration 017 (design only — not written)

`supabase/migrations/017_service_area_infrastructure_repair.sql` would, in order:

1. **`CREATE TABLE IF NOT EXISTS public.service_area_waitlist`** — native idempotent guard, safe on re-run. Full column proposal in §4.
2. **`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS service_area_zip TEXT`** and **`... ADD COLUMN IF NOT EXISTS service_area_status TEXT DEFAULT 'UNKNOWN'`** — both natively idempotent, non-destructive, never touch existing column values if the columns somehow already existed.
3. **`handle_new_user()` update** — `CREATE OR REPLACE FUNCTION`, re-diffed against the *current* live body (not 005's, not this review's memory of it) at write-time, adding the `service_area_zip` insert column exactly as 005 intended: reading it from `NEW.raw_user_meta_data->>'service_area_zip'`. This is safe because `CREATE OR REPLACE` never loses existing behavior for unrelated columns (`role`, `display_name`, `company_name` inserts stay untouched) — it only adds the one new column to the `INSERT`.
4. **RLS enable + policies** on the new table — `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, policies added via the catalog-guarded `DO $$ IF NOT EXISTS ... $$` pattern established in `016`, so re-running 017 is always safe. Exact policy logic proposed in §7.
5. **Constraints and indexes** — `CHECK` on `intended_role` and `source`, a uniqueness constraint per §5's recommendation, `email` index, plus 005's original `zip`/`state,zip` indexes — all via `IF NOT EXISTS` / catalog-guard patterns.
6. **Existing `profiles` rows** — see the explicit decision below. Not silently backfilled.
7. **Duplicate waitlist submissions** — handled by the uniqueness constraint plus `ON CONFLICT` in the *application* insert calls (a database constraint alone doesn't change app behavior; the app-code change in Commit B needs to add `ON CONFLICT ... DO NOTHING` / `DO UPDATE`, per §5).
8. **Preserving existing production data** — nothing in 017 touches `bids`, `projects`, or any other table; every statement is additive (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, guarded policy/constraint blocks). No `DROP`, no data-modifying `UPDATE` beyond the explicit backfill decision below, which would be scoped only to the two new columns on `profiles`.
9. **Safe to run twice** — every individual statement uses a native or catalog-guarded idempotent form, consistent with `016`'s established patterns; would be validated the same way (rolled-back transaction against production, plus a from-scratch rebuild test) before being proposed as final.

### Backfill decision — not made silently, needs your call

**Existing `profiles` rows have no ZIP on file anywhere reliable enough to backfill `service_area_status` from.** Options, with tradeoffs:

- **(a) Leave `service_area_status` at its column default (`'UNKNOWN'`) for all existing rows, do nothing else.** Simplest, no risk of mislabeling anyone. Downside: every existing user reads as `UNKNOWN` forever unless they re-trigger the signup flow (they won't) or an admin manually sets it.
- **(b) Attempt a best-effort backfill from `auth.users.raw_user_meta_data->>'service_area_zip'`** (see §9 — this data plausibly exists for most signups going back to when these signup pages were written) **for existing rows only, computed via `isInServiceArea()`'s ZIP list.** More complete, but touches real user rows with inferred data, and the current launch-ZIP list might not exactly match what was true at each historical signup's time (the service area could have changed since).
- **(c) Derive from `contractor_profiles.address_zip` / a client's `profiles.address_zip`-equivalent** where available, as a fallback signal. Only applicable to contractors and clients who've filled in a business/mailing address since signing up — not the same thing as their signup-time ZIP, and could be wrong if they moved or the address is for a different purpose (e.g., billing vs. service location).

**My recommendation, not a decision:** (a) for the migration itself (schema-only, no inferred data written), with (b) as a *separately proposed, explicitly reviewed* one-time backfill script if you want it — kept out of 017 so the schema migration and the data-inference operation can be reviewed and approved independently. I'm flagging this because guessing wrong here writes plausible-looking but potentially incorrect `service_area_status` values across real accounts, which is worse than leaving them honestly unknown.

---

## 4. Waitlist Data Model Review

### Required for the existing feature

| Column | Type | Nullable | Default | FK | Purpose |
|---|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | — | Primary key |
| `email` | `text` | NO | — | — | Contact for notification; only required field for an anonymous join |
| `zip` | `text` | NO | — | — | Drives the "notify by ZIP" expansion workflow |
| `user_id` | `uuid` | YES | — | `auth.users(id)`, nullable | **New vs. 005.** Links a signup-triggered entry to the real account; NULL for anonymous joins. Distinguishes anonymous vs. registered per §4's explicit ask, without forcing every insert to have an account. |
| `intended_role` | `text` | YES | `'UNKNOWN'` | — | CLIENT / CONTRACTOR / BOTH / UNKNOWN — add a `CHECK` |
| `source` | `text` | NO | `'HOMEPAGE'` | — | HOMEPAGE / SIGNUP_BLOCKED / PROJECT_POST_BLOCKED — add a `CHECK`; distinguishes signup-generated from manually-submitted per your ask |
| `notified_at` | `timestamptz` | YES | — | — | Notification status + date in one column (NULL = not notified) |
| `created_at` | `timestamptz` | NO | `now()` | — | Created date |

`city`/`state`/`notes` (from 005) are kept as **required for the existing feature** in the sense that the admin UI already renders them — but see the honest caveat: no current write path ever populates `city`/`state`, so keeping them is "required to not break the existing admin page's column list," not "required because they're functional today." That gap (deriving city/state from ZIP) is a real but separate follow-up, not scope-creep to solve inside 017.

### Optional future enhancements (explicitly not adding now)

- A ZIP-to-city/state lookup (would make `city`/`state` actually populate) — real product value, but a separate, non-trivial piece of work (needs a ZIP database or geocoding call), not part of a schema-repair migration.
- An `expansion_market` flag or a separate markets table (grouping ZIPs into named expansion regions) — would improve the bulk-notify workflow's ergonomics (notify by named market instead of pasting a ZIP list) but isn't needed for the *existing* feature to function.
- Duplicate-submission audit trail (a log of every resubmission attempt, not just the deduped final row) — could be useful for demand-measurement analytics later, not required to fix the current break.

I'm listing these explicitly so they're visible and deferred on purpose, not silently dropped.

---

## 5. Duplicate and Identity Rules

| Scenario | Recommended behavior |
|---|---|
| Same email submits the same ZIP twice | **No duplicate row.** Idempotent — the second submission is a no-op against the existing row (optionally bumps nothing, or refreshes `created_at`/adds a resubmission counter if you want that signal later — not required now). |
| Same email submits different ZIPs | **Two separate rows.** Distinct interest signals (e.g., moved, or interested in two locations) are legitimate and shouldn't be collapsed. |
| Same registered user signs up more than once | Not possible today (Supabase Auth enforces unique email at the account level) — not a case this table needs to handle. |
| A visitor joins the waitlist, later creates an account | **Two rows initially** (the anonymous join has `user_id = NULL`; the signup-triggered one, if out-of-area, has `user_id` set). Reconciling them (recognizing the same person) is a nice-to-have, not required for correctness — recommend leaving them as separate rows rather than attempting fuzzy email-matching reconciliation logic, which is more complexity than the current feature needs. |
| A contractor and client share a company email | **Two rows, correctly.** `email` alone is not the account identity — `user_id` (when present) is. A shared inbox submitting once as a prospective client and once as a prospective contractor is two genuine, distinct interest signals and should not be deduplicated against each other. |
| An admin imports or creates a duplicate record | Not a current feature (no admin "add waitlist entry" UI exists today) — out of scope until/unless that UI is built. |

**Recommended constraint:** `UNIQUE (email, zip)` — satisfies the "same email + same ZIP → one row" rule while allowing "same email + different ZIP" and "different emails, same ZIP" (e.g., a whole neighborhood) freely. Paired with `INSERT ... ON CONFLICT (email, zip) DO NOTHING` in both app-code insert paths (Commit B), so a resubmission is a clean no-op instead of an unhandled constraint-violation error.

I'm **not** recommending a `UNIQUE (user_id)` partial constraint (limiting a registered user to exactly one waitlist row regardless of ZIP) — a user who signs up once, gets waitlisted, and years later tries again from a different ZIP should be able to register that as a new signal, consistent with the "different ZIP → new row" rule applying uniformly regardless of whether the row originated from signup or an anonymous form.

---

## 6. Application Error-Handling Plan

Audited every affected call site. "Critical" = the operation's own primary purpose fails if this write/read fails. "Best-effort" = a secondary side-effect that shouldn't block the primary action.

| Call site | Current behavior | Possible error | Critical or best-effort | Should log | User sees | Recommended handling |
|---|---|---|---|---|---|---|
| `processSignupServiceArea()` — `profiles.update` | Error discarded | Column/table missing, RLS denial, network | **Best-effort** relative to signup itself (account creation already succeeded by this point) | Yes — server-side `console.error` at minimum, ideally surfaced to an error-tracking tool if one exists | Nothing (best-effort shouldn't block their redirect) | Catch and log; do not throw. Signup must not fail because of this. |
| `processSignupServiceArea()` — `service_area_waitlist.insert` | Error discarded | Same as above | **Best-effort** relative to signup, but **critical** to the waitlist feature's entire purpose | Yes, loudly — this is the one write the whole feature exists for | Nothing changes for the user (they still see the out-of-area page either way) | Catch and log; do not throw (signup flow shouldn't break), but this failure should be *visible* somewhere an admin would notice — e.g., server logs at minimum, ideally an admin alert if failures start recurring (not proposing building alerting now — just flagging the log should be loud enough to notice, not a swallowed `catch {}`). |
| `joinWaitlist()` | Error discarded, no return value at all | Same | **Critical** — this is the entire point of the function | Yes | Currently: nothing, ever (no redirect exists regardless of success/failure — a pre-existing, separate defect, §1 workflow E) | Return a typed result (`{ ok: true } | { ok: false, error: string }`), redirect on success with a real confirmation state instead of the currently-unreachable `?waitlist=joined` param, show an inline error on failure. |
| Client dashboard service-area read (`dashboard/client/page.tsx`) | Error discarded | Column missing | Best-effort (only affects a banner) | Optional — low value, high volume if logged on every page load | Currently: banner never shows, no error visible | Leave as best-effort silent degradation *by design* once columns exist and are reliably populated — but add a dev-time/staging assertion or a one-time log-on-first-failure so a future schema drift like this one doesn't hide again for months. |
| Contractor dashboard service-area read (`dashboard/contractor/page.tsx`) | Same | Same | Same | Same | Same | Same |
| Contractor subscribe page gate (`dashboard/contractor/subscribe/page.tsx`) | Same | Same | **This one is different — it's a gate, not just a banner.** If this read fails, `isOutOfArea` defaults `false`, meaning an actually-out-of-area contractor could subscribe when they shouldn't be able to. | Yes — this is a business-rule bypass, not just a cosmetic miss | Currently: nothing, they just proceed as if in-area | This read should **fail closed, not open**, once the columns exist: if the query errors, treat as "status unknown, don't block" is arguably *worse* than "status unknown, do block and show a manual-review message" — recommend explicit error handling here specifically, not silent degrade, given it's gating a paid action. |
| Admin user detail (`dashboard/admin/users/[id]/page.tsx`) | Error discarded | Same | Best-effort (display only) | Optional | Shows "—" already (existing fallback in the UI for missing data) | Fine as silent degrade — this is a read-only admin display, not a gate. |
| Admin waitlist listing (`dashboard/admin/waitlist/page.tsx`) | Error discarded | Table missing/RLS | Best-effort in the sense that the page shouldn't crash, but the current "No waitlist entries yet." empty state is actively misleading when the real state is "the query failed" | Yes | Should distinguish "genuinely empty" from "query failed" — currently cannot | Check `error` explicitly; if present, show a distinct "couldn't load — see logs" state instead of reusing the empty-state copy. |
| CSV export | Error discarded | Same | Same reasoning as listing | Yes | Downloads an empty/header-only CSV with no indication anything went wrong | Check `error`; return a non-200 with a clear message instead of a silently-empty successful-looking CSV. |
| Bulk notify (`notifyWaitlistByZips`) | Partially handled already — individual email-send failures are caught per-entry (`catch { }` around `sendWaitlistExpansionEmail`, continues the loop) | The *initial* fetch of matching entries isn't error-checked, only empty-checked | The initial fetch is **critical** (nothing to notify if it silently returns empty due to error, indistinguishable from genuinely no matches) | Yes | Redirects to `no_entries` either way — same UX for "no one matched" and "query broke" | Distinguish these two cases explicitly; keep the existing per-email best-effort catch (that part's already reasonable — one bad email address shouldn't stop the batch). |

**Principle applied throughout:** reads that only affect a cosmetic banner degrade silently (with light logging so drift is noticeable, not invisible for months again); reads that gate a business rule (subscription eligibility) or that are the entire point of an admin tool (waitlist listing/export/notify) must surface their own failure distinctly, not reuse an empty/default state that looks like a normal, healthy outcome.

Not proposing retries anywhere in this set — none of these are transient-network-style operations where a retry meaningfully helps; a missing column or RLS denial won't resolve itself on a second attempt.

---

## 7. Security and Privacy Review

- **Who may insert:** anyone, including unauthenticated visitors (this is the entire point of a public waitlist form). Recommend this go through **RLS with an `anyone_can_join_waitlist` INSERT policy** (matching 005's original design) rather than exclusively through `supabaseAdmin`, since the app already has both an authenticated path (`processSignupServiceArea`, uses `supabaseAdmin`) and a genuinely anonymous path (`joinWaitlist`, also currently uses `supabaseAdmin`) — either approach *works* today since both go through the service-role client, but an RLS INSERT policy is worth keeping regardless as defense-in-depth and to match the documented intent, in case a future client-side-only join flow is ever added.
- **Who may read:** admin only. No legitimate product reason for a user to read the waitlist table's contents (not even their own row — there's no "check your waitlist status" feature). Recommend RLS restricted to `role = 'ADMIN'`, matching 005's original design.
- **Who may update notification fields (`notified_at`):** admin only, via the service-role client in `notifyWaitlistByZips` — never exposed to a client-side mutation path. Recommend RLS: no client-facing UPDATE policy at all (writes go through `supabaseAdmin`, same pattern already used for `problem_reports`/`subscription_disputes` per this session's earlier work), rather than a broad admin RLS UPDATE policy — narrower is safer since there's no legitimate case for a client-authenticated UPDATE.
- **Who may export:** admin only — already gated by `requireRole(["ADMIN"])` in the export route; no change needed there.
- **Anonymous inserts — RLS vs. `supabaseAdmin`:** recommend RLS policy for the truly-anonymous path (`joinWaitlist`) since it's philosophically a public form submission, not an authenticated admin operation, even though it currently happens to route through `supabaseAdmin`. Either is functionally safe as long as the *read* side stays admin-only; this is a "which is more correct in spirit" call, not a security requirement either way.
- **Can emails or ZIP codes leak through client-side queries?** Not today — every read in the current codebase goes through `supabaseAdmin` in a server component/route/action; no client component ever queries `service_area_waitlist` directly. As long as that pattern holds (and RLS is admin-only for SELECT regardless, as a backstop), there's no client-side leak path.
- **Rate limiting / abuse protection:** none exists today for either insert path, and none is proposed here. A public, unauthenticated form with only `email`/`zip` fields is a plausible spam target (bots submitting garbage rows) — worth naming as a real gap, but building rate limiting is a meaningfully separate piece of work (needs a rate-limit store, IP tracking or similar) and is explicitly **not** part of this repair's scope. Flagging for a future decision, not silently ignoring it.
- **PII stored:** email address (direct PII) and ZIP code (weak/coarse location signal, not typically treated as sensitive PII on its own, but combined with email it's a real contact record). No names, no phone numbers, no precise addresses. Standard "marketing lead list" sensitivity — should be handled with the same care as any other email list (not publicly readable, which the admin-only RLS already ensures), but doesn't rise to the level of the platform's other sensitive data (payment info, government ID-adjacent veteran verification documents, etc.).

---

## 8. Deployment Sequence

**Recommended: (B) — application code made backward-compatible first, then the database migration**, with a specific nuance: the app-code changes in Commit B should be written to **work correctly whether or not the new columns/table exist yet** (check `error` and degrade gracefully per §6's plan), deployed first. Then Migration 017 runs. This ordering means:

- Before 017 runs: the app already has proper error handling, so it behaves exactly as it does today functionally (still not persisting waitlist entries) — but *visibly and loggedly* now, not silently, closing the "silent failure" problem immediately, even before the schema exists.
- After 017 runs: the same app code (unchanged) starts actually working, because the columns/table it was already gracefully checking for now exist.

This avoids the риск of "site enters a broken state" that pure sequence (A) risks: if the DB migration ran first and the *old*, not-yet-updated application code were still deployed, nothing would improve (old code still doesn't check errors) — no harm, but no benefit either, and it reverses the safer order for no reason. Sequence (A) isn't unsafe here specifically because every DB change is additive, but (B) is still preferable because it means the error-handling improvement (the part that actually matters most per your framing — "the repair must eliminate silent database failure") ships and is verifiable independent of, and before, the schema change.

**The live site cannot enter a state where signup is broken or the UI expects columns that don't exist** — this is inherently satisfied by both the additive nature of 017 (nothing is ever removed) and by Commit B's error-handling being resilient to the columns' absence during the gap between the two deploys.

### Rollback plan
- **Commit B (app code) rollback:** standard Vercel rollback to the prior deployment — no data implications, since Commit B doesn't change the database.
- **Commit A (Migration 017) rollback:** additive-only migrations don't have a clean automatic "undo" the way a destructive migration would need one — but since nothing is dropped or modified destructively, "rollback" in practice means: if 017 somehow caused an unexpected problem, the fix is a forward-fixing follow-up migration, not a revert. Worth stating plainly: there is no scenario where reverting Commit A would restore anything, since it was purely additive to begin with — its "rollback" is just "leave the columns/table in place, they're inert until Commit B's code uses them."

### Verification queries (post-deploy, both commits)
- `SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles' AND column_name IN ('service_area_zip', 'service_area_status');` — confirms both columns exist.
- `SELECT to_regclass('public.service_area_waitlist');` — confirms the table exists.
- `SELECT pg_get_functiondef('handle_new_user'::regproc);` — confirms the trigger function includes `service_area_zip`.
- A real signup (staging or a disposable test account in production, at your discretion) from a known out-of-area ZIP, followed by `SELECT * FROM service_area_waitlist ORDER BY created_at DESC LIMIT 1;` — confirms the whole chain end-to-end, not just the schema.

### Smoke tests
- Sign up (client) from an in-area ZIP → lands on `/dashboard`, no errors in server logs.
- Sign up (contractor) from an out-of-area ZIP → lands on `/signup/out-of-area`, and the waitlist row now actually exists.
- Join waitlist anonymously from `/login#waitlist` → row exists, and (once Commit B ships) a real confirmation is shown.
- Load `/dashboard/admin/waitlist` → shows the new rows, counts are non-zero and correct.
- Load the contractor subscribe page as an out-of-area contractor → gate still correctly blocks (this is the one path from §6 recommended to fail closed — worth deliberately testing, not just trusting).

### Production checks / low-traffic window
Given every change here is additive and the current feature is already fully broken (there's no "working" state to regress from), the risk profile is low. Still recommend a low-traffic deployment window as standard practice for any production DB migration, primarily to make the verification queries and smoke tests easy to run cleanly without real signup traffic interleaving — not because of an expected outage risk.

---

## 9. Historical Lead Loss

**Recoverable with evidence:**
- **`auth.users.raw_user_meta_data->>'service_area_zip'`.** Both signup pages (`/signup`, `/signup/contractor`) pass `service_area_zip` into `supabase.auth.signUp()`'s `options.data`, which Supabase stores verbatim in `auth.users.raw_user_meta_data` — **independent of whether `handle_new_user()` or `processSignupServiceArea()` ever successfully used it.** This means, for every account created since these signup pages were written in their current form, the ZIP they entered at signup is very likely still sitting in `auth.users`, recoverable via a direct query (`SELECT id, email, raw_user_meta_data->>'service_area_zip' AS signup_zip, created_at FROM auth.users WHERE raw_user_meta_data ? 'service_area_zip'`). This is real evidence, not a guess — I have not yet run this query (no database changes/queries beyond what this review required were performed), but the mechanism for it to work is confirmed directly from the code.

**Potentially inferable, lower confidence:**
- **Resend email logs**, if retained long enough and if account-confirmation or other transactional emails reference the signup ZIP anywhere in their content (unconfirmed — would need to check what Resend actually logs and for how long, and whether any email template includes the ZIP).
- **Vercel function logs**, if retained long enough and if any log line ever printed the ZIP during signup processing (would need to check actual log retention settings and whether such a log statement exists — not confirmed either way in this review).
- **GA4 analytics events**, if signup-flow events were instrumented with ZIP as an event parameter (not confirmed — would need to check the GA4 event schema actually in use).
- **Support requests**, if any out-of-area user emailed support directly — anecdotal at best, not systematic.

**Permanently lost:**
- Any `service_area_waitlist` row that was ever *attempted* via `joinWaitlist()` (the fully-anonymous path) — there is no `auth.users` row backing an anonymous join, so there's no fallback recovery mechanism for that path at all. Anonymous homepage/project-post-blocked waitlist attempts have no recoverable trace anywhere in this system, to the best of what's been checked here.
- The **fact that someone completed the signup flow specifically because they hit the out-of-area redirect**, as opposed to any other reason — recoverable ZIP data doesn't reconstruct intent or timing precision beyond what `auth.users.created_at` already gives you.

**Recommendation:** treat the `auth.users.raw_user_meta_data` signal as a genuinely promising, low-effort recovery path worth actually running as a one-time query once 017 ships — cross-referencing recovered signup ZIPs against the current launch-ZIP list would let you backfill a reasonable set of historical out-of-area *registered* leads into the new table (with an honest `source` tag distinguishing them as backfilled, not a live signal) even though the anonymous-visitor leads are gone for good.

---

## 10. Scope and Success Criteria

### Commit A — Migration 017
**Scope:** `supabase/migrations/017_service_area_infrastructure_repair.sql` only. Creates `service_area_waitlist` (full schema per §4), adds the two `profiles` columns, updates `handle_new_user()`, enables RLS with policies per §7, adds constraints/indexes per §2/§5. No application code. No data backfill beyond the explicit decision in §3 (recommended: none, deferred as a separate follow-up if desired).

### Commit B — Application error handling + waitlist integration
**Scope:** `src/lib/serviceArea/actions.ts` (proper error checking, `ON CONFLICT` handling, `joinWaitlist` returns a typed result and the relevant call sites redirect correctly), the read sites in `dashboard/client/page.tsx`, `dashboard/contractor/page.tsx`, `dashboard/contractor/subscribe/page.tsx`, `dashboard/admin/users/[id]/page.tsx` (differentiated error handling per §6's table), `dashboard/admin/waitlist/page.tsx` and the CSV export route (distinguish empty-vs-error), `dashboard/admin/waitlist/actions.ts`'s `notifyWaitlistByZips` (distinguish empty-vs-error on the initial fetch), and the `/signup/out-of-area` page copy (stop claiming automatic waitlist enrollment as an unconditional fact if you want that claim to stay accurate even during a future outage, and fix or remove the broken "update your ZIP in your profile" recovery instruction). Explicitly **not** touching unrelated error handling elsewhere in the codebase, per your instruction.

**Should both ship in the same release?** Recommend yes, deployed together (Commit B first per §8's sequencing, immediately followed by Commit A) as one coordinated release — but kept as **two separate, independently reviewable commits/PRs**, so each can be read, diffed, and (if ever needed) reasoned about in isolation. Shipping the schema without the code leaves the code still silently degrading against a now-working schema (harmless but pointless delay); shipping the code without the schema is the current state (harmless but ineffective) — neither half alone accomplishes the actual goal, so there's no reason to separate their release timing, only their review/commit boundaries.

### Conditions required before approval
1. You confirm the backfill decision in §3 (recommended: none in 017 itself).
2. You confirm the uniqueness strategy in §5 (`UNIQUE (email, zip)`) matches your intent for what counts as a "duplicate."
3. You confirm the `user_id` addition in §4 (new relative to 005) is wanted.
4. You confirm the fail-closed recommendation for the contractor subscribe-page gate in §6 (currently the riskiest single behavior change relative to "just add error handling").
5. You decide whether to pursue the `auth.users` metadata historical-recovery query from §9 as a follow-up, and whether recovered rows should be tagged/dated as backfilled versus live.
6. You confirm the Commit A / Commit B split and combined-release sequencing in this section.

---

## Risk List

| Risk | Level | Mitigation |
|---|---|---|
| Fail-closed change to the contractor subscribe-page gate blocks a legitimately in-area contractor if the read errors for an unrelated transient reason | **Medium** | Scope the fail-closed behavior narrowly (specifically this one gate, not a blanket policy), and pair it with clear, actionable error messaging + a support contact, exactly as the existing out-of-area copy already does for the confirmed case — so a false-positive block is recoverable by the user, not a dead end. |
| Historical backfill (if pursued per §9) writes incorrect `service_area_status` for accounts whose ZIP changed, or whose recovered metadata reflects an outdated launch-ZIP list | **Medium** | Keep backfill as an explicit, separate, reviewed operation (not silently inside 017), tag backfilled rows distinctly, and re-derive against the *current* launch-ZIP list at the time the backfill actually runs, not against this review's snapshot. |
| `UNIQUE (email, zip)` constraint rejects a legitimate resubmission if the app-code `ON CONFLICT` handling in Commit B has a bug | **Low** | Straightforward to test directly (submit the same email/zip twice, confirm one row) as part of the smoke-test plan in §8. |
| Public, unauthenticated waitlist form remains unprotected against spam/bot submissions | **Low** (accepted, not fixed by this repair) | Explicitly out of scope per this review; flagged for a future decision rather than silently ignored. |
| `handle_new_user()` re-diff at write-time (§3) is done against a stale copy of the live function instead of a fresh pull | **Low** | Same discipline already established for 016 — pull the live function body programmatically immediately before finalizing 017, not from memory or an old capture. |
| Deploying Commit B (error-handling changes) surfaces previously-silent errors in a way that's noisy (e.g., excessive logging) before Commit A ships | **Low** | Keep best-effort paths logging at a reasonable level (not throwing, not spamming); this was already accounted for in §6's per-call-site plan. |

## Unanswered questions requiring your decision

1. Backfill existing `profiles` rows' `service_area_status`, or leave at default `UNKNOWN`? (§3)
2. Is `UNIQUE (email, zip)` the right definition of "duplicate," or did you have a different rule in mind? (§5)
3. Add the new `user_id` column (not in original 005), linking signup-triggered entries to real accounts? (§4)
4. Should the contractor subscribe-page gate fail closed (block on read error) or stay as-is (fail open, matches current — broken — behavior) once the columns exist? (§6)
5. Pursue the `auth.users.raw_user_meta_data` historical-recovery query as a follow-up? If so, before or after 017 ships? (§9)
6. Confirm the Commit A / Commit B scope split and same-release, separate-commit sequencing. (§10)
7. Should the out-of-area page's "automatically added to waitlist" claim and the broken "update your profile ZIP" recovery instruction be corrected as part of Commit B, or handled separately as a copy-only change? (Currently proposed as part of Commit B's scope, but calling it out since it's copy/UX, not strictly error-handling.)
