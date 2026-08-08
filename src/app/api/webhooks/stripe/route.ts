import { NextRequest, NextResponse } from "next/server";
import { stripe, EMERGENCY_FEE_CENTS } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { restoreCredits } from "@/lib/credits";
import {
  sendEmergencyProjectEmail,
  sendInspectorRequestAvailableEmail,
  sendInspectorPaymentConfirmedEmail,
  sendAdminInspectorRequestEmail,
  sendInspectorUpgradeChargedEmail,
  sendInspectorUpgradeConfirmedEmail,
  sendSubscriptionDisputeAdminEmail,
} from "@/lib/email";

/**
 * Derives billing display fields from a Stripe subscription's current item.
 * interval_count distinguishes a committed-term phase (month, interval_count
 * 3/6/12 — one upfront charge covering the whole term) from plain monthly
 * billing (month, interval_count 1) — Stripe's `interval` string alone can't
 * tell them apart, both are "month".
 */
function getBillingFields(sub: any) {
  const item = sub.items?.data?.[0];
  const intervalRaw = item?.price?.recurring?.interval ?? "month";
  const intervalCount = item?.price?.recurring?.interval_count ?? 1;
  const intervalMap: Record<string, string> = {
    month: "MONTHLY",
    quarter: "QUARTERLY",
    year: "YEARLY",
  };
  const planInterval = intervalMap[intervalRaw] ?? "MONTHLY";
  const priceCents = item?.price?.unit_amount ?? 0;
  const termMonths = intervalRaw === "month" && [3, 6, 12].includes(intervalCount) ? intervalCount : null;
  const commitmentEndsAt = termMonths && item?.current_period_end
    ? new Date(item.current_period_end * 1000).toISOString()
    : null;

  return { priceCents, planInterval, termMonths, commitmentEndsAt };
}

function getPeriodEnd(sub: any): string {
  const raw =
    sub.current_period_end ??
    sub.items?.data?.[0]?.current_period_end ??
    null;

  if (raw && !isNaN(Number(raw))) {
    return new Date(Number(raw) * 1000).toISOString();
  }

  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
}

type ConditionalUpdateOutcome = "applied" | "already-done";

/**
 * Applies a conditional UPDATE that must succeed for the Stripe event to be
 * considered processed. If no row matches the guard condition, re-reads the
 * row to distinguish a safe idempotent retry (state already reflects the
 * target write — a prior delivery of this same event already applied it, or
 * a value in `alreadyDoneValues`) from a genuine failure (row missing, or in
 * an unexpected state). Genuine failures throw, which the route-level
 * handler turns into a non-2xx response so Stripe retries the event.
 */
async function applyRequiredConditionalUpdate(opts: {
  table: string;
  update: Record<string, unknown>;
  matchColumn: string;
  matchValue: string;
  conditionColumn: string;
  conditionValue: string;
  alreadyDoneValues: string[];
  context: string;
}): Promise<ConditionalUpdateOutcome> {
  const { table, update, matchColumn, matchValue, conditionColumn, conditionValue, alreadyDoneValues, context } = opts;

  const { data, error } = await supabaseAdmin
    .from(table)
    .update(update)
    .eq(matchColumn, matchValue)
    .eq(conditionColumn, conditionValue)
    .select(conditionColumn);

  if (error) {
    throw new Error(`${context}: update failed (${table}.${matchColumn}=${matchValue}) — ${error.message}`);
  }
  if (data && data.length > 0) {
    return "applied";
  }

  // Nothing matched the conditional update — read current state to tell an
  // already-applied retry apart from a genuine problem.
  const { data: current, error: lookupErr } = await supabaseAdmin
    .from(table)
    .select(conditionColumn)
    .eq(matchColumn, matchValue)
    .maybeSingle();

  if (lookupErr) {
    throw new Error(`${context}: post-update lookup failed (${table}.${matchColumn}=${matchValue}) — ${lookupErr.message}`);
  }
  if (!current) {
    throw new Error(`${context}: no ${table} row found for ${matchColumn}=${matchValue}`);
  }

  const currentValue = String((current as unknown as Record<string, unknown>)[conditionColumn]);
  if (alreadyDoneValues.includes(currentValue)) {
    console.log(`${context}: already applied (${table}.${conditionColumn}=${currentValue}) — treating retry as idempotent no-op`);
    return "already-done";
  }

  throw new Error(
    `${context}: expected ${table}.${matchColumn}=${matchValue} to have ${conditionColumn}=${conditionValue}, found ${currentValue} — refusing to overwrite unexpected state`
  );
}

type OwnershipCheck = "onp" | "not-onp" | "unknown";

/**
 * Determines whether a Stripe Customer was created by ONP's own
 * subscribe flow, using the contractor_id metadata that
 * src/app/dashboard/contractor/subscribe/actions.ts sets on every Stripe
 * Customer it creates. Used only to decide whether a missing
 * contractor_subscriptions row is real state drift (fail, so Stripe
 * retries) or an unrelated/synthetic Stripe object (safe no-op).
 *
 * "unknown" (the lookup itself failed) is deliberately NOT the same as
 * "not-onp" — a transient Stripe API failure must not be silently
 * classified as "not ours," since that could swallow a real ONP event.
 */
async function isKnownOnpCustomer(customerId: string): Promise<OwnershipCheck> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if ((customer as any).deleted) {
      console.log(`Ownership check: customer is deleted — not provably ONP`);
      return "not-onp";
    }
    const contractorId = (customer as any).metadata?.contractor_id;
    if (typeof contractorId === "string" && contractorId.length > 0) {
      return "onp";
    }
    console.log(`Ownership check: customer has no contractor_id metadata — not provably ONP`);
    return "not-onp";
  } catch (err) {
    console.error(
      `Ownership check: Stripe customer retrieval failed — cannot determine ONP ownership:`,
      err instanceof Error ? err.message : err
    );
    return "unknown";
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;

        // ── Emergency bid payment ─────────────────────────────
        if (session.metadata?.payment_type === "emergency") {
          const projectId = session.metadata?.project_id;
          const clientId  = session.metadata?.client_id;
          const logId     = session.metadata?.log_id;
          const paymentIntentId = session.payment_intent;

          if (!projectId || !clientId || !logId) {
            console.error("Emergency webhook missing metadata fields");
            break;
          }

          const now = new Date();
          const autoCloseAt = new Date(now.getTime() + 48 * 60 * 60 * 1000); // +48 hours

          // Activate the project. REQUIRED: failure here means the client
          // paid but the project never went live — must fail non-2xx so
          // Stripe retries. A retry that finds state already advanced past
          // PENDING_PAYMENT is treated as an idempotent no-op, not a failure.
          const activationOutcome = await applyRequiredConditionalUpdate({
            table: "projects",
            update: {
              state: "OPEN",
              published_at: now.toISOString(),
              deadline_at: autoCloseAt.toISOString(),
              emergency_paid_at: now.toISOString(),
              emergency_payment_id: paymentIntentId ?? null,
              emergency_auto_close_at: autoCloseAt.toISOString(),
              updated_at: now.toISOString(),
            },
            matchColumn: "id",
            matchValue: projectId,
            conditionColumn: "state",
            conditionValue: "PENDING_PAYMENT",
            alreadyDoneValues: ["OPEN", "BIDDING_CLOSED", "BIDS_UNLOCKED", "AWARDED", "CANCELED", "COMPLETED", "EMERGENCY_EXPIRED"],
            context: `Emergency project activation (project ${projectId})`,
          });

          // Update log row to PAID. REQUIRED: this is the payment-status
          // record of record for the emergency fee — must not silently fail.
          const { data: logData, error: logErr } = await supabaseAdmin
            .from("emergency_request_log")
            .update({
              payment_status: "PAID",
              stripe_payment_intent_id: paymentIntentId ?? null,
            })
            .eq("id", logId)
            .select("id");

          if (logErr) {
            throw new Error(`Emergency log update failed (log ${logId}): ${logErr.message}`);
          }
          if (!logData || logData.length === 0) {
            throw new Error(`Emergency log update matched no row (log ${logId})`);
          }

          // Notify eligible contractors. Skipped on an idempotent retry
          // (activation already happened on a prior delivery) to avoid
          // re-emailing every matching contractor on each Stripe retry.
          if (activationOutcome === "applied") try {
            const { data: projectData } = await supabaseAdmin
              .from("projects")
              .select("title, category, city, location_general")
              .eq("id", projectId)
              .single();

            if (projectData) {
              // Get contractors who have emergency notifications enabled,
              // matching the project category, with an active subscription
              const { data: contractorProfiles } = await supabaseAdmin
                .from("contractor_profiles")
                .select("contractor_id, categories")
                .contains("categories", [(projectData as any).category]);

              const contractorIds = (contractorProfiles ?? []).map((p: any) => p.contractor_id);

              if (contractorIds.length > 0) {
                // Filter to those with emergency notifications enabled
                const { data: settings } = await supabaseAdmin
                  .from("contractor_settings")
                  .select("contractor_id, emergency_notifications_enabled")
                  .in("contractor_id", contractorIds);

                const settingsMap = new Map(
                  (settings ?? []).map((s: any) => [s.contractor_id, s.emergency_notifications_enabled])
                );

                // Those without a settings row default to enabled (true)
                const notifyIds = contractorIds.filter((id: string) =>
                  settingsMap.get(id) !== false
                );

                // Send emails in parallel (fire and forget — don't let failures block the response)
                for (const cId of notifyIds) {
                  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(cId);
                  const email = authUser?.user?.email;
                  if (email) {
                    sendEmergencyProjectEmail({
                      contractorEmail: email,
                      projectTitle: (projectData as any).title ?? "Emergency Project",
                      projectCategory: ((projectData as any).category ?? "").replaceAll("_", " "),
                      projectCity: (projectData as any).city ?? (projectData as any).location_general ?? "",
                      projectId,
                      autoCloseAt: autoCloseAt.toISOString(),
                    }).catch((e) => console.error("Emergency email failed:", e));
                  }
                }
              }
            }
          } catch (notifyErr) {
            console.error("Emergency notification error (non-fatal):", notifyErr);
          }

          console.log(`Emergency project ${projectId} activated`);
          break;
        }

        // ── Inspector payment ─────────────────────────────────
        if (session.metadata?.payment_type === "inspector") {
          const assignmentId   = session.metadata?.assignment_id;
          const inspProjectId  = session.metadata?.project_id;
          const paymentIntentId = session.payment_intent;

          if (!assignmentId || !inspProjectId) {
            console.error("Inspector webhook missing metadata fields");
            break;
          }

          // Mark assignment as PAID. REQUIRED: failure means the client paid
          // but the assignment never left PENDING — must fail non-2xx.
          const inspectorPaidOutcome = await applyRequiredConditionalUpdate({
            table: "project_inspector_assignments",
            update: {
              payment_status: "PAID",
              stripe_payment_intent_id: paymentIntentId ?? null,
            },
            matchColumn: "id",
            matchValue: assignmentId,
            conditionColumn: "payment_status",
            conditionValue: "PENDING",
            alreadyDoneValues: ["PAID"],
            context: `Inspector assignment payment (assignment ${assignmentId})`,
          });

          // Fetch assignment + project details for notifications. Skipped
          // on an idempotent retry to avoid re-emailing the client, every
          // admin, and every inspector on each Stripe retry.
          if (inspectorPaidOutcome === "applied") try {
            const { data: asgn } = await supabaseAdmin
              .from("project_inspector_assignments")
              .select("pricing_key, fee_charged_cents, inspector_share_cents, client_id")
              .eq("id", assignmentId)
              .single();

            const { data: proj } = await supabaseAdmin
              .from("projects")
              .select("title, category, city, location_general, client_id")
              .eq("id", inspProjectId)
              .single();

            const { data: priceRow } = await supabaseAdmin
              .from("inspector_price_list")
              .select("display_name")
              .eq("pricing_key", asgn?.pricing_key ?? "")
              .maybeSingle();

            const projTitle      = (proj as any)?.title ?? "Project";
            const projCity       = (proj as any)?.city ?? (proj as any)?.location_general ?? "";
            const projCategory   = ((proj as any)?.category ?? "").replaceAll("_", " ");
            const inspectionType = priceRow?.display_name ?? (asgn as any)?.pricing_key ?? "Inspection";
            const feeCents       = (asgn as any)?.fee_charged_cents ?? 0;
            const shareCents     = (asgn as any)?.inspector_share_cents ?? 0;
            const clientId       = (asgn as any)?.client_id ?? (proj as any)?.client_id;

            // 1. Confirm payment to client
            if (clientId) {
              const { data: clientAuth } = await supabaseAdmin.auth.admin.getUserById(clientId);
              const { data: clientProfile } = await supabaseAdmin
                .from("profiles")
                .select("display_name")
                .eq("id", clientId)
                .maybeSingle();
              const clientEmail = clientAuth?.user?.email;
              if (clientEmail) {
                sendInspectorPaymentConfirmedEmail({
                  clientEmail,
                  clientName: (clientProfile as any)?.display_name ?? "Client",
                  projectTitle: projTitle,
                  inspectionType,
                  feeCents,
                  projectId: inspProjectId,
                }).catch((e) => console.error("Client inspector confirmation email failed:", e));
              }
            }

            // 2. Alert all admins to assign an inspector
            const { data: adminProfiles } = await supabaseAdmin
              .from("profiles")
              .select("id")
              .eq("role", "ADMIN");

            for (const admin of adminProfiles ?? []) {
              const { data: adminAuth } = await supabaseAdmin.auth.admin.getUserById(admin.id);
              const adminEmail = adminAuth?.user?.email;
              if (adminEmail) {
                sendAdminInspectorRequestEmail({
                  adminEmail,
                  projectTitle: projTitle,
                  projectCity: projCity,
                  projectCategory: projCategory,
                  inspectionType,
                  feeCents,
                  inspectorShareCents: shareCents,
                  projectId: inspProjectId,
                  assignmentId,
                }).catch((e) => console.error("Admin inspector alert email failed:", e));
              }
            }

            // 3. Notify all active inspectors
            const { data: inspectorProfiles } = await supabaseAdmin
              .from("profiles")
              .select("id")
              .eq("role", "INSPECTOR");

            for (const insp of inspectorProfiles ?? []) {
              const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(insp.id);
              const inspEmail = authUser?.user?.email;
              if (inspEmail) {
                sendInspectorRequestAvailableEmail({
                  inspectorEmail: inspEmail,
                  projectTitle: projTitle,
                  projectCity: projCity,
                  projectCategory: projCategory,
                  inspectionType,
                  inspectorShareCents: shareCents,
                }).catch((e) => console.error("Inspector notification email failed:", e));
              }
            }
          } catch (notifyErr) {
            console.error("Inspector notification error (non-fatal):", notifyErr);
          }

          // Pause the project bidding timer while inspector works.
          // OPTIONAL/BEST-EFFORT: the payment itself is already durably
          // recorded above; if this stamp fails the bidding timer just
          // won't pause and needs manual follow-up rather than blocking the
          // payment confirmation. Idempotent by construction (.is(...,
          // null) — only stamps once).
          const { error: holdErr } = await supabaseAdmin
            .from("projects")
            .update({ inspector_hold_started_at: new Date().toISOString() })
            .eq("id", inspProjectId)
            .is("inspector_hold_started_at", null); // only stamp once

          if (holdErr) {
            console.error(`Inspector hold timestamp update failed (non-fatal, needs manual follow-up; project ${inspProjectId}):`, holdErr);
          }

          console.log(`Inspector assignment ${assignmentId} marked PAID`);
          break;
        }

        // ── Inspector on-site upgrade payment ────────────────
        if (session.metadata?.payment_type === "inspector_upgrade") {
          const assignmentId   = session.metadata?.assignment_id;
          const inspProjectId  = session.metadata?.project_id;
          const paymentIntentId = session.payment_intent;

          if (!assignmentId || !inspProjectId) {
            console.error("Inspector upgrade webhook missing metadata");
            break;
          }

          const now = new Date().toISOString();

          // Fetch Comprehensive tier to get current share percent
          const { data: comprehensiveTier } = await supabaseAdmin
            .from("inspector_price_list")
            .select("fee_cents, inspector_share_percent")
            .eq("pricing_key", "COMPREHENSIVE")
            .maybeSingle();

          const totalFeeCents   = comprehensiveTier?.fee_cents ?? 39900;
          const sharePercent    = comprehensiveTier?.inspector_share_percent ?? 65;
          const inspShareCents  = Math.round((totalFeeCents * sharePercent) / 100);
          const onpShareCents   = totalFeeCents - inspShareCents;

          // Mark upgrade PAID and update assignment to Comprehensive pricing.
          // REQUIRED: failure means the client paid for the upgrade but the
          // assignment never reflects it — must fail non-2xx.
          const upgradePaidOutcome = await applyRequiredConditionalUpdate({
            table: "project_inspector_assignments",
            update: {
              upgrade_payment_status: "PAID",
              upgrade_charged_at: now,
              upgrade_stripe_payment_intent_id: paymentIntentId ?? null,
              pricing_key: "COMPREHENSIVE",
              fee_charged_cents: totalFeeCents,
              inspector_share_cents: inspShareCents,
              onp_share_cents: onpShareCents,
            },
            matchColumn: "id",
            matchValue: assignmentId,
            conditionColumn: "upgrade_payment_status",
            conditionValue: "PENDING",
            alreadyDoneValues: ["PAID"],
            context: `Inspector upgrade payment (assignment ${assignmentId})`,
          });

          // Send notifications. Skipped on an idempotent retry to avoid
          // re-emailing the client and inspector on each Stripe retry.
          if (upgradePaidOutcome === "applied") try {
            const { data: asgn } = await supabaseAdmin
              .from("project_inspector_assignments")
              .select("client_id, inspector_id, upgrade_fee_cents")
              .eq("id", assignmentId)
              .single();

            const { data: proj } = await supabaseAdmin
              .from("projects")
              .select("title")
              .eq("id", inspProjectId)
              .single();

            const projTitle = (proj as any)?.title ?? "Your Project";

            // Notify client — upgrade charged + dispute window
            if ((asgn as any)?.client_id) {
              const { data: clientAuth } = await supabaseAdmin.auth.admin.getUserById((asgn as any).client_id);
              const clientEmail = clientAuth?.user?.email;
              if (clientEmail) {
                sendInspectorUpgradeChargedEmail({
                  clientEmail,
                  projectTitle: projTitle,
                  projectId: inspProjectId,
                  upgradeFeeCents: (asgn as any)?.upgrade_fee_cents ?? 20000,
                }).catch((e: unknown) => console.error("Upgrade charged email failed:", e));
              }
            }

            // Notify inspector — proceed with Comprehensive
            if ((asgn as any)?.inspector_id) {
              const { data: inspAuth } = await supabaseAdmin.auth.admin.getUserById((asgn as any).inspector_id);
              const inspEmail = inspAuth?.user?.email;
              if (inspEmail) {
                sendInspectorUpgradeConfirmedEmail({
                  inspectorEmail: inspEmail,
                  projectTitle: projTitle,
                  projectId: inspProjectId,
                  assignmentId,
                }).catch((e: unknown) => console.error("Upgrade confirmed email failed:", e));
              }
            }
          } catch (notifyErr) {
            console.error("Inspector upgrade notification error (non-fatal):", notifyErr);
          }

          console.log(`Inspector upgrade for assignment ${assignmentId} marked PAID`);
          break;
        }

        // ── Contractor subscription ───────────────────────────
        const contractorId = session.metadata?.contractor_id;
        const planType = session.metadata?.plan_type;
        const term = session.metadata?.term;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        if (!contractorId || !subscriptionId) {
          console.log("Missing contractorId or subscriptionId — skipping");
          break;
        }

        const sub = await stripe.subscriptions.retrieve(subscriptionId) as any;
        console.log("SUB OBJECT:", JSON.stringify(sub, null, 2));

        const { priceCents, planInterval, termMonths, commitmentEndsAt } = getBillingFields(sub);
        const currency = (sub.currency ?? "usd").toUpperCase();
        const periodStart = sub.current_period_start
          ? new Date(sub.current_period_start * 1000).toISOString()
          : new Date().toISOString();
        const periodEnd = getPeriodEnd(sub);

        const { error: upsertError } = await supabaseAdmin
          .from("contractor_subscriptions")
          .upsert(
            {
              contractor_id: contractorId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              plan_type: planType,
              plan_interval: planInterval,
              price_cents: priceCents,
              currency: currency,
              status: "ACTIVE",
              current_period_start: periodStart,
              current_period_end: periodEnd,
              term_months: termMonths,
              commitment_ends_at: commitmentEndsAt,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "contractor_id" }
          );

        if (upsertError) {
          console.error("Supabase upsert error:", JSON.stringify(upsertError));
          throw new Error(`Supabase upsert failed: ${upsertError.message}`);
        }

        // Term commitment (3/6/12mo) — attach a Subscription Schedule so the
        // subscription auto-transitions, after this committed phase completes,
        // into ongoing monthly billing at the standard rate (not a re-
        // commitment to the same term, and not the discounted per-month-
        // equivalent rate — the discount was a reward for the upfront
        // commitment and doesn't carry forward).
        if (term === "3" || term === "6" || term === "12") {
          try {
            const schedule = await stripe.subscriptionSchedules.create({
              from_subscription: subscriptionId,
            });
            const currentPhase = schedule.phases[0];
            const monthlyPriceId = planType === "veteran" ? process.env.STRIPE_VETERAN_PRICE_ID! : process.env.STRIPE_STANDARD_PRICE_ID!;

            await stripe.subscriptionSchedules.update(schedule.id, {
              end_behavior: "release",
              phases: [
                {
                  items: currentPhase.items.map((i: any) => ({
                    price: typeof i.price === "string" ? i.price : i.price.id,
                    quantity: i.quantity,
                  })),
                  start_date: currentPhase.start_date,
                  end_date: currentPhase.end_date,
                },
                {
                  items: [{ price: monthlyPriceId, quantity: 1 }],
                },
              ],
            });
            console.log(`Subscription schedule created for contractor ${contractorId}: ${term}mo term -> monthly standard rate`);
          } catch (scheduleErr) {
            // Non-fatal — the term charge already succeeded and the subscription
            // is active either way; a failed schedule just means it won't
            // auto-transition and needs manual follow-up rather than silently
            // over- or under-charging anyone.
            console.error("Subscription schedule creation failed (non-fatal, needs manual follow-up):", scheduleErr);
          }
        }

        console.log(`Subscription activated for contractor ${contractorId}`);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as any;
        const customerId = sub.customer;

        const { data: existing, error: existingErr } = await supabaseAdmin
          .from("contractor_subscriptions")
          .select("contractor_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (existingErr) {
          throw new Error(`Subscription lookup failed for customer ${customerId}: ${existingErr.message}`);
        }
        if (!existing?.contractor_id) {
          const ownership = await isKnownOnpCustomer(customerId);
          if (ownership === "onp") {
            throw new Error(
              `Subscription update: no local contractor_subscriptions row for provably-ONP customer ${customerId} — state drift or checkout.session.completed delivery-order race`
            );
          }
          if (ownership === "unknown") {
            throw new Error(
              `Subscription update: could not determine ONP ownership for customer ${customerId} (Stripe lookup failed) — failing closed for retry`
            );
          }
          // EXPECTED NO-OP: customer is not provably ONP-owned (no local
          // record, no contractor_id metadata) — likely an unrelated or
          // synthetic Stripe object.
          console.log(`Subscription update for customer ${customerId} — no local record, not provably ONP, skipping`);
          break;
        }

        // Refresh price/term fields too, not just status/period — this is what
        // picks up a Subscription Schedule's phase transition (term commitment
        // -> ongoing standard-rate monthly), which fires this same event since
        // the underlying subscription's price changes when the schedule
        // advances phases. term_months naturally clears back to null once the
        // item's interval_count returns to 1 (plain monthly).
        const { priceCents, planInterval, termMonths, commitmentEndsAt } = getBillingFields(sub);

        // REQUIRED: we already confirmed a local record exists for this
        // customer above, so the update must affect it.
        const { data: subUpdated, error: subUpdateErr } = await supabaseAdmin
          .from("contractor_subscriptions")
          .update({
            status: sub.status.toUpperCase(),
            current_period_end: getPeriodEnd(sub),
            price_cents: priceCents,
            plan_interval: planInterval,
            term_months: termMonths,
            commitment_ends_at: commitmentEndsAt,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId)
          .select("contractor_id");

        if (subUpdateErr) {
          throw new Error(`Subscription update failed for customer ${customerId}: ${subUpdateErr.message}`);
        }
        if (!subUpdated || subUpdated.length === 0) {
          throw new Error(`Subscription update matched no row for customer ${customerId} despite existing record`);
        }

        console.log(`Subscription updated for customer ${customerId}`);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as any;
        const customerId = sub.customer;

        // REQUIRED if a local record exists; EXPECTED NO-OP if it doesn't
        // (customer outside ONP's contractor-subscription flow). Idempotent
        // either way — re-setting CANCELED on a retry is a harmless no-op.
        const { data: canceledRows, error: cancelErr } = await supabaseAdmin
          .from("contractor_subscriptions")
          .update({
            status: "CANCELED",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId)
          .select("contractor_id");

        if (cancelErr) {
          throw new Error(`Subscription cancellation failed for customer ${customerId}: ${cancelErr.message}`);
        }
        if (!canceledRows || canceledRows.length === 0) {
          const ownership = await isKnownOnpCustomer(customerId);
          if (ownership === "onp") {
            throw new Error(
              `Subscription deletion: no local contractor_subscriptions row for provably-ONP customer ${customerId} — state drift or checkout.session.completed delivery-order race`
            );
          }
          if (ownership === "unknown") {
            throw new Error(
              `Subscription deletion: could not determine ONP ownership for customer ${customerId} (Stripe lookup failed) — failing closed for retry`
            );
          }
          console.log(`Subscription deletion for customer ${customerId} — no local record, not provably ONP, skipping`);
          break;
        }

        console.log(`Subscription canceled for customer ${customerId}`);
        break;
      }

      case "charge.dispute.created": {
        // Auto-suspend client if an emergency payment is disputed
        const dispute = event.data.object as any;
        const paymentIntentId = dispute.payment_intent;

        if (!paymentIntentId) break;

        const { data: logRow } = await supabaseAdmin
          .from("emergency_request_log")
          .select("id, client_id, project_id")
          .eq("stripe_payment_intent_id", paymentIntentId)
          .maybeSingle();

        if (logRow) {
          const disputeLogId = (logRow as any).id;
          const disputeClientId = (logRow as any).client_id;
          const disputeProjectId = (logRow as any).project_id;

          // REQUIRED: dispute-status record of record. Idempotent — repeated
          // delivery just re-sets DISPUTED, harmless.
          const { data: disputeLogData, error: disputeLogErr } = await supabaseAdmin
            .from("emergency_request_log")
            .update({ payment_status: "DISPUTED" })
            .eq("id", disputeLogId)
            .select("id");

          if (disputeLogErr) {
            throw new Error(`Emergency dispute log update failed (log ${disputeLogId}): ${disputeLogErr.message}`);
          }
          if (!disputeLogData || disputeLogData.length === 0) {
            throw new Error(`Emergency dispute log update matched no row (log ${disputeLogId})`);
          }

          // REQUIRED — fraud/suspension action. A failure here must not be
          // logged as success: this is the account-suspension write that
          // stops further activity from a client who charged back an
          // emergency payment. Idempotent — re-setting suspended=true on a
          // retry is harmless.
          const { data: suspendData, error: suspendErr } = await supabaseAdmin
            .from("profiles")
            .update({ suspended: true, suspended_reason: "emergency_chargeback" })
            .eq("id", disputeClientId)
            .select("id");

          if (suspendErr) {
            throw new Error(`Client suspension failed for chargeback (client ${disputeClientId}, project ${disputeProjectId}): ${suspendErr.message}`);
          }
          if (!suspendData || suspendData.length === 0) {
            throw new Error(`Client suspension matched no profile row (client ${disputeClientId}, project ${disputeProjectId})`);
          }

          console.log(`Client ${disputeClientId} suspended for emergency chargeback on project ${disputeProjectId}`);
          break;
        }

        // Not an emergency payment dispute — check if it's a subscription
        // charge dispute instead (previously did nothing at all in this case).
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        const disputeCustomerId = typeof paymentIntent.customer === "string" ? paymentIntent.customer : paymentIntent.customer?.id;

        let disputeContractorId: string | null = null;
        let disputeBusinessName = "Unknown contractor";

        if (disputeCustomerId) {
          const { data: subRow } = await supabaseAdmin
            .from("contractor_subscriptions")
            .select("contractor_id")
            .eq("stripe_customer_id", disputeCustomerId)
            .maybeSingle();
          disputeContractorId = subRow?.contractor_id ?? null;

          if (disputeContractorId) {
            const { data: profile } = await supabaseAdmin
              .from("contractor_profiles")
              .select("business_name")
              .eq("contractor_id", disputeContractorId)
              .maybeSingle();
            disputeBusinessName = profile?.business_name ?? disputeBusinessName;
          }
        }

        // REQUIRED unless the failure is specifically a unique-constraint
        // violation on stripe_dispute_id (Postgres code 23505), which means
        // Stripe redelivered an event we already recorded — an EXPECTED
        // NO-OP, not a failure. Any other error is a genuine persistence
        // failure and must not be logged as success.
        const { error: disputeInsertErr } = await supabaseAdmin.from("subscription_disputes").insert({
          stripe_dispute_id: dispute.id,
          stripe_payment_intent_id: paymentIntentId,
          stripe_customer_id: disputeCustomerId ?? null,
          contractor_id: disputeContractorId,
          amount_cents: dispute.amount ?? null,
          currency: (dispute.currency ?? "usd").toUpperCase(),
          reason: dispute.reason ?? null,
          stripe_status: dispute.status ?? null,
        });

        if (disputeInsertErr) {
          if (disputeInsertErr.code === "23505") {
            console.log(`Subscription dispute ${dispute.id} already recorded — duplicate delivery, skipping re-notification`);
            break;
          }
          throw new Error(`Subscription dispute insert failed (dispute ${dispute.id}): ${disputeInsertErr.message}`);
        }

        // Admin notification — best-effort, non-fatal: the dispute is
        // already durably recorded above regardless of whether admins get
        // emailed about it.
        try {
          const { data: adminProfiles } = await supabaseAdmin.from("profiles").select("id").eq("role", "ADMIN");
          for (const admin of adminProfiles ?? []) {
            const { data: adminAuth } = await supabaseAdmin.auth.admin.getUserById(admin.id);
            const adminEmail = adminAuth?.user?.email;
            if (adminEmail) {
              sendSubscriptionDisputeAdminEmail({
                adminEmail,
                businessName: disputeBusinessName,
                amountCents: dispute.amount ?? null,
                reason: dispute.reason ?? null,
              }).catch((e) => console.error("Subscription dispute admin email failed:", e));
            }
          }
        } catch (notifyErr) {
          console.error("Subscription dispute admin notification error (non-fatal):", notifyErr);
        }

        console.log(`Subscription dispute logged for payment intent ${paymentIntentId}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        const customerId = invoice.customer;

        // REQUIRED if a local record exists; EXPECTED NO-OP if it doesn't
        // (customer outside ONP's contractor-subscription flow). Idempotent
        // — re-setting PAST_DUE on a retry is harmless.
        const { data: pastDueRows, error: pastDueErr } = await supabaseAdmin
          .from("contractor_subscriptions")
          .update({
            status: "PAST_DUE",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId)
          .select("contractor_id");

        if (pastDueErr) {
          throw new Error(`Payment-failed status update failed for customer ${customerId}: ${pastDueErr.message}`);
        }
        if (!pastDueRows || pastDueRows.length === 0) {
          const ownership = await isKnownOnpCustomer(customerId);
          if (ownership === "onp") {
            throw new Error(
              `Payment-failed status update: no local contractor_subscriptions row for provably-ONP customer ${customerId} — state drift or checkout.session.completed delivery-order race`
            );
          }
          if (ownership === "unknown") {
            throw new Error(
              `Payment-failed status update: could not determine ONP ownership for customer ${customerId} (Stripe lookup failed) — failing closed for retry`
            );
          }
          console.log(`Payment failed for customer ${customerId} — no local subscription record, not provably ONP, skipping`);
          break;
        }

        console.log(`Payment failed for customer ${customerId}`);
        break;
      }

      case "checkout.session.expired": {
        const expired = event.data.object as any;
        const expiredType       = expired.metadata?.payment_type;
        const expiredAssignId   = expired.metadata?.assignment_id;
        const expiredCreditRef  = expired.metadata?.credit_ref;

        // Restore any credits that were applied for this checkout
        if (expiredCreditRef) {
          await restoreCredits(expiredCreditRef).catch((e: unknown) =>
            console.error("Credit restoration failed (non-fatal):", e)
          );
        }

        // Original inspector checkout abandoned → mark FAILED so client can
        // restart. REQUIRED: if this fails, the assignment is stuck PENDING
        // forever with no way for the client to retry. A prior successful
        // FAILED reset, or a race where the matching checkout.session.
        // completed already marked it PAID, are both safe no-ops.
        if (expiredType === "inspector" && expiredAssignId) {
          await applyRequiredConditionalUpdate({
            table: "project_inspector_assignments",
            update: { payment_status: "FAILED" },
            matchColumn: "id",
            matchValue: expiredAssignId,
            conditionColumn: "payment_status",
            conditionValue: "PENDING",
            alreadyDoneValues: ["FAILED", "PAID"],
            context: `Inspector checkout expiry reset (assignment ${expiredAssignId})`,
          });

          console.log(`Inspector assignment ${expiredAssignId} marked FAILED (checkout expired)`);
        }

        // Upgrade checkout abandoned → reset to NONE so client can retry.
        // REQUIRED for the same reason as above.
        if (expiredType === "inspector_upgrade" && expiredAssignId) {
          await applyRequiredConditionalUpdate({
            table: "project_inspector_assignments",
            update: { upgrade_payment_status: "NONE", upgrade_stripe_session_id: null },
            matchColumn: "id",
            matchValue: expiredAssignId,
            conditionColumn: "upgrade_payment_status",
            conditionValue: "PENDING",
            alreadyDoneValues: ["NONE", "PAID"],
            context: `Inspector upgrade checkout expiry reset (assignment ${expiredAssignId})`,
          });

          console.log(`Inspector upgrade ${expiredAssignId} reset to NONE (checkout expired)`);
        }

        // Emergency checkout abandoned — no project state change needed (stays PENDING_PAYMENT)
        if (expiredType === "emergency") {
          console.log(`Emergency checkout expired for project ${expired.metadata?.project_id} — credits restored`);
        }

        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}