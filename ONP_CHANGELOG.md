# ONP — Recent Development Sessions Changelog

**Covers:** Punch Lists 8 through 12, plus follow-up fixes (commits `8a8211c` → `08b4570`, 2026-07-27 through 2026-08-05)
**Source:** compiled directly from `git log --stat`, not from memory — every file listed below is a real diff.

---

## Punch List 8 — Go-Live Checklist Phase 2
*Commit `8a8211c` (33 files) + `0f4bf1c` (4 files)*

**Features added**
- Site-wide "Report a Problem" floating button (`ReportProblemButton.tsx`), on every page via the root layout — captures page URL, description, optional screenshot, and the logged-in user's account/role automatically. Feeds an admin email alert plus a queue page at `/dashboard/admin/problem-reports`.
- `/help/bids` and `/help/contractor-bids` gated behind the inspector feature flag, closing a gap where public help content promoted a disabled feature.
- Beta status removed entirely — `BetaDisclaimerBanner` component deleted, its 12 usages removed, dashboard banner removed, subscribe-page beta copy removed.
- ToS/Privacy legal pages filled in for real: effective date, business address, and vendor disclosures (Resend, GA4, no third-party support tool) — previously live with literal `[PLACEHOLDER]` text.
- Subscription-charge Stripe disputes now get a real admin queue (`/dashboard/admin/subscription-disputes`) — the existing `charge.dispute.created` webhook handler previously did nothing for this case.
- Multifamily hero photo added to `/for-property-managers`.
- Veteran branch badges switched from emoji to a custom hexagon line-art icon set (`BranchIcon.tsx`, first version).

**Database changes**
- New table `problem_reports` (migration `013_problem_reports.sql`)
- New table `subscription_disputes` (migration `014_subscription_disputes.sql`)
- New private Storage bucket `problem-report-screenshots`

**Files touched:** 37 files across marketing pages (beta-banner removal), `src/app/api/webhooks/stripe/route.ts`, `src/lib/email.ts`, new admin pages/actions, new `ReportProblemButton.tsx` / `problemReport/actions.ts`.

---

## Punch List 9 — Branch Badge Redesign
*Commits `d16ab6a`, `a7b5e87`, `b83dab0`*

**Features added**
- Replaced the Punch List 8 hexagon line-art badges entirely (not additive) with a "mascot animal-track" design per branch — generic, non-official artwork (paw/hoof/talon prints), each on a branch-colored hexagon.
- Redrew the Army mark after your reference image feedback (hoof-print silhouette, not the original ring+triangle).
- Added a branch-badge reference panel to the Vet Certification admin page so all 7 badges can be viewed in one place.

**Files touched:** `src/components/icons/BranchIcon.tsx` (full rewrite), `src/app/dashboard/contractor/page.tsx`, `src/app/dashboard/admin/vet-certification/page.tsx`.

**No database changes.**

---

## Punch List 10 — Subscription-Gated Visibility, EXIF Stripping, ToS Clause
*Commit `bff685a` (13 files)*

**Features added**
- Directory listing (`/contractors`, `/contractors/[id]`), open-projects browsing, and project detail viewing now all require an active/trialing subscription — enforced at the **query layer**, not just hidden UI. Verified before shipping that the one live directory listing wasn't accidentally removed.
- Exception: a contractor who already has a bid on a specific project keeps access to it even if their subscription later lapses.
- EXIF/GPS metadata now stripped server-side from every uploaded project photo and portfolio photo (via `sharp`), closing a real address-leak path. Project file uploads moved from direct client→Storage calls to a server action to make this unbypassable.
- New ToS clause (§7.5 + prohibited-conduct list) prohibiting using information from an active bid to circumvent the sealed-bid process by contacting a client directly — explicitly carves out normal directory browsing.

**Database changes**
- New migration `015_contractor_subscriptions_baseline.sql` — retroactively captures `contractor_subscriptions`' real live schema (it predated the tracked migration history).
- Added `sharp` as a dependency; `next.config.ts` updated with `serverExternalPackages: ["sharp"]`.

**Files touched:** `contractors/page.tsx`, `contractors/[id]/page.tsx`, `dashboard/contractor/projects/page.tsx`, `dashboard/contractor/projects/[id]/page.tsx`, `dashboard/client/projects/[id]/files/{FileUploader.tsx,actions.ts}`, `dashboard/contractor/profile/portfolio/actions.ts`, `terms/page.tsx`, `terms/legal/page.tsx`, `next.config.ts`, `package.json`.

---

## Punch List 11 — Client Project Deletion
*Commit `b86ee8d` (18 files)*

**Features added**
- A project can no longer be deleted or archived while its bidding window is still open.
- Tiered outcome once the window closes: zero bids ever → permanent hard delete (two-step "cannot be undone" confirm); any bid activity or an award → archive instead (soft-delete, standard confirm, all data retained).
- Archiving reuses the existing (previously unused) `CANCELED` enum value on `projects.state` — no new migration needed. Added `projectStateLabel()` so it displays as "ARCHIVED" everywhere, with a new neutral gray badge style instead of the old red "canceled" one.
- Archiving an un-awarded project immediately emails every contractor who bid (`sendProjectArchivedEmail`), matching the existing dismissal-notification pattern.

**Database changes**
- None (reused existing enum value).

**Files touched:** `dashboard/client/projects/actions.ts` (new `archiveProject`, rewritten `deleteProject`), new `ArchiveProjectButton.tsx`, rewritten `DeleteProjectButton.tsx`, `src/lib/ui.ts` (new `projectStateLabel`), `src/lib/email.ts`, plus 9 files updated to use the new label helper wherever a project state badge renders.

---

## Punch List 12 — Admin Permanent Deletion of Deactivated Users
*Commit `9fc8ab9` (3 files)*

**Features added**
- Batch-select deactivated accounts (checkboxes in the existing Deactivated panel) for permanent deletion — server-side guardrail rejects any account that isn't already deactivated, not just a UI restriction.
- Count-aware "cannot be undone" confirmation.
- Full cascading hard-delete across every dependent table (verified against the live schema — several tables use plain UUID columns with **no enforced foreign key**, so this is explicit application-code deletion, not a DB cascade). All 60 table/column references were cross-checked against the live schema before shipping.
- Judgment call applied: rows the deleted user *owns* are deleted outright; columns where they're merely an *actor* on someone else's row (e.g., an admin who verified a different contractor's credential) are nulled instead, to avoid destroying real users' data. `audit_log`/`admin_actions` left untouched entirely.
- Also purges the user's physical files from Storage (portfolio photos, screenshots, project files, bid quotes) before deleting DB rows and the Supabase Auth account.

**Database changes**
- None (no schema change — deletion logic only).

**Files touched:** new `DeactivatedUsersPanel.tsx`, new `deleteAccounts.ts`, `dashboard/admin/users/page.tsx`.

---

## Follow-up fixes (post-Punch-List-12)

| Commit | Fix |
|---|---|
| `a5ef1fe` | Project photo uploads over ~1MB were failing with a generic error — Next.js Server Actions cap request bodies at 1MB by default, and the EXIF-stripping upload path (added in PL10) routes through a server action. Raised the cap to 10MB in `next.config.ts` to match the action's own file-size limit. |
| `275fc5c` | Combined draft creation and file upload into one continuous flow — creating a draft now redirects straight into the file-upload page ("Step 2 of 2") instead of a separate later trip. Emergency requests unchanged (still go straight to payment). |
| `08b4570` | Replaced the generated mascot-track SVG badges with your supplied artwork (7 PNG files). Cropped each to hexagon-only via `sharp` (auto-detected the divider-line row) since the source files had "U.S. X Veteran" text baked in, which the app already renders separately as real text and would've been illegible at small icon sizes. |

---

## Infrastructure changes (not in git — Stripe/Vercel)

These happened outside the repo and won't show in `git log`, but were part of this session's work:

- **Stripe flipped to live mode**: created 3 live Products, 9 live Prices (matching test-mode amounts exactly), registered a live webhook endpoint (`we_1TxzzBPTbUkNV1jMm5QbrmsR`) covering 6 event types.
- **Vercel production env vars swapped** to live Stripe values (secret key, publishable key, webhook secret, all 9 Price IDs) — verified via direct Stripe API calls before and after.
- **Stripe secret key rotated once** (at your initiative, after the original key was shared in chat) — old key retired, new key verified and swapped into Vercel, redeployed within the rotation grace window.

---

## Post-launch verification — 2026-08-08

- **Live Stripe webhook endpoint confirmed correctly configured.** During the service-area/waitlist review branch work, an audit of `src/app/api/webhooks/stripe/route.ts` found the code now handles 6 event types (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `charge.dispute.created`, `invoice.payment_failed`, `checkout.session.expired`), and the **TEST-mode** webhook endpoint (visible via the local `sk_test_` key in `.env.local`) was found subscribed to only 4 of the 6 — missing `charge.dispute.created` and `checkout.session.expired`. That gap was fixed directly via the Stripe API against the test-mode endpoint.
- The live-mode secret key is not locally accessible (by design — see the key-rotation note above; Vercel's Production `STRIPE_SECRET_KEY` is stored as a write-only "Sensitive" value and cannot be read back via CLI or dashboard), so the live endpoint could not be checked the same way.
- Sam manually checked the **live-mode** Stripe Dashboard directly and confirmed the production webhook endpoint (`https://ournextproject.us/api/webhooks/stripe`, status Enabled) is already subscribed to exactly the same 6 events the code handles — no gap on the live side. This matches the original live-mode flip's own claim above ("1 live webhook endpoint covering 6 event types") — the flip apparently configured live mode correctly from the start; the 4-of-6 gap found this session existed only on the separate test-mode endpoint used for local dev.
- No live Stripe changes were made. This entry documents Sam's direct dashboard verification, not an independent API check (none was possible without live credentials).

---

## Unfinished / outstanding work

1. **Housekeeping migration not yet confirmed run**: `015_contractor_subscriptions_baseline.sql` was written and is safe to run (all statements no-op if objects already exist), but I don't have confirmation it's been executed in the Supabase SQL Editor — worth checking.
2. **RLS status unverifiable on 26 of 41 database tables** (see the architecture report from earlier) — including `profiles`, `projects`, and `bids`. This predates all the work in this changelog; not something introduced by these sessions, but still open.
3. **`admin_actions` audit log has no viewer page** — data is being written (inspector pricing/flags/master-inspector actions) but nothing displays it.
4. **Analytics revenue tracking is a labeled placeholder** — unrelated to this session's work but still open.
5. **Legal language added this session is placeholder-grade** — the sealed-bid circumvention ToS clause (Punch List 10) was explicitly flagged as "placeholder reasoning, not legal advice." Real legal review is still warranted.
6. **Domain redirect** (`getonp.com` → `ournextproject.us`) — you indicated you'd handle this yourself via GoDaddy; last known status was not yet configured.
7. **No open punch list items** as of this writing — everything explicitly requested through Punch List 12 and its follow-ups has shipped and been verified live.
