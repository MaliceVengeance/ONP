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

## PENDING / IN PROGRESS

- Google Search Console
- Bing Webmaster Tools
- Per-page SEO titles/descriptions (several public pages currently only inherit the root layout's generic title/description)
- Dynamic contractor profile sitemap strategy (`/contractors/[id]` deliberately excluded from the static sitemap pending a live-data approach)
- `camo_variant`/cache behavior review
- Final staging/live polish pass

## FUTURE / NOT LAUNCH BLOCKING

- Contractor-defined service areas
- Demand-driven geographic expansion beyond the initial El Paso / Las Cruces launch area
