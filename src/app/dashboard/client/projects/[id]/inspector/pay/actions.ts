"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getTotalAvailableCredits, applyCredits } from "@/lib/credits";
import {
  sendInspectorPaymentConfirmedEmail,
  sendAdminInspectorRequestEmail,
  sendInspectorRequestAvailableEmail,
} from "@/lib/email";

const BASE_URL = "https://www.ournextproject.us";

/** Fire-and-forget email notifications after inspector payment (mirrors webhook logic). */
async function dispatchInspectorPaidEmails(
  assignmentId: string,
  projectId: string,
  pricingKey: string,
  feeCents: number,
  shareCents: number,
  clientId: string
) {
  try {
    const { data: proj } = await supabaseAdmin
      .from("projects")
      .select("title, category, city, location_general")
      .eq("id", projectId)
      .single();

    const { data: priceRow } = await supabaseAdmin
      .from("inspector_price_list")
      .select("display_name")
      .eq("pricing_key", pricingKey)
      .maybeSingle();

    const projTitle      = (proj as any)?.title ?? "Project";
    const projCity       = (proj as any)?.city ?? (proj as any)?.location_general ?? "";
    const projCategory   = ((proj as any)?.category ?? "").replaceAll("_", " ");
    const inspectionType = (priceRow as any)?.display_name ?? pricingKey;

    // 1. Client confirmation
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
        projectId,
      }).catch((e: unknown) => console.error("Client inspector confirmation email failed:", e));
    }

    // 2. Admin alerts
    const { data: adminProfiles } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("role", "ADMIN");
    for (const admin of adminProfiles ?? []) {
      const { data: adminAuth } = await supabaseAdmin.auth.admin.getUserById((admin as any).id);
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
          projectId,
          assignmentId,
        }).catch((e: unknown) => console.error("Admin inspector alert email failed:", e));
      }
    }

    // 3. Inspector notifications
    const { data: inspectorProfiles } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("role", "INSPECTOR");
    for (const insp of inspectorProfiles ?? []) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById((insp as any).id);
      const inspEmail = authUser?.user?.email;
      if (inspEmail) {
        sendInspectorRequestAvailableEmail({
          inspectorEmail: inspEmail,
          projectTitle: projTitle,
          projectCity: projCity,
          projectCategory: projCategory,
          inspectionType,
          inspectorShareCents: shareCents,
        }).catch((e: unknown) => console.error("Inspector notification email failed:", e));
      }
    }
  } catch (e) {
    console.error("Inspector paid notifications (non-fatal):", e);
  }
}

export async function createInspectorCheckout(projectId: string, formData: FormData) {
  const { user } = await requireRole(["CLIENT", "ADMIN"]);
  const useCredits = formData?.get("apply_credits") === "1";

  // Verify project ownership
  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("id, title, client_id, category, city, location_general")
    .eq("id", projectId)
    .single();

  if (!project || (project as any).client_id !== user.id) throw new Error("Project not found.");

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

  if (!(assignment as any).pricing_key || !(assignment as any).fee_charged_cents) {
    throw new Error("Inspection pricing information is missing. Please start over.");
  }

  const feeCents  = (assignment as any).fee_charged_cents as number;
  const creditRef = `insp_${(assignment as any).id}`;

  // ── Full-credit path (no Stripe) ─────────────────────────────
  if (useCredits) {
    const available = await getTotalAvailableCredits(user.id);
    if (available >= feeCents) {
      await applyCredits(user.id, feeCents, creditRef);
      await supabaseAdmin
        .from("project_inspector_assignments")
        .update({ payment_status: "PAID" })
        .eq("id", (assignment as any).id);
      // Fire-and-forget email notifications (same as webhook)
      dispatchInspectorPaidEmails(
        (assignment as any).id,
        projectId,
        (assignment as any).pricing_key,
        feeCents,
        (assignment as any).inspector_share_cents ?? 0,
        user.id
      );
      redirect(`/dashboard/client/projects/${projectId}/inspector?paid=1`);
    }
  }

  // Fetch display name for Stripe line item
  const { data: priceRow } = await supabaseAdmin
    .from("inspector_price_list")
    .select("display_name, description")
    .eq("pricing_key", (assignment as any).pricing_key)
    .maybeSingle();

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

  // Apply partial credits if requested (available < feeCents falls through here)
  let chargedCents = feeCents;
  if (useCredits) {
    const creditsApplied = await applyCredits(user.id, feeCents, creditRef);
    chargedCents = feeCents - creditsApplied;
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
            name: (priceRow as any)?.display_name ?? "ONP Bid-Accuracy Inspection",
            description:
              (priceRow as any)?.description ?? "Focused inspection report for bidding contractors.",
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
      assignment_id: (assignment as any).id,
      credit_ref: creditRef,
    },
  });

  if (!session.url) throw new Error("Failed to create checkout session.");
  redirect(session.url);
}
