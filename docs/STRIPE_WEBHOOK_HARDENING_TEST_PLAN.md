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

## Sign-off checklist

- [ ] Section 1 passes (required failure → non-2xx, no false "success" log)
- [ ] Section 2 passes (success path unchanged)
- [ ] Section 3 passes for all listed event types (idempotent retries → 200,
      no duplicate emails)
- [ ] Section 4 passes for both dispute branches
- [ ] Section 5 passes (unexpected state is refused, not overwritten)
