"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { sendInspectorUpgradeDeclinedEmail } from "@/lib/email";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ournextproject.us";

export async function createUpgradeCheckout(projectId: string) {
  const { user } = await requireRole(["CLIENT", "ADMIN"]);

  // Verify project ownership
  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("id, title, client_id")
    .eq("id", projectId)
    .single();

  if (!project) throw new Error("Project not found.");
  if ((project as any).client_id !== user.id) throw new Error("Not authorized.");

  // Fetch the assignment with a pending upgrade
  const { data: assignment } = await supabaseAdmin
    .from("project_inspector_assignments")
    .select("id, upgrade_fee_cents, upgrade_justification, upgrade_payment_status")
    .eq("project_id", projectId)
    .eq("payment_status", "PAID")
    .eq("upgrade_payment_status", "PENDING")
    .maybeSingle();

  if (!assignment) {
    redirect(`/dashboard/client/projects/${projectId}/inspector`);
  }

  const upgradeFee = (assignment as any).upgrade_fee_cents ?? 20000;

  // Get or create Stripe customer
  const { data: authData } = await supabaseAdmin.auth.admin.getUserById(user.id);
  const email = authData?.user?.email;

  let customerId: string | undefined;
  if (email) {
    const existing = await stripe.customers.list({ email, limit: 1 });
    customerId = existing.data.length > 0
      ? existing.data[0].id
      : (await stripe.customers.create({ email })).id;
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "usd",
        unit_amount: upgradeFee,
        product_data: {
          name: "Inspection Upgrade: Standard → Comprehensive",
          description: "On-site upgrade requested by your inspector. Covers extended scope across all relevant systems.",
        },
      },
      quantity: 1,
    }],
    mode: "payment",
    success_url: `${BASE_URL}/dashboard/client/projects/${projectId}/inspector?upgrade_paid=1`,
    cancel_url: `${BASE_URL}/dashboard/client/projects/${projectId}/inspector/upgrade-pay?canceled=1`,
    metadata: {
      payment_type: "inspector_upgrade",
      project_id: projectId,
      client_id: user.id,
      assignment_id: (assignment as any).id,
    },
  });

  // Store session ID on assignment so we can handle expiry
  await supabaseAdmin
    .from("project_inspector_assignments")
    .update({ upgrade_stripe_session_id: session.id })
    .eq("id", (assignment as any).id);

  redirect(session.url!);
}

export async function declineUpgrade(projectId: string) {
  const { user } = await requireRole(["CLIENT", "ADMIN"]);

  // Verify project ownership
  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("id, title, client_id")
    .eq("id", projectId)
    .single();

  if (!project) throw new Error("Project not found.");
  if ((project as any).client_id !== user.id) throw new Error("Not authorized.");

  // Find the pending upgrade
  const { data: assignment } = await supabaseAdmin
    .from("project_inspector_assignments")
    .select("id, inspector_id")
    .eq("project_id", projectId)
    .eq("payment_status", "PAID")
    .eq("upgrade_payment_status", "PENDING")
    .maybeSingle();

  if (!assignment) {
    redirect(`/dashboard/client/projects/${projectId}/inspector`);
  }

  // Mark upgrade as DECLINED
  await supabaseAdmin
    .from("project_inspector_assignments")
    .update({ upgrade_payment_status: "DECLINED" })
    .eq("id", (assignment as any).id);

  // Notify inspector
  try {
    const inspectorId = (assignment as any).inspector_id;
    if (inspectorId) {
      const { data: inspAuth } = await supabaseAdmin.auth.admin.getUserById(inspectorId);
      const inspEmail = inspAuth?.user?.email;
      if (inspEmail) {
        sendInspectorUpgradeDeclinedEmail({
          inspectorEmail: inspEmail,
          projectTitle: (project as any).title ?? "Your Project",
          projectId,
          assignmentId: (assignment as any).id,
        }).catch((e: unknown) => console.error("Upgrade declined email failed:", e));
      }
    }
  } catch (e) {
    console.error("Decline notification (non-fatal):", e);
  }

  redirect(`/dashboard/client/projects/${projectId}/inspector`);
}
