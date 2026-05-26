import { NextRequest, NextResponse } from "next/server";
import { stripe, EMERGENCY_FEE_CENTS } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  sendEmergencyProjectEmail,
  sendInspectorRequestAvailableEmail,
  sendInspectorPaymentConfirmedEmail,
  sendAdminInspectorRequestEmail,
  sendInspectorUpgradeChargedEmail,
  sendInspectorUpgradeConfirmedEmail,
} from "@/lib/email";

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

          // Activate the project
          const { error: projErr } = await supabaseAdmin
            .from("projects")
            .update({
              state: "OPEN",
              published_at: now.toISOString(),
              deadline_at: autoCloseAt.toISOString(),
              emergency_paid_at: now.toISOString(),
              emergency_payment_id: paymentIntentId ?? null,
              emergency_auto_close_at: autoCloseAt.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq("id", projectId)
            .eq("state", "PENDING_PAYMENT");

          if (projErr) {
            console.error("Emergency project activation failed:", projErr);
            break;
          }

          // Update log row to PAID
          await supabaseAdmin
            .from("emergency_request_log")
            .update({
              payment_status: "PAID",
              stripe_payment_intent_id: paymentIntentId ?? null,
            })
            .eq("id", logId);

          // Notify eligible contractors
          try {
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

          // Mark assignment as PAID
          const { error: updateErr } = await supabaseAdmin
            .from("project_inspector_assignments")
            .update({
              payment_status: "PAID",
              stripe_payment_intent_id: paymentIntentId ?? null,
            })
            .eq("id", assignmentId)
            .eq("payment_status", "PENDING");

          if (updateErr) {
            console.error("Inspector assignment update failed:", updateErr);
            break;
          }

          // Fetch assignment + project details for notifications
          try {
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

          // Mark upgrade PAID and update assignment to Comprehensive pricing
          const { error: upgradeErr } = await supabaseAdmin
            .from("project_inspector_assignments")
            .update({
              upgrade_payment_status: "PAID",
              upgrade_charged_at: now,
              pricing_key: "COMPREHENSIVE",
              fee_charged_cents: totalFeeCents,
              inspector_share_cents: inspShareCents,
              onp_share_cents: onpShareCents,
            })
            .eq("id", assignmentId)
            .eq("upgrade_payment_status", "PENDING");

          if (upgradeErr) {
            console.error("Inspector upgrade update failed:", upgradeErr);
            break;
          }

          // Send notifications
          try {
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
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        if (!contractorId || !subscriptionId) {
          console.log("Missing contractorId or subscriptionId — skipping");
          break;
        }

        const sub = await stripe.subscriptions.retrieve(subscriptionId) as any;
        console.log("SUB OBJECT:", JSON.stringify(sub, null, 2));

        const item = sub.items?.data?.[0];
        const intervalRaw = item?.price?.recurring?.interval ?? "month";
        const intervalMap: Record<string, string> = {
          month: "MONTHLY",
          quarter: "QUARTERLY",
          year: "YEARLY",
        };
        const planInterval = intervalMap[intervalRaw] ?? "MONTHLY";
        const priceCents = item?.price?.unit_amount ?? 0;
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
              updated_at: new Date().toISOString(),
            },
            { onConflict: "contractor_id" }
          );

        if (upsertError) {
          console.error("Supabase upsert error:", JSON.stringify(upsertError));
          throw new Error(`Supabase upsert failed: ${upsertError.message}`);
        }

        console.log(`Subscription activated for contractor ${contractorId}`);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as any;
        const customerId = sub.customer;

        const { data: existing } = await supabaseAdmin
          .from("contractor_subscriptions")
          .select("contractor_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (!existing?.contractor_id) break;

        await supabaseAdmin
          .from("contractor_subscriptions")
          .update({
            status: sub.status.toUpperCase(),
            current_period_end: getPeriodEnd(sub),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        console.log(`Subscription updated for customer ${customerId}`);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as any;
        const customerId = sub.customer;

        await supabaseAdmin
          .from("contractor_subscriptions")
          .update({
            status: "CANCELED",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

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

        if (!logRow) break; // Not an emergency payment dispute

        // Mark as DISPUTED in log
        await supabaseAdmin
          .from("emergency_request_log")
          .update({ payment_status: "DISPUTED" })
          .eq("id", (logRow as any).id);

        // Auto-suspend the client account
        await supabaseAdmin
          .from("profiles")
          .update({ suspended: true, suspended_reason: "emergency_chargeback" })
          .eq("id", (logRow as any).client_id);

        console.log(`Client ${(logRow as any).client_id} suspended for emergency chargeback on project ${(logRow as any).project_id}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        const customerId = invoice.customer;

        await supabaseAdmin
          .from("contractor_subscriptions")
          .update({
            status: "PAST_DUE",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        console.log(`Payment failed for customer ${customerId}`);
        break;
      }

      case "checkout.session.expired": {
        const expired = event.data.object as any;
        const expiredAssignmentId = expired.metadata?.assignment_id;
        if (!expiredAssignmentId) break;

        // Original inspector checkout abandoned → mark FAILED so client can restart
        if (expired.metadata?.payment_type === "inspector") {
          await supabaseAdmin
            .from("project_inspector_assignments")
            .update({ payment_status: "FAILED" })
            .eq("id", expiredAssignmentId)
            .eq("payment_status", "PENDING");

          console.log(`Inspector assignment ${expiredAssignmentId} marked FAILED (checkout expired)`);
        }

        // Upgrade checkout abandoned → reset to NONE so client can retry
        if (expired.metadata?.payment_type === "inspector_upgrade") {
          await supabaseAdmin
            .from("project_inspector_assignments")
            .update({ upgrade_payment_status: "NONE", upgrade_stripe_session_id: null })
            .eq("id", expiredAssignmentId)
            .eq("upgrade_payment_status", "PENDING");

          console.log(`Inspector upgrade ${expiredAssignmentId} reset to NONE (checkout expired)`);
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