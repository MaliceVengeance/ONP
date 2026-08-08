# ONP (Our Next Project) — Architecture Report

**Generated:** 2026-08-05
**Stack:** Next.js 16 (App Router) · Supabase (Postgres + Auth + Storage) · Stripe · Resend · deployed on Vercel
**Live at:** ournextproject.us · **Repo:** github.com/MaliceVengeance/ONP (branch `master`)

---

## 1. Folder Structure

```
src/
├── app/
│   ├── api/
│   │   ├── admin/waitlist-export/       # CSV export of expansion waitlist
│   │   ├── bids/[bidId]/quote-pdf/      # Signed-URL redirect to a bid's quote PDF
│   │   ├── cron/                        # 4 scheduled jobs (see §4)
│   │   └── webhooks/stripe/             # Single Stripe webhook handler
│   ├── auth/{login,signout}/            # Auth route handlers (not pages)
│   ├── dashboard/
│   │   ├── admin/                       # 22 admin tools (see §5)
│   │   ├── client/                      # Client project/bid/credit management
│   │   ├── contractor/                  # Contractor bidding/subscription/profile
│   │   └── inspector/                   # Inspector takeoff/dispute workflow
│   ├── contractors[/[id]]/              # Public contractor directory
│   ├── signup, login, forgot-password, reset-password/
│   ├── terms, privacy (+ /legal), trust, why-onp, about,
│   │   for-contractors, for-property-managers, help/*   # Marketing + legal
│   └── page.tsx                         # Homepage
├── components/                          # Shared UI (MarketingChrome, CountdownTimer,
│                                         #   ProjectMap, HoverCard, icons/BranchIcon, …)
├── lib/
│   ├── auth/requireRole.ts              # Central auth chokepoint (see §3)
│   ├── supabase/{server,admin,client}.ts
│   ├── stripe.ts                        # Stripe client + Price ID catalog
│   ├── email.ts                         # All Resend email templates
│   ├── featureFlags.ts                  # platform_settings-backed flags
│   ├── credits.ts, contractor/, disclaimers/, emergency/,
│   │   problemReport/, projects/, serviceArea/, camo/
└── types/
```

Route counts at build time: **~90 total routes**, roughly a third static-rendered (marketing/legal pages), the rest dynamic (auth-gated dashboards).

---

## 2. Database Schema

**41 live tables/views** (confirmed directly against the live Supabase PostgREST schema, not assumed from code). Grouped by domain:

### Identity & Accounts
| Table | Purpose |
|---|---|
| `profiles` | Base user row for every account (1:1 with `auth.users`). Role (`CLIENT`/`CONTRACTOR`/`ADMIN`/`INSPECTOR`), deactivation flag, veteran-cert fields, inspector fields, master-inspector fields. |
| `contractor_profiles` | Contractor-specific business profile (license, COI, military branch, directory visibility). |
| `contractor_settings` | Per-contractor notification preferences. |
| `contractor_credentials` | Individual license/bond credential rows (flexible multi-credential model). |
| `contractor_portfolio_photos` | Public portfolio images. |
| `contractor_verification_log` | Audit trail of admin verification actions on a contractor. |
| `disclaimer_acknowledgments` | Records acceptance of legal disclaimers (emergency bid terms, etc.). |

### Projects & Bidding
| Table | Purpose |
|---|---|
| `projects` | Core project record — state machine (`DRAFT`→`OPEN`→`AWARDED`/`CANCELED`/`COMPLETED`, plus `PENDING_PAYMENT`/`EMERGENCY_EXPIRED`), deadline, emergency-mode flags. |
| `bids` / `bid_versions` / `bid_line_items` | Sealed-bid structure — one `bids` row per contractor per project, versioned amendments, itemized line items. |
| `bid_acknowledgments` | Compliance record that a contractor acknowledged terms at bid time (write-only, no UI reader). |
| `bid_dismissals` / `bid_dismissal_reasons` | Client rejection of a bid pre-award, with moderated free-text reasons. |
| `project_awards` | Award record linking a project to the winning bid/contractor. |
| `project_revisions` | Project change history (currently write path exists only via account-deletion cleanup — no feature creates rows here). |
| `project_attachments` | Generic attachment table (unused — see §6). |
| `project_messages` / `project_message_reads` | Post-award client↔contractor messaging thread + read receipts. |
| `rfi_catalog` / `rfis` | Pre-award Q&A: standard question catalog + per-project answers. |
| `project_services` | Unused table (see §6). |

### Subscriptions & Payments
| Table | Purpose |
|---|---|
| `contractor_subscriptions` | One row per contractor — Stripe subscription status/period/term. No `CREATE TABLE` in tracked migrations (pre-dates repo history); baseline captured retroactively in `015_contractor_subscriptions_baseline.sql`. |
| `subscription_disputes` | Stripe chargebacks on subscription charges, admin-resolved queue. |
| `coupon_codes` | Admin-issued free-month promo codes (Stripe Coupon-backed). |
| `client_credits` | Client-facing credit balance (from dispute resolutions/promos), spent automatically at inspector/emergency checkout. |
| `emergency_request_log` | Tracks the $10 emergency-bid fee and the 2-per-30-days rate limit. |

### Inspector Program
| Table | Purpose |
|---|---|
| `project_inspector_assignments` | Core inspector-request record — assignment, payment, takeoff report, upgrade fields. |
| `inspector_price_list` | Admin-configurable fee/revenue-share tiers. |
| `inspector_upgrade_disputes` | Client disputes over inspector upgrade fees, master-inspector adjudication + refunds. |
| `inspector_flags` | Auto-flagging of inspectors with elevated dispute rates. |
| `master_inspector_reviews_log` | Master inspector decision/payout log. |
| `inspector_rfis`, `inspector_rfi_catalog`, `inspector_responses` | Inspector Q&A sub-system — **`inspector_rfi_catalog` and `inspector_responses` are unused (zero app-code references)**; `inspector_rfis` is touched only by account-deletion cleanup. |

### Platform / Admin
| Table | Purpose |
|---|---|
| `platform_settings` | Key/value feature flags. Only one key is actually used today: `inspector_feature_enabled`. |
| `admin_actions` | Write-only admin audit log (inspector pricing/flags/master-inspector actions) — **no admin page reads it back**. |
| `audit_log` | Present in schema, **zero references in application code** — likely vestigial or DB-trigger-only. |
| `support_requests` | General support ticket queue. |
| `problem_reports` | Site-wide "Report a Problem" submissions. |
| `contractor_directory_public` | A view mirroring public contractor fields — **unused**; the live `/contractors` pages query `contractor_profiles` directly instead. |

### Migration Coverage Gap (important)
Only **15 of the 41 tables** have a `CREATE TABLE` in tracked migrations (`supabase/migrations/001` through `015`). The other **26 — including `profiles`, `projects`, `bids`, `bid_versions`, `contractor_profiles`, `project_awards`, `rfis`, `coupon_codes`, `client_credits`, `inspector_price_list`, and more — were created directly in the Supabase dashboard, outside version control.**

All 15 migration-tracked tables explicitly enable Row Level Security with defined policies. **The RLS status of the other 26 tables — including the three most business-critical ones (`profiles`, `projects`, `bids`) — cannot be verified from this repository.** This is the single most important data-layer gap in the project: the database's actual security posture is not fully captured in source control, and would need to be checked directly in the Supabase dashboard to confirm.

---

## 3. Authentication System

- **Provider:** Supabase Auth (email/password), via `@supabase/ssr` cookie-based sessions.
- **Two Supabase clients:**
  - `createSupabaseServerClient()` (`src/lib/supabase/server.ts`) — cookie-bound, respects RLS, used for user-scoped reads/writes.
  - `supabaseAdmin` (`src/lib/supabase/admin.ts`) — service-role client, bypasses RLS entirely, used for cross-user admin operations, webhooks, and background jobs.
- **Roles:** `CLIENT`, `CONTRACTOR`, `ADMIN`, `INSPECTOR` — a single `role` column on `profiles`. No row-level or team-based permissions beyond this.
- **Central chokepoint — `requireRole(allowedRoles[])`** (`src/lib/auth/requireRole.ts`), called at the top of essentially every dashboard page and server action:
  1. Resolves the current user from cookies; redirects to `/login` if absent.
  2. Fetches `profiles.role` + `profiles.deactivated`.
  3. **If deactivated**, signs the user out and redirects with an error — this is the *only* enforcement point for deactivation, but since every protected page/action routes through it, it's consistently applied.
  4. If the resolved role isn't in the allowed list, redirects to `/dashboard` (which then routes correctly by role).
  5. Returns `{ supabase, user, role }` for the caller to use.
- **Signup:** client-side `supabase.auth.signUp()` (no server action) creates the `auth.users` row; a Postgres trigger (`handle_new_user`, defined in `005_service_area.sql`) auto-creates the matching `profiles` row. Account creation is **fully decoupled from Stripe** — a contractor can sign up, build a complete profile, and even get directory-verified without ever subscribing (see §7).
- **Password reset:** standard Supabase flow via `/forgot-password` → `/reset-password`.
- **Admin user management:** `deactivateUser`/`reactivateUser`/`changeUserRole` (simple `profiles` updates), plus a batch **permanent account deletion** tool (`src/app/dashboard/admin/users/deleteAccounts.ts`) restricted to already-deactivated accounts — does an explicit, dependency-ordered multi-table delete (not a DB cascade, since cascade behavior on the 26 unmigrated tables can't be assumed) plus Storage cleanup and `supabaseAdmin.auth.admin.deleteUser()`.

---

## 4. Background Jobs

Four Vercel Cron routes under `src/app/api/cron/`:
| Job | Purpose |
|---|---|
| `emergency-auto-close` | Closes emergency-bid projects after their 48-hour window. |
| `credit-expiry` | Expires stale `client_credits`, sends reminder emails. |
| `dispute-sla` | Sends SLA-breach reminders on unresolved inspector upgrade disputes (day-3/day-5). |
| `message-notifications` | Batches unread project-message email notifications. |

---

## 5. Completed Features (by role)

**Admin** — 22 distinct tools: user management (incl. permanent deletion), project oversight, veteran-cert review, contractor directory/credential verification, bid-dismissal moderation + analytics, support & problem-report queues, inspector program (requests/flags/disputes/master-inspectors/pricing/revenue), override requests, emergency-request monitoring, subscription-dispute queue, coupon codes, expansion waitlist, and a feature-flag settings page.

**Client** — project lifecycle from draft → sealed-bid → award → completion; combined draft-creation + file-upload flow; RFI pre-answering and Q&A; bid review/award with anonymized comparison; post-award messaging; project deletion (timing-gated) vs. archival (activity-gated, data-retaining); emergency-bid fee path; inspector takeoff request + payment + upgrade-dispute path; credits balance.

**Contractor** — signup independent of payment; profile with flexible credentials (multiple license/bond types) and veteran verification (TVC/VA VetCert); portfolio photos; subscription checkout with 3/6/12-month term pricing + standard/veteran tiers + coupon support; sealed bid submission with quote PDF and line items; RFI submission; post-award messaging and completion signaling; subscription-gated directory listing, project browsing, and project detail viewing (with a bid-relationship carve-out so a lapsed subscription can't retract access to a project already bid on).

**Inspector** — takeoff assignment workflow, dispute response, Master Inspector review/refund authority, SLA tracking.

**Platform-wide** — EXIF/GPS metadata stripped from all uploaded photos server-side; sealed-bid identity protection (client identity hidden until award); service-area ZIP gating with waitlist; site-wide "Report a Problem" tool; GA4 analytics; Stripe fully in **live mode** (verified against the real account, all Prices/webhook/env vars confirmed live).

---

## 6. Unfinished / Dead Code

- **Analytics revenue tracking is a placeholder** (`admin/analytics/page.tsx`) — explicitly labeled "Coming soon," shows `—` for subscription/inspector revenue despite the underlying Stripe data existing elsewhere in the app.
- **`admin_actions` audit log has no viewer** — rows are written on every inspector-pricing/flag/master-inspector action, but no admin page displays them.
- **Dead tables** (zero app-code references): `project_services`, `inspector_rfi_catalog`, `inspector_responses`, `contractor_directory_public`, `audit_log`.
- **Write-only tables with no reader UI:** `bid_acknowledgments`, `project_attachments`, `project_revisions` — schema and write paths exist (or exist only in the account-deletion cleanup script), but no feature displays this data back.
- **Feature-flag system is underused** — the framework (`platform_settings` + `getFeatureFlag`) supports arbitrary flags, but only one (`inspector_feature_enabled`) is actually wired up; the settings page itself notes more could be added "as needed."
- **No multi-seat/team accounts** — deliberate, stated gap (client-facing copy on `/for-property-managers` says so directly), not an oversight.
- **`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`** is set in the environment but never referenced in application code — the app uses redirect-based Stripe Checkout, not Stripe.js/Elements, so this key is vestigial.

---

## 7. Known Issues / Risk Areas

1. **RLS unverifiable on 26 of 41 tables** (see §2) — the highest-priority item to check directly against the live Supabase project, since it includes `profiles`, `projects`, and `bids`.
2. **26 tables have no tracked migration** — schema history for most of the app isn't reproducible from source control alone; any future environment rebuild would need a manual schema dump from the live project first.
3. **Account creation has no subscription gate** (by design, confirmed and accepted this session) — a contractor can fully onboard, get verified, and previously could appear in the public directory without ever paying. This is now closed off at the directory/browsing/project-detail level (subscription-gated), but it's worth knowing the account layer itself still has no payment requirement.
4. **Cross-user data has no anonymization on deletion** — the account-deletion tool does full cascading hard-deletes; a real user's own project/bid history could lose a reference if a counterpart account is later deleted. Accepted as fine for pre-launch test-data cleanup; would need reconsideration before ever being used against a real account for a different reason.
5. **No detailed pre-deletion preview** — both project deletion and user-account deletion proceed on a basic "cannot be undone" confirmation without an itemized breakdown of exactly what will cascade.
6. **Emergency-bid mode bypasses sealed bidding** — by design (client sees bids as submitted), but it's a real, intentional exception to the platform's core "sealed bid" value proposition worth remembering when explaining the product.
7. **Domain redirect (`getonp.com` → `ournextproject.us`)** — last known status: parked on GoDaddy, not redirecting; you indicated you'd configure this yourself.
8. **Legal language on file is placeholder-grade** — the sealed-bid circumvention clause added to the ToS this session was explicitly flagged as "placeholder reasoning, not legal advice" — real legal review is still warranted before it's relied on for actual enforcement.

---

## 8. Environment / Deployment

- **Hosting:** Vercel, production deploys via `npm run deploy` (`vercel --prod`).
- **Database/Auth/Storage:** Supabase (project `efxjujtetreipxvxxfip`).
- **Payments:** Stripe, **live mode**, 9 Prices across 3 Products (Standard/Veteran monthly + 3/6/12mo terms, Emergency fee), 1 live webhook endpoint covering 6 event types.
- **Email:** Resend, all templates in `src/lib/email.ts`.
- **Image processing:** `sharp` (EXIF stripping on upload), server-bundled via `serverExternalPackages`.
- **Maps:** Mapbox GL (general-area project location display, pre-award).
- **No test suite, no CI pipeline, no staging environment** — deploys go directly from local build verification (`tsc --noEmit` + `npm run build`) straight to production, per your standing instruction to skip local/preview verification and trust the build/deploy/curl-verify loop.
