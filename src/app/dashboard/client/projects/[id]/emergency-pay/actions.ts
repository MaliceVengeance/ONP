"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { stripe, EMERGENCY_FEE_CENTS } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getTotalAvailableCredits, applyCredits } from "@/lib/credits";
import { sendEmergencyProjectEmail } from "@/lib/email";

const BASE_URL = "https://www.ournextproject.us";

/** Notify eligible contractors about an emergency project (mirrors webhook logic). */
async function dispatchEmergencyNotifications(
  projectId: string,
  autoCloseAt: Date
) {
  try {
    const { data: projectData } = await supabaseAdmin
      .from("projects")
      .select("title, category, city, location_general")
      .eq("id", projectId)
      .single();

    if (!projectData) return;

    const { data: contractorProfiles } = await supabaseAdmin
      .from("contractor_profiles")
      .select("contractor_id, categories")
      .contains("categories", [(projectData as any).category]);

    const contractorIds = (contractorProfiles ?? []).map((p: any) => p.contractor_id);
    if (contractorIds.length === 0) return;

    const { data: settings } = await supabaseAdmin
      .from("contractor_settings")
      .select("contractor_id, emergency_notifications_enabled")
      .in("contractor_id", contractorIds);

    const settingsMap = new Map(
      (settings ?? []).map((s: any) => [s.contractor_id, s.emergency_notifications_enabled])
    );
    const notifyIds = contractorIds.filter(
      (id: string) => settingsMap.get(id) !== false
    );

    for (const cId of notifyIds) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(cId);
      const email = authUser?.user?.email;
      if (email) {
        sendEmergencyProjectEmail({
          contractorEmail: email,
          projectTitle: (projectData as any).title ?? "Emergency Project",
          projectCategory: ((projectData as any).category ?? "").replaceAll("_", " "),
          projectCity:
            (projectData as any).city ?? (projectData as any).location_general ?? "",
          projectId,
          autoCloseAt: autoCloseAt.toISOString(),
        }).catch((e: unknown) => console.error("Emergency email failed:", e));
      }
    }
  } catch (e) {
    console.error("Emergency contractor notifications (non-fatal):", e);
  }
}

export async function createEmergencyCheckout(projectId: string, formData: FormData) {
  const { user } = await requireRole(["CLIENT", "ADMIN"]);
  const useCredits = formData?.get("apply_credits") === "1";

  // Verify ownership and state
  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("id, title, state, is_emergency, client_id")
    .eq("id", projectId)
    .single();

  if (!project) throw new Error("Project not found.");
  if ((project as any).client_id !== user.id) throw new Error("Not your project.");
  if ((project as any).state !== "PENDING_PAYMENT") throw new Error("Project is not awaiting payment.");
  if (!(project as any).is_emergency) throw new Error("Not an emergency project.");

  // Find the pending log row for this project
  const { data: logRow } = await supabaseAdmin
    .from("emergency_request_log")
    .select("id")
    .eq("project_id", projectId)
    .eq("payment_status", "PENDING")
    .maybeSingle();

  if (!logRow) throw new Error("Emergency request log entry not found.");

  const creditRef = `emg_${(logRow as any).id}`;

  // ── Full-credit path (no Stripe) ─────────────────────────────
  if (useCredits) {
    const available = await getTotalAvailableCredits(user.id);
    if (available >= EMERGENCY_FEE_CENTS) {
      await applyCredits(user.id, EMERGENCY_FEE_CENTS, creditRef);

      const now         = new Date();
      const autoCloseAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      // Activate the project
      await supabaseAdmin
        .from("projects")
        .update({
          state: "OPEN",
          published_at: now.toISOString(),
          deadline_at: autoCloseAt.toISOString(),
          emergency_paid_at: now.toISOString(),
          emergency_payment_id: null,
          emergency_auto_close_at: autoCloseAt.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", projectId)
        .eq("state", "PENDING_PAYMENT");

      // Update log to PAID
      await supabaseAdmin
        .from("emergency_request_log")
        .update({ payment_status: "PAID", stripe_payment_intent_id: null })
        .eq("id", (logRow as any).id);

      // Notify contractors (fire-and-forget)
      dispatchEmergencyNotifications(projectId, autoCloseAt);

      redirect(`/dashboard/client/projects/${projectId}?emergency_paid=1`);
    }
  }

  // Get or create Stripe customer
  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user.id);
  const email = authUser?.user?.email;
  let customerId: string | undefined;
  const customers = await stripe.customers.list({ email: email ?? undefined, limit: 1 });
  customerId =
    customers.data.length > 0
      ? customers.data[0].id
      : (
          await stripe.customers.create({
            email: email ?? undefined,
            metadata: { user_id: user.id, role: "CLIENT" },
          })
        ).id;

  // Apply partial credits if requested
  let chargedCents = EMERGENCY_FEE_CENTS;
  if (useCredits) {
    const creditsApplied = await applyCredits(user.id, EMERGENCY_FEE_CENTS, creditRef);
    chargedCents = EMERGENCY_FEE_CENTS - creditsApplied;
  }

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: chargedCents,
          product_data: {
            name: "Emergency Bid Request",
            description: "48-hour emergency bidding window. Bids visible immediately as submitted.",
          },
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${BASE_URL}/dashboard/client/projects/${projectId}?emergency_paid=1`,
    cancel_url: `${BASE_URL}/dashboard/client/projects/${projectId}/emergency-pay?canceled=1`,
    metadata: {
      payment_type: "emergency",
      project_id: projectId,
      client_id: user.id,
      log_id: (logRow as any).id,
      credit_ref: creditRef,
    },
  });

  if (!session.url) throw new Error("Failed to create checkout session.");
  redirect(session.url);
}

export async function downgradeToStandard(projectId: string) {
  const { user } = await requireRole(["CLIENT", "ADMIN"]);

  // Verify ownership and state
  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("id, state, is_emergency, client_id")
    .eq("id", projectId)
    .single();

  if (!project) throw new Error("Project not found.");
  if ((project as any).client_id !== user.id) throw new Error("Not your project.");
  if ((project as any).state !== "PENDING_PAYMENT")
    throw new Error("Can only downgrade PENDING_PAYMENT projects.");

  // Update the emergency_request_log row to FAILED/DOWNGRADED
  await supabaseAdmin
    .from("emergency_request_log")
    .update({
      payment_status: "FAILED",
      counts_against_limit: false,
      closed_at: new Date().toISOString(),
      close_reason: "DOWNGRADED",
    })
    .eq("project_id", projectId)
    .eq("payment_status", "PENDING");

  // Convert project back to standard DRAFT
  const { error } = await supabaseAdmin
    .from("projects")
    .update({
      state: "DRAFT",
      is_emergency: false,
      emergency_paid_at: null,
      emergency_payment_id: null,
      emergency_auto_close_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  if (error) throw new Error(`Downgrade failed: ${JSON.stringify(error)}`);

  redirect(`/dashboard/client/projects/${projectId}`);
}
