"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

const BASE_URL = "https://www.ournextproject.us";

export async function createInspectorCheckout(projectId: string) {
  const { supabase, user } = await requireRole(["CLIENT", "ADMIN"]);

  // Verify project ownership
  const { data: project, error: projErr } = await supabase
    .from("projects")
    .select("id, title, client_id, category, city, location_general")
    .eq("id", projectId)
    .single();

  if (projErr || !project) throw new Error("Project not found.");
  if ((project as any).client_id !== user.id) throw new Error("Not your project.");

  // Fetch the pending assignment
  const { data: assignment } = await supabaseAdmin
    .from("project_inspector_assignments")
    .select("id, pricing_key, fee_charged_cents, inspector_share_cents, payment_status")
    .eq("project_id", projectId)
    .eq("client_id", user.id)
    .eq("payment_status", "PENDING")
    .maybeSingle();

  if (!assignment) {
    redirect(`/dashboard/client/projects/${projectId}/inspector`);
  }

  if (!assignment.pricing_key || !assignment.fee_charged_cents) {
    throw new Error("Inspection pricing information is missing. Please start over.");
  }

  // Fetch display name and description for the line item
  const { data: priceRow } = await supabaseAdmin
    .from("inspector_price_list")
    .select("display_name, description")
    .eq("pricing_key", assignment.pricing_key)
    .maybeSingle();

  // Get or create Stripe customer
  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user.id);
  const email = authUser?.user?.email;

  let customerId: string | undefined;

  // Clients don't have contractor_subscriptions — check Stripe directly
  const customers = await stripe.customers.list({
    email: email ?? undefined,
    limit: 1,
  });

  if (customers.data.length > 0) {
    customerId = customers.data[0].id;
  } else {
    const customer = await stripe.customers.create({
      email: email ?? undefined,
      metadata: { user_id: user.id, role: "CLIENT" },
    });
    customerId = customer.id;
  }

  // Create one-time checkout session with dynamic pricing
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: assignment.fee_charged_cents,
          product_data: {
            name: priceRow?.display_name ?? "ONP Bid-Accuracy Inspection",
            description:
              priceRow?.description ??
              "Focused inspection report for bidding contractors.",
          },
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${BASE_URL}/dashboard/client/projects/${projectId}/inspector?paid=1`,
    cancel_url: `${BASE_URL}/dashboard/client/projects/${projectId}/inspector/pay?canceled=1`,
    metadata: {
      payment_type: "inspector",
      project_id: projectId,
      client_id: user.id,
      assignment_id: assignment.id,
    },
  });

  if (!session.url) throw new Error("Failed to create checkout session.");

  redirect(session.url);
}
