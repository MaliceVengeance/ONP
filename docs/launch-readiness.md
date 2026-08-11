# ONP Launch Readiness

Current state of pre-launch work. This is a checklist, not a changelog — update
items in place as they move between sections rather than appending history.

Last reviewed: 2026-08-09

## COMPLETE

- Database recovery baseline (`016_complete_schema_baseline.sql`)
- Service-area infrastructure repair (`017_service_area_infrastructure_repair.sql`)
- Table/sequence privilege parity (`018_restore_database_privilege_baseline.sql`)
- Function default privilege parity (`019_restore_function_default_privileges.sql`)
- `handle_new_user()` search-path hardening (`020_harden_handle_new_user_search_path.sql`)
- Staging environment (separate Supabase project `qbdihnmgxtowqnvzflfh`, `.env.staging.local`, `npm run dev:staging`)
- Stripe TEST-mode configuration for staging
- Stripe webhook hardening (required-write failures return non-2xx, idempotency guards, missing-local-row ownership check)
- Real staging contractor subscription E2E (signup → profile → Checkout → webhook → gating, all through the real UI)
- Stripe `current_period_start` persistence fix
- SEO foundation: `robots.txt`, `sitemap.xml`, canonical metadata (`metadataBase` + per-page `alternates.canonical`)
- `getonp.com` DNS/Vercel attachment
- `getonp.com` → 308 → `ournextproject.us` (Vercel domain-level redirect, verified)
- `www.getonp.com` → 308 → `ournextproject.us` (Vercel domain-level redirect, verified)
- Staging Auth custom SMTP
- Full real contractor signup + email-confirmation E2E
- Full real client signup + email-confirmation E2E
- Confirmation-link behavior verified
- Role-based login redirect verified after confirmation
- Production deployment of the launch-readiness branch (`review/service-area-waitlist-commit-b`, commit `50b92aa`)
- `www.ournextproject.us` → apex live redirect (root path included — see note below)
- `robots.txt` live
- `sitemap.xml` live
- Canonical metadata live
- `getonp.com` redirect post-deploy verification
- Google Search Console
- Bing Webmaster Tools
- Per-page SEO titles/descriptions and text-only social (Open Graph/Twitter) metadata
- Contractor-profile launch SEO safety (`/contractors/[id]` noindex until legitimate profiles exist)
- `camo_variant` moved client-side; homepage caching restored (2026-08-09)

### Staging Auth custom SMTP — confirmed configuration/behavior

- Sender: `ONP Staging <staging-auth@ournextproject.us>`
- Custom SMTP provider: Resend
- Staging Site URL: `http://localhost:3000`
- Staging redirect allow-list: `http://localhost:3000/**`
- Email confirmation remains enabled
- Confirmation link confirms the account but does **not** auto-login; the user
  lands logged out and then signs in manually. This matches the current
  signup UI copy ("Check your email to confirm your account, then log in.")
  and is not being treated as a defect.
- Contractor confirmation/login routes to `/dashboard/contractor`
- Client confirmation/login routes to `/dashboard/client`
- No shared Supabase built-in mailer rate-limit issue occurred after custom
  SMTP was configured (the earlier rate-limit blocker was specific to
  Supabase's default shared mailer, not custom SMTP)

### Production deployment — live verification results (2026-08-09)

- Deployed commit `50b92aa` to production via the normal Vercel CLI production
  path (`vercel --prod`), aliased to `https://ournextproject.us`.
- `https://www.ournextproject.us/` → `308` → `https://ournextproject.us/`
  (single hop, no loop)
- `https://www.ournextproject.us/about`, `/for-contractors`,
  `/contractors?example=1` → all `308` to the equivalent apex URL, query
  strings preserved
- `https://ournextproject.us/` → `200`, no redirect (apex stays canonical)
- `https://getonp.com/` and `https://www.getonp.com/` → still `308` to the
  apex, unchanged by this deploy
- `/robots.txt`, `/sitemap.xml`, and canonical `<link>` tags on `/`, `/about`,
  `/for-contractors`, `/for-property-managers`, `/contractors`, `/terms` all
  verified live and correct in an earlier deployment of this same branch (see
  the deployment/verification checkpoint before this one) — not re-verified
  in detail here since nothing in this change touches them, only the one
  root-path redirect defect found in that earlier pass.
- **Root-path defect found and fixed in this checkpoint**: the original
  `www.ournextproject.us` redirect rule (`source: "/:path*"`) matched every
  non-root path correctly but not the bare root `/` — a known category of
  Vercel edge-case with wildcard `has`-conditioned redirects. Fixed by adding
  an explicit second rule for `source: "/"` ahead of the existing catch-all
  in `vercel.json` (commit `50b92aa`). Verified live post-fix.

### Google Search Console (2026-08-09)

- Domain ownership verified for `ournextproject.us` (DNS verification via
  GoDaddy).
- Sitemap (`https://ournextproject.us/sitemap.xml`) submitted and accepted
  successfully.
- Homepage inspection confirms `https://ournextproject.us/` is already
  indexed ("URL is on Google", HTTPS valid).
- Manually submitted indexing requests for the three priority marketing
  pages: `/for-contractors`, `/for-property-managers`, `/why-onp`.
- No further action needed immediately — indexing/crawl status should be
  monitored over time (Search Console's Coverage/Pages reports).

### Bing Webmaster Tools (2026-08-09)

- Site added and verified: `https://ournextproject.us/`, via Bing DNS
  auto-verification through GoDaddy.
- Sitemap `https://ournextproject.us/sitemap.xml` submitted — status
  Success, 1 known sitemap, 0 errors, 0 warnings, 16 URLs discovered
  (matches the full current public route list).
- The Bing Webmaster Tools UI did not expose a visible manual "URL
  Submission" navigation item for this property — not treated as a
  blocker, since the successfully crawled sitemap already exposes all 16
  current public URLs, including `/for-contractors`,
  `/for-property-managers`, and `/why-onp`.

### Per-page SEO titles, descriptions & social metadata (2026-08-09)

- All 16 public/sitemapped routes now have page-specific `title` and
  `description` (previously 8 of 16 inherited the generic root layout
  metadata verbatim).
- Homepage uses a distinct, search-oriented title
  (`Our Next Project — Sealed-Bid Contractor Marketplace`); internal
  marketing/legal pages follow `Page Topic | Our Next Project`; the
  already-good `/help/*`, `/terms*`, `/privacy*`, and `/*-disclaimer`
  title families were left unchanged.
- Added via a shared `buildPageMetadata()` helper
  (`src/lib/pageMetadata.ts`) so title/description/canonical/OG/Twitter
  stay consistent across all 16 pages rather than hand-duplicated.
- Text-only Open Graph (`og:title`, `og:description`, `og:url`,
  `og:type=website`) and Twitter card (`twitter:card=summary`,
  `twitter:title`, `twitter:description`) metadata added to all 16 pages,
  reusing the same per-page title/description. No `og:image`/
  `twitter:image` yet (deferred, per instruction).
- Verified live (staging): every route renders exactly one `<title>`, one
  canonical `<link>`, and one description — all canonical/`og:url` values
  use `https://ournextproject.us`, never localhost or `www`, despite being
  served from a localhost dev instance.
- `sitemap.xml` still exposes exactly 16 URLs; `robots.txt` unchanged.
- Copy constraints followed as specified: homepage description omits
  "verified contractors"; `/for-contractors` avoids "every contractor is
  verified"; `/contractors` avoids implying universal
  licensing/insurance/availability or directory size.

### Contractor-profile launch SEO safety (2026-08-09)

- Audit found a real, live issue: a test contractor profile on production
  (`contractor_id 401480cc-74e8-4cd5-ae4a-a4d197f2e5da`, "Bravo Remodeling")
  passed all three reachability gates (`is_listed`, `directory_verified`,
  active subscription) and was linked directly from the indexed
  `/contractors` page, with `/contractors/[id]` emitting no robots directive
  at all — defaulting to index,follow.
- Fixed by adding `robots: { index: false, follow: true }` to
  `/contractors/[id]`'s metadata. The route stays fully functional and
  crawlable; only indexing is suppressed. No change to gating logic,
  `notFound()` behavior, data fetching, directory links, sitemap, or
  robots.txt.
- Verified live on production post-deploy: the same reachable test profile
  now returns `200`, renders normally, and emits
  `<meta name="robots" content="noindex, follow">`. `/contractors` itself
  remains unaffected (still default index,follow, no robots meta); an
  ineligible contractor ID still 404s; sitemap.xml unchanged at 16 static
  URLs with zero `/contractors/*` entries; robots.txt unchanged.
- Dynamic contractor profile sitemap/indexing strategy remains deliberately
  deferred — see below. This should only be revisited once ONP has
  legitimate contractor profiles that are intentionally public, complete,
  listed, appropriately verified, and present in meaningful volume, not
  reactively the first time any one profile happens to pass the gates.

### Production test contractor de-listed from public directory (2026-08-09)

- The one production test contractor account ("Bravo Remodeling",
  `contractor_id 401480cc-74e8-4cd5-ae4a-a4d197f2e5da`) has been de-listed
  from public directory visibility via a single reversible data-state
  change: `contractor_profiles.is_listed` set to `false`. No code,
  migration, RLS, or application deployment involved.
- No longer appears on `https://ournextproject.us/contractors`; the direct
  public profile URL now returns `404` — both verified live.
- `directory_verified` remains `true`, and `contractor_subscriptions`
  (status `ACTIVE`, Stripe customer/subscription linkage) is completely
  unchanged — the account's verified/subscribed test state is intentionally
  preserved for future production E2E testing. `auth.users` and `profiles`
  (role `CONTRACTOR`) are unchanged, so the account can still authenticate
  and use the contractor dashboard normally; nothing in the dashboard or
  bidding code paths depends on `is_listed` (confirmed by code audit).
- Confirmed exactly one row exists in production's `contractor_profiles`
  table, total — no other production contractor profiles exist to worry
  about.
- **No legitimate production contractors exist yet.** `/contractors`
  currently shows zero listings, which is the correct, honest state until
  real contractors sign up and complete verification.

### `camo_variant` moved client-side; homepage caching restored (2026-08-09)

- The camo (military-pattern) visual branding is unchanged; only *where the
  variant is chosen* moved. Previously `src/middleware.ts` set a
  `camo_variant` cookie on every request to `/`, `/why-onp`, and
  `/contractors`, and each page read it server-side via `cookies()` — which
  forced all three routes to opt out of static rendering (`Cache-Control:
  private, no-cache, no-store, max-age=0, must-revalidate`), whether or not
  the page actually used the variant.
- Replaced with a small client-side hook,
  `src/lib/camo/useCamoVariant()`, backed by `sessionStorage` (key
  `onp_camo_variant`) plus a module-level cache so every `CamoCanvas`/
  `SealedBidReveal` instance on a page converges on the same variant
  instantly, with no prop drilling. First component in a browser session
  generates and persists the variant (`pickRandomCamoVariant()`, existing
  `isCamoVariant()` type guard); every later instance/page in that session
  reuses it. A new browser session (new tab that doesn't inherit
  `sessionStorage`, or the browser fully restarting) may roll a new variant.
  No cookie is written for this anymore.
- Removed: the camo cookie-write block in `src/middleware.ts`, the
  server-side reader `src/lib/camo/session.ts`, and the `getCamoVariant()`
  calls/props in `src/app/page.tsx` and `src/app/contractors/page.tsx`.
  Middleware's `matcher` now only covers `/dashboard/:path*` — `/`,
  `/why-onp`, and `/contractors` had no other middleware dependency.
  `CAMO_COOKIE` constant removed from `src/lib/camo/constants.ts` (no
  runtime reference to it remains anywhere in the app).
- **Verified outcome**: `/` is now statically prerendered
  (`Cache-Control` cacheable, no `Set-Cookie: camo_variant`). `/contractors`
  stays dynamic, for its own already-documented independent reason (its
  Supabase SSR client reads request cookies for the directory query) — not
  touched here. `/why-onp`'s own dynamic-render cause (a `searchParams`
  read, unrelated to camo) is documented and resolved separately below.
- Visual regression: verified locally — hero corner canvas, category-tile
  fallback canvas, and the `SealedBidReveal` card all render the same
  variant on one page load; the variant persists across client-side
  navigation between `/`, `/contractors`, and `/why-onp` in the same tab;
  no hydration warnings/errors in the console.

### `/why-onp` static caching restored (2026-08-09)

- Follow-up to the camo checkpoint above: `/why-onp` remained dynamically
  rendered even with camo removed, because it read `searchParams`
  server-side (`{ welcome?: string }`) to decide whether to show a
  post-subscription "Welcome to ONP!" banner. Reading `searchParams` in a
  Server Component is itself a Next.js dynamic-render trigger, independent
  of camo.
- Fixed by extracting only the welcome-banner condition into a small client
  component, `src/app/why-onp/WelcomeBanner.tsx`, which reads the query
  string via `useSearchParams()` and renders `null` unless `welcome=1`.
  `/why-onp/page.tsx` no longer accepts or reads `searchParams` at all and
  wraps the banner in a minimal `<Suspense fallback={null}>` boundary (the
  only container Next.js requires around `useSearchParams()` for static
  prerendering). Banner content, styling, and the `welcome=1` condition are
  byte-for-byte unchanged; the rest of the page (hero, comparison rows,
  process steps, feature-flagged support tiles, CTA) is untouched and still
  server-rendered normally.
- **Investigation note**: while tracing where `?welcome=1` is generated,
  found that the live Stripe subscription `success_url`
  (`src/app/dashboard/contractor/subscribe/actions.ts`) actually redirects
  to `/dashboard/contractor?welcome=1` — a separate page with its own,
  independent welcome banner — not to `/why-onp?welcome=1`. Nothing else in
  the app currently links to or generates `/why-onp?welcome=1`, so that
  banner is presently only reachable by a manually-typed URL. Left as-is
  (out of scope for a caching fix); worth a product decision later on
  whether the `/why-onp` banner should be removed or wired up to a real
  redirect.
- **Verified outcome**: `npx tsc --noEmit` and `npm run build` both clean;
  build output shows `/why-onp` as static (`○`) instead of dynamic (`ƒ`).
  Canonical stays `https://ournextproject.us/why-onp` (no query string) in
  both cases; title/description unchanged. Live on production: `/why-onp`
  returns `Cache-Control: public, max-age=0, must-revalidate`, with
  `X-Vercel-Cache: PRERENDER` on the first request and `HIT` on the second,
  and no `Set-Cookie` of any kind. Since the page is now statically
  prerendered, the welcome banner can no longer appear in the raw served
  HTML for `?welcome=1` (there is no per-request server render to condition
  on) — it renders client-side after hydration instead, confirmed live in
  a real browser: `/why-onp` shows no banner, `/why-onp?welcome=1` shows
  the identical banner within the same static shell, no console errors.
  `/contractors` (still `private, no-store`, unrelated Supabase SSR cause)
  and `/` (still static) were both re-checked and are unaffected by this
  checkpoint.

### RFI information-revision tracking & bid eligibility enforcement (2026-08-10)

- **Founder rule enforced**: every bid must acknowledge the latest posted
  project information (RFI answers) at or after the moment it was submitted
  or reconfirmed. New DB-enforced concept: `projects.information_revision_number`
  (bumped only by a genuine RFI answer, via a trigger — asking an RFI does
  not bump it) and `bid_versions.acknowledged_information_revision` /
  `acknowledgment_affirmed` / `information_acknowledged_at` (server-stamped
  at insert time; a client cannot forge the revision it claims to have
  acknowledged). `award_project_bid` now rejects awarding a bid whose latest
  version's acknowledgment doesn't match the project's current revision.
  Deliberately does not reuse the older, dormant `projects.revision_number`
  / `bids.ack_project_revision_number` fields — those remain reserved for a
  possible future general project-revision system.
- Standard projects: an RFI answered with ≤24h remaining extends the
  deadline by 24h (from the existing deadline, not from `now()`), capped at
  `max_deadline_resets` (default 2). Emergency projects: same mechanism,
  ≤12h / +12h. Both applied atomically via a row-locked DB function
  (`apply_rfi_deadline_extension`), safe under concurrent RFI answers.
- `rfis_update_client` RLS hardened to require
  `project_is_open_for_bidding(project_id)` — an RFI can no longer be
  answered after the deadline, on a closed project, or on an awarded one,
  enforced at the database layer, not just in application code.
- New durable notification outbox (`notification_outbox` table): RFI-answer
  notifications (asker-specific, and an info-update email to every other
  current bidder) and post-deadline ineligibility notifications are queued
  transactionally, attempted synchronously for immediacy, and retried by a
  cron on failure — `sent_at` (and `bids.ineligibility_notified_at`) is
  only set after a confirmed successful send, so a failed delivery is never
  silently dropped.
- Migrations: `021_rfi_information_revision_and_bid_eligibility.sql`,
  `022_grandfather_preexisting_bid_acknowledgment.sql`.

**Migration 022 — grandfathering result**: migration 021's eligibility check
initially had a backward-compatibility gap — every `bid_versions` row that
existed before 021 defaulted to `acknowledgment_affirmed = false` (the
checkbox didn't exist yet when they were submitted), which would have
incorrectly blocked awarding any pre-existing bid. Migration 022 backfilled
all such rows to `acknowledgment_affirmed = true`, stamped against each
project's information revision at migration time. Verified in production
post-migration: `remaining_unacknowledged = 0`; the historical "Upgrade
Swamp Cooler to HVAC" bid confirmed eligible
(`acknowledged_information_revision = 0 = project's current revision 0`,
`acknowledgment_affirmed = true`) — not awarded, per instruction, since that
decision belongs to the client.

**Bug found and fixed during production E2E — RFI status-guard mismatch**:
`respondToRfi`'s idempotency guard checked `.eq("status", "SENT")`, but
`"SENT"` is only the `rfis` column's unused schema default — no live code
path ever inserts it. Contractor-submitted questions insert
`status: "OPEN"` (`src/app/dashboard/contractor/projects/[id]/rfis/actions.ts`).
The guard silently matched zero rows for every real contractor question,
producing a false-positive success banner while the response was never
saved and none of the downstream effects (revision bump, notification,
extension check) ever ran. Found by answering a real RFI in production and
noticing it didn't persist. Fixed to `.neq("status", "ANSWERED")`, matching
every real "not yet answered" status value; regression-tested on staging
against the actual status contractor submissions use before redeploying.
Commit `82a3aa5`; live in deployment `dpl_8RrZ5Vu2HwXs6enoB8FK6Peo3HhJ`.

**Vercel Hobby plan cron limitation**: the notification-outbox cron was
designed to run hourly but Vercel Hobby only permits daily cron schedules.
Temporarily set to once daily (07:00 UTC, `52aea1f`). This delays only
notification *delivery* — bid eligibility itself is immediate and
DB-enforced regardless of cron timing; a stale bid is non-awardable the
instant the deadline passes. Upgrade back to hourly (`vercel.json`,
`"0 * * * *"`) once ONP moves to Vercel Pro or another sub-daily scheduler.

**Production E2E verification boundary** — verified live in production
using the existing test accounts (client `SEBravofamily@gmail.com`,
contractor "Bravo Remodeling") against a real reposted project ("Front
Porch Renovation, Concrete Replacement, ADA Ramp Access", a genuine future
project given a fresh bidding window):

*Production-observed*:
- Bid submission requires and records the new information acknowledgment
  (checkbox rendered, required, server-stamped).
- RFI answered → `information_revision_number` advanced by exactly 1 per
  genuine answer (confirmed at revision 2 after two real RFI answers — the
  7 pre-populated catalog Q&A answered at publish time correctly did **not**
  bump it, since those are inserted already-`ANSWERED`, not transitioned by
  `UPDATE`, so the trigger correctly never fires for them).
- Reconfirm-without-price-change produces a new bid version with unchanged
  amount/notes and a freshly server-stamped acknowledgment.
- A second RFI answer after a reconfirm correctly makes the bid stale
  again: final verified state — project revision `2` > bid's acknowledged
  revision `1` → bid is currently stale/ineligible, exactly as designed.
  Left in that state, not force-fixed, per instruction.
- Notification fan-out: asker-specific path exercised on both RFI answers;
  the "notify other current bidders" list was correctly empty both times,
  since the sole bidder was also the asker (no duplicate send to self) — a
  correct, but narrow, production observation. Multi-bidder fan-out was not
  exercised live (would have required creating an additional production
  contractor solely for this test, which was intentionally not done) and
  remains staging-verified only.
- Migration 022 grandfathering, confirmed via read-only production query
  (above).

*Staging E2E verified / production not forced* — the following depend on
deadline proximity or elapsed time and were intentionally **not**
recreated in production (no `deadline_at` mutation, no cron manually
invoked, no direct production writes), since forcing them would have meant
bypassing normal application behavior on a real client's project:
  - standard ≤24h RFI extension (+24h)
  - emergency ≤12h RFI extension (+12h)
  - `max_deadline_resets` cap enforcement
  - RFI answer rejected after the deadline
  - stale bid shown anonymously/non-selectable once bids unlock
  - stale bid rejected by `award_project_bid`
  - post-deadline ineligibility notification
  - retry/idempotency of that notification

These are recorded as staging-verified, not as "production E2E passed" —
they were exercised via 33 direct DB-layer assertions on staging
(`qbdihnmgxtowqnvzflfh`) covering the exact same trigger/RLS/function code
now live in production, but not re-triggered live against real user data.

### Posted project scope lock + published Q&A lock (2026-08-11)

Migration `023_posted_scope_lock_and_published_qa_lock.sql` applied to
production. Three parts:

- **Posted project scope lock**: a `BEFORE UPDATE` trigger on `projects`
  blocks changes to `title`, `description`, `category`, `location_general`,
  `city`, `zip_code`, `target_start_date`, `min_open_days`, `max_open_days`,
  and `uses_inspector_takeoff` once `OLD.state <> 'DRAFT'`. No admin or
  service-role bypass — a trigger fires regardless of role, closing the gap
  where the UI's own "published projects cannot be edited" restriction was
  previously enforced only in application code, not the database. The
  publish transition itself is unaffected (`OLD.state` is still `'DRAFT'` at
  that moment).
- **`max_deadline_resets` privilege fix**: extends migration 021's
  column-privilege protection (already covering
  `information_revision_number` and `deadline_reset_count`) to
  `max_deadline_resets` — `authenticated` can no longer `UPDATE` it
  directly, even though no application code path ever wrote it.
- **Published pre-populated Q&A lock**: a trigger on `rfis` blocks
  insert/update/delete of pre-populated catalog answers (rows with
  `contractor_id IS NULL`, written by `updateProjectRfis`) once the
  project is no longer `DRAFT`. The live, contractor-asked interactive RFI
  system (`contractor_id NOT NULL`) is untouched — it already had its own
  correct state-gating via existing RLS. This closes a real gap:
  `updateProjectRfis` writes via `supabaseAdmin` (service role), so an
  RLS-only fix would not have been a real backstop; a trigger is.
  `updateProjectRfis` itself also gained an application-layer DRAFT-only
  guard as defense-in-depth on top of the DB trigger.

**Production-observed** (via normal UI flows on disposable test fixtures —
no direct SQL writes, no deadline manipulation): DRAFT scope-field editing
still works; DRAFT pre-populated Q&A editing still works; attempting to
edit pre-populated Q&A on the already-published "Front Porch Renovation"
test project is rejected; the pre-populated answer text was confirmed
unchanged afterward (no data corruption from the rejected write); the live
interactive RFI history on that same project remained intact and viewable
post-migration; both client and contractor dashboards, login, and
`/contractors` browsing all continued working normally post-deploy.

**Staging-verified only, not forced in production**: the `archiveProject`
TOCTOU fix (the state/eligibility condition is now asserted atomically on
the `UPDATE` itself via `.or()`, instead of only in a pre-read) — no
disposable project existed in production in an archive-eligible state
(`OPEN` + deadline passed, or `AWARDED`/`COMPLETED`) that could be used
without manufacturing state solely to test it, so this remains
staging-verified only (21/21 staging assertions passed, covering this and
every other part of 023).

**Production bug found and fixed during the regression pass**:
`updateProjectRfis`'s new DRAFT-only guard correctly rejected edits on the
published test project, but the client project detail page still rendered
the Q&A form as a plain, always-active server-action form with no error
handling — so the rejection surfaced as Next.js's raw crash page
("Application error: a server-side exception has occurred") instead of a
clean message. Fixed by mirroring the existing Project Details section's
pattern: the Q&A fields are now wrapped in a `disabled` `fieldset` and the
Save button is hidden once the project isn't `DRAFT`, with copy explaining
the lock and pointing to the RFI system for new clarifications. The same
commit also corrected the section's advisory text, which previously (and
now incorrectly) said answers could be updated "at any time — even after
publishing." Fix commit `39cd11b`; live in production deployment
`dpl_5b5y65Aeydy6KLRK4eGtWV9cgLvV`.

**023 checkpoint status: COMPLETE.**

## PENDING / IN PROGRESS

- Dynamic contractor profile sitemap strategy (`/contractors/[id]` deliberately excluded from the static sitemap pending a live-data approach; kept `noindex` until legitimate profiles exist in meaningful volume)
- Social-preview images (`og:image`/`twitter:image`) — deferred from this checkpoint
- Notification-outbox cron: upgrade from daily back to hourly once on Vercel Pro (or another sub-daily scheduler)
- Multi-bidder RFI notification fan-out: staging-verified only, not yet observed against real production bidders
- Post-publish attachment information-event design (new file uploads incrementing information revision, notifying bidders, staleness, extension-rule interaction) — immediate next follow-up audit item, not yet started
- `archiveProject` atomic TOCTOU guard: staging-verified only, no production-eligible disposable project existed to observe it live
- A second, related stale-copy line was noticed but not changed (out of scope for this closeout): the published-project fallback message "This project is published. Edits will trigger a revision workflow in a future update." (same file, non-DRAFT branch of the Project Details section) is also inaccurate now that scope edits are permanently blocked, not deferred to a future workflow — worth a follow-up copy pass
- Final staging/live polish pass

## FUTURE / NOT LAUNCH BLOCKING

- Contractor-defined service areas
- Demand-driven geographic expansion beyond the initial El Paso / Las Cruces launch area
- Evaluate IndexNow integration so ONP can automatically notify Bing and other
  participating search engines when public pages are added, updated, or
  removed
