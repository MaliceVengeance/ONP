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

## PENDING / IN PROGRESS

- Dynamic contractor profile sitemap strategy (`/contractors/[id]` deliberately excluded from the static sitemap pending a live-data approach; kept `noindex` until legitimate profiles exist in meaningful volume)
- Social-preview images (`og:image`/`twitter:image`) — deferred from this checkpoint
- `camo_variant`/cache behavior review
- Final staging/live polish pass

## FUTURE / NOT LAUNCH BLOCKING

- Contractor-defined service areas
- Demand-driven geographic expansion beyond the initial El Paso / Las Cruces launch area
- Evaluate IndexNow integration so ONP can automatically notify Bing and other
  participating search engines when public pages are added, updated, or
  removed
