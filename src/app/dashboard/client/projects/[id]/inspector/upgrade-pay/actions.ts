"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { getTotalAvailableCredits, applyCredits } from "@/lib/credits";
import {
  sendInspectorUpgradeChargedEmail,
  sendInspectorUpgradeConfirmedEmail,
  sendInspectorUpgradeDeclinedEmail,
} from "@/lib/email";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ournextproject.us";

export async function createUpgradeCheckout(projectId: string, formData: FormData) {
  const { user } = await requireRole(["CLIENT", "ADMIN"]);
  const useCredits = formData?.get("apply_credits") === "1";

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
    .select("id, upgrade_fee_cents, upgrade_justification, upgrade_payment_status, inspector_id")
    .eq("project_id", projectId)
    .eq("payment_status", "PAID")
    .eq("upgrade_payment_status", "PENDING")
    .maybeSingle();

  if (!assignment) {
    redirect(`/dashboard/client/projects/${projectId}/inspector`);
  }

  const upgradeFee  = (assignment as any).upgrade_fee_cents as number ?? 20000;
  const creditRef   = `upg_${(assignment as any).id}`;

  // ── Full-credit path (no Stripe) ─────────────────────────────
  if (useCredits) {
    const available = await getTotalAvailableCredits(user.id);
    if (available >= upgradeFee) {
      await applyCredits(user.id, upgradeFee, creditRef);

      // Fetch Comprehensive tier pricing
      const { data: comprehensiveTier } = await supabaseAdmin
        .from("inspector_price_list")
        .select("fee_cents, inspector_share_percent")
        .eq("pricing_key", "COMPREHENSIVE")
        .maybeSingle();

      const totalFeeCents  = (comprehensiveTier as any)?.fee_cents ?? 39900;
      const sharePercent   = (comprehensiveTier as any)?.inspector_share_percent ?? 65;
      const inspShareCents = Math.round((totalFeeCents * sharePercent) / 100);
      const onpShareCents  = totalFeeCents - inspShareCents;
      const now            = new Date().toISOString();

      await supabaseAdmin
        .from("project_inspector_assignments")
        .update({
          upgrade_payment_status: "PAID",
          upgrade_charged_at: now,
          pricing_key: "COMPREHENSIVE",
          fee_charged_cents: totalFeeCents,
          inspector_share_cents: inspShareCents,
          onp_share_cents: onpShareCents,
        })
        .eq("id", (assignment as any).id);

      const projTitle = (project as any).title ?? "Your Project";

      // Notify client
      try {
        const { data: clientAuth } = await supabaseAdmin.auth.admin.getUserById(user.id);
        const clientEmail = clientAuth?.user?.email;
        if (clientEmail) {
          sendInspectorUpgradeChargedEmail({
            clientEmail,
            projectTitle: projTitle,
            projectId,
            upgradeFeeCents: upgradeFee,
          }).catch((e: unknown) => console.error("Upgrade charged email failed:", e));
        }
      } catch (e) {
        console.error("Upgrade notification (non-fatal):", e);
      }

      // Notify inspector
      try {
        const inspectorId = (assignment as any).inspector_id;
        if (inspectorId) {
          const { data: inspAuth } = await supabaseAdmin.auth.admin.getUserById(inspectorId);
          const inspEmail = inspAuth?.user?.email;
          if (inspEmail) {
            sendInspectorUpgradeConfirmedEmail({
              inspectorEmail: inspEmail,
              projectTitle: projTitle,
              projectId,
              assignmentId: (assignment as any).id,
            }).catch((e: unknown) => console.error("Upgrade confirmed email failed:", e));
          }
        }
      } catch (e) {
        console.error("Inspector upgrade confirmation (non-fatal):", e);
      }

      redirect(`/dashboard/client/projects/${projectId}/inspector?upgrade_paid=1`);
    }
  }

  // Get or create Stripe customer
  const { data: authData } = await supabaseAdmin.auth.admin.getUserById(user.id);
  const email = authData?.user?.email;
  let customerId: string | undefined;
  if (email) {
    const existing = await stripe.customers.list({ email, limit: 1 });
    customerId =
      existing.data.length > 0
        ? existing.data[0].id
        : (await stripe.customers.create({ email })).id;
  }

  // Apply partial credits if requested
  let chargedCents = upgradeFee;
  if (useCredits) {
    const creditsApplied = await applyCredits(user.id, upgradeFee, creditRef);
    chargedCents = upgradeFee - creditsApplied;
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: chargedCents,
          product_data: {
            name: "Inspection Upgrade: Standard → Comprehensive",
            description:
              "On-site upgrade requested by your inspector. Covers extended scope across all relevant systems.",
          },
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${BASE_URL}/dashboard/client/projects/${projectId}/inspector?upgrade_paid=1`,
    cancel_url: `${BASE_URL}/dashboard/client/projects/${projectId}/inspector/upgrade-pay?canceled=1`,
    metadata: {
      payment_type: "inspector_upgrade",
      project_id: projectId,
      client_id: user.id,
      assignment_id: (assignment as any).id,
      credit_ref: creditRef,
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
