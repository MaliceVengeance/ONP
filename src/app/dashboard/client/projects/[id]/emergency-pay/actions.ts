"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { stripe, PRICES, EMERGENCY_FEE_CENTS } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

const BASE_URL = "https://www.ournextproject.us";

export async function createEmergencyCheckout(projectId: string) {
  const { supabase, user } = await requireRole(["CLIENT", "ADMIN"]);

  // Verify ownership and state
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, title, state, is_emergency, client_id")
    .eq("id", projectId)
    .single();

  if (error || !project) throw new Error("Project not found.");
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

  // Get or create Stripe customer
  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user.id);
  const email = authUser?.user?.email;

  let customerId: string | undefined;
  const { data: existingSub } = await supabase
    .from("contractor_subscriptions")
    .select("stripe_customer_id")
    .eq("contractor_id", user.id)
    .maybeSingle();

  if (existingSub?.stripe_customer_id) {
    customerId = existingSub.stripe_customer_id;
  } else {
    // Check if there's a Stripe customer for this client already (clients don't have subscriptions)
    const customers = await stripe.customers.list({ email: email ?? undefined, limit: 1 });
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: email ?? undefined,
        metadata: { user_id: user.id, role: "CLIENT" },
      });
      customerId = customer.id;
    }
  }

  // Create one-time checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price: PRICES.emergency,
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
      log_id: logRow.id,
    },
  });

  if (!session.url) throw new Error("Failed to create checkout session.");

  redirect(session.url);
}

export async function downgradeToStandard(projectId: string) {
  const { supabase, user } = await requireRole(["CLIENT", "ADMIN"]);

  // Verify ownership and state
  const { data: project } = await supabase
    .from("projects")
    .select("id, state, is_emergency, client_id")
    .eq("id", projectId)
    .single();

  if (!project) throw new Error("Project not found.");
  if ((project as any).client_id !== user.id) throw new Error("Not your project.");
  if ((project as any).state !== "PENDING_PAYMENT") throw new Error("Can only downgrade PENDING_PAYMENT projects.");

  // Update the emergency_request_log row to DOWNGRADED (doesn't count against limit)
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
