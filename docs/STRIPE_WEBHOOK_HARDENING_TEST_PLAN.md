# Stripe Webhook Hardening — Manual Staging Test Plan

No automated test framework exists in this repo (no `jest`/`vitest`/`mocha`,
no `*.test.*` files, no `test` script in `package.json`). Introducing one
was out of scope for this task, per instruction. This is a deterministic
manual test plan to run against **staging** (`qbdihnmgxtowqnvzflfh`) using
the Stripe CLI, before this branch is deployed.

Prerequisites: `npm run dev:staging` running locally, `stripe listen
--forward-to localhost:3000/api/webhooks/stripe` pointed at it, staging
`STRIPE_WEBHOOK_SECRET` set in `.env.staging.local`.

## 1. Required DB write fails → webhook returns non-2xx

Temporarily revoke `UPDATE` on `emergency_request_log` for `service_role` in
staging only (`REVOKE UPDATE ON public.emergency_request_log FROM
service_role;`), then fire a `checkout.session.completed` event with
`metadata.payment_type=emergency` and valid `project_id`/`client_id`/
`log_id` (via `stripe trigger checkout.session.completed` with fixture
overrides, or replay a captured staging event with `stripe events resend`).

Expect: HTTP 500 from the webhook endpoint (visible in `stripe listen`
output as a failed delivery), a `console.error`-visible `Error` in the dev
server log naming the failing write, and — critically — the `projects` row
still shows `state=OPEN` (the first write succeeded and committed) while
`emergency_request_log.payment_status` is still not `PAID`. Re-grant the
privilege afterward.

## 2. Successful required write → 200

Fire the same event type with the grant restored. Expect: HTTP 200, log
line `Emergency project ${projectId} activated`, `projects.state=OPEN` and
`emergency_request_log.payment_status=PAID` both persisted.

## 3. Expected no-op → 200

Re-send the *same* event id a second time (`stripe events resend
<event_id>`, or replay the same fixture). Expect: HTTP 200, log line
`Emergency project activation ...: already applied (projects.state=OPEN) —
treating retry as idempotent no-op`, no duplicate contractor-notification
emails sent (verify via Resend dashboard / dev email log — should show zero
new sends on the retry).

Repeat the same "fire once, then resend" pattern for at least:
`customer.subscription.updated`, `customer.subscription.deleted`,
`invoice.payment_failed`, `checkout.session.expired` (both `inspector` and
`inspector_upgrade` metadata variants).

## 4. Duplicate/retried dispute event → safe/idempotent behavior

Fire `charge.dispute.created` twice with the same `dispute.id`, for a
`payment_intent` that does **not** match any `emergency_request_log` row
(so it falls into the subscription-dispute branch). Expect:
- First delivery: HTTP 200, one new row in `subscription_disputes`, one
  admin-notification email attempt per admin profile.
- Second delivery: HTTP 200, log line `Subscription dispute <id> already
  recorded — duplicate delivery, skipping re-notification`, **no** second
  row in `subscription_disputes` (enforced independently by the
  `subscription_disputes_stripe_dispute_id_key` unique constraint — this
  test verifies the application layer also stops re-emailing admins rather
  than relying solely on the DB to reject the insert).

Then fire `charge.dispute.created` twice for a `payment_intent` that *does*
match an `emergency_request_log` row. Expect both deliveries return 200,
`emergency_request_log.payment_status=DISPUTED` and
`profiles.suspended=true` on the client — verify the second delivery is a
true no-op re-write (no error, no duplicate side effect) since these writes
are unconditional but idempotent by value.

## 5. Unexpected-state refusal (regression guard for requirement 4)

Manually set a `project_inspector_assignments` row's `payment_status` to
`FAILED` (simulating an already-expired checkout), then fire
`checkout.session.completed` with `metadata.payment_type=inspector`
pointing at that assignment id. Expect: HTTP 500, an error naming
`expected project_inspector_assignments.id=... to have
payment_status=PENDING, found FAILED — refusing to overwrite unexpected
state`, and the row's `payment_status` remains `FAILED` (not silently
flipped to `PAID`). This confirms requirement 4 — "0 rows updated" is never
blindly treated as success when the business logic requires a matching
record in a specific state.

## 6. Missing-local-row ownership semantics (isKnownOnpCustomer)

Covers the follow-up patch on top of `2ce4e90` for `customer.subscription.
updated`, `customer.subscription.deleted`, and `invoice.payment_failed`
when no matching `contractor_subscriptions` row exists.

### A. Missing local row + provably-ONP customer → non-2xx

Create a real Stripe Customer in staging test mode with `metadata:
{ contractor_id: "<any uuid>" }` (e.g. via the Stripe Dashboard or
`stripe customers create --metadata contractor_id=<uuid>`), attach a
subscription to it (`stripe subscriptions create` or a real Checkout
Session), but do **not** let `contractor_subscriptions` gain a row for it
(e.g. create the customer/subscription out-of-band, not through ONP's own
subscribe flow). Fire `customer.subscription.updated` for that
subscription. Expect: HTTP 500, log line containing `no local
contractor_subscriptions row for provably-ONP customer ... — state drift or
checkout.session.completed delivery-order race`. Repeat for
`customer.subscription.deleted` and `invoice.payment_failed` against the
same customer.

### B. Missing local row + synthetic/non-ONP customer → 200

Run `stripe trigger customer.subscription.updated` (a synthetic CLI
fixture — its customer carries no `contractor_id` metadata and has no
local row). Expect: HTTP 200, log line containing `no local record, not
provably ONP, skipping`. Repeat for `customer.subscription.deleted` and
`invoice.payment_failed` via their respective `stripe trigger` fixtures.
This confirms CLI testing remains safe and does not trigger retry storms.

### C. Stripe Customer retrieval transient failure → non-2xx

Fire `customer.subscription.updated` for a `customer` id that does not
exist in the current Stripe account/mode at all (e.g. hand-edit a captured
event's `customer` field to a made-up `cus_...` id before replaying it with
`stripe events resend`, or point staging's Stripe secret key at a
mismatched mode temporarily). `stripe.customers.retrieve` should throw
(Stripe returns a "No such customer" API error, which `isKnownOnpCustomer`
treats the same as any other lookup failure — ownership `"unknown"`).
Expect: HTTP 500, log line containing `could not determine ONP ownership
for customer ... (Stripe lookup failed) — failing closed for retry`. This
confirms a transient/lookup failure is never silently downgraded to "not
ONP."

### D. Local row exists + successful update → 200

Run the normal subscribe flow in staging (real Checkout Session through
`/dashboard/contractor/subscribe`) so `contractor_subscriptions` has a row,
then fire `customer.subscription.updated` for that same customer. Expect:
HTTP 200, normal `Subscription updated for customer ...` log line, updated
fields reflected in `contractor_subscriptions`. Confirms the existing-row
path from `2ce4e90` is unchanged by this patch.

## Sign-off checklist

- [ ] Section 1 passes (required failure → non-2xx, no false "success" log)
- [ ] Section 2 passes (success path unchanged)
- [ ] Section 3 passes for all listed event types (idempotent retries → 200,
      no duplicate emails)
- [ ] Section 4 passes for both dispute branches
- [ ] Section 5 passes (unexpected state is refused, not overwritten)
- [ ] Section 6A passes (provably-ONP missing row → non-2xx, for all three
      event types)
- [ ] Section 6B passes (synthetic/non-ONP missing row → 200, for all three
      event types, CLI triggers remain safe)
- [ ] Section 6C passes (Stripe lookup failure → non-2xx, not silently
      treated as "not ONP")
- [ ] Section 6D passes (existing-row path unchanged)
