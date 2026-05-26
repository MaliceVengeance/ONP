"use server";

import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { grantCredit, restoreCredits } from "@/lib/credits";
import { redirect } from "next/navigation";
import { checkInspectorFlagStatus } from "@/lib/checkInspectorFlagStatus";
import {
  sendDisputeResolvedClientEmail,
  sendDisputeResolvedInspectorEmail,
} from "@/lib/email";

const VALID_DECISIONS = [
  "RESOLVED_UPGRADE_JUSTIFIED",
  "RESOLVED_PARTIAL_CREDIT",
  "RESOLVED_REFUND",
] as const;
type Decision = (typeof VALID_DECISIONS)[number];

const MASTER_INSPECTOR_PAYOUT_CENTS = 5000; // $50 per review

export async function submitReview(disputeId: string, formData: FormData) {
  const { user, role } = await requireRole(["INSPECTOR", "ADMIN"]);

  // Check master inspector flag unless ADMIN
  if (role !== "ADMIN") {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_master_inspector")
      .eq("id", user.id)
      .single();
    if (!(profile as any)?.is_master_inspector) {
      throw new Error("Not authorized — Master Inspector access required.");
    }
  }

  const decisionRaw = formData.get("decision") as string | null;
  const reasoning = ((formData.get("reasoning") as string | null) ?? "").trim();
  const creditCentsRaw = formData.get("credit_cents") as string | null;

  if (!decisionRaw || !VALID_DECISIONS.includes(decisionRaw as Decision)) {
    throw new Error("Please select a decision.");
  }
  const decision = decisionRaw as Decision;

  if (reasoning.length < 100) {
    throw new Error("Reasoning must be at least 100 characters.");
  }
  if (reasoning.length > 2000) {
    throw new Error("Reasoning must be 2000 characters or fewer.");
  }

  let creditCents = 0;
  if (decision === "RESOLVED_PARTIAL_CREDIT") {
    creditCents = parseInt(creditCentsRaw ?? "10000", 10);
    if (isNaN(creditCents) || creditCents < 5000 || creditCents > 20000) {
      throw new Error("Credit amount must be between $50 and $200.");
    }
  }

  // Fetch the dispute
  const { data: dispute, error: disputeErr } = await supabaseAdmin
    .from("inspector_upgrade_disputes")
    .select(
      "id, status, master_inspector_id, upgrade_charge_cents, client_id, original_inspector_id, inspector_request_id, project_id"
    )
    .eq("id", disputeId)
    .single();

  if (disputeErr || !dispute) throw new Error("Dispute not found.");
  if (role !== "ADMIN" && (dispute as any).master_inspector_id !== user.id) {
    throw new Error("Not authorized — you are not assigned to this dispute.");
  }
  if (!["SUBMITTED", "UNDER_REVIEW"].includes((dispute as any).status)) {
    throw new Error("This dispute has already been resolved.");
  }

  const upgradeChargeCents = (dispute as any).upgrade_charge_cents as number;
  const clientId           = (dispute as any).client_id as string;
  const originalInspectorId = (dispute as any).original_inspector_id as string;
  const assignmentId       = (dispute as any).inspector_request_id as string;
  const projectId          = (dispute as any).project_id as string;

  const refundCents  = decision === "RESOLVED_REFUND" ? upgradeChargeCents : 0;
  const escrowStatus = decision === "RESOLVED_REFUND" ? "REFUNDED_TO_CLIENT" : "RELEASED_TO_INSPECTOR";
  const now          = new Date().toISOString();

  // Update dispute record
  const { error: updateErr } = await supabaseAdmin
    .from("inspector_upgrade_disputes")
    .update({
      status: decision,
      resolution_decision: decision,
      resolution_reasoning: reasoning,
      refund_cents: refundCents,
      credit_cents: creditCents,
      resolved_at: now,
      escrow_status: escrowStatus,
      updated_at: now,
    })
    .eq("id", disputeId);

  if (updateErr) throw new Error(`Failed to resolve dispute: ${JSON.stringify(updateErr)}`);

  // Insert Master Inspector review log (non-fatal if it fails)
  await supabaseAdmin
    .from("master_inspector_reviews_log")
    .insert({
      dispute_id: disputeId,
      master_inspector_id: user.id,
      decision,
      reasoning,
      payout_cents: MASTER_INSPECTOR_PAYOUT_CENTS,
      payout_status: "PENDING",
    })
    .then(({ error }) => {
      if (error) console.error("Review log insert failed (non-fatal):", error);
    });

  // ── RESOLVED_REFUND ───────────────────────────────────────────────
  if (decision === "RESOLVED_REFUND") {
    // Get the upgrade payment intent if paid via Stripe
    const { data: assignment } = await supabaseAdmin
      .from("project_inspector_assignments")
      .select("upgrade_stripe_payment_intent_id")
      .eq("id", assignmentId)
      .single();

    const paymentIntentId = (assignment as any)?.upgrade_stripe_payment_intent_id as string | null;

    if (paymentIntentId) {
      try {
        const refund = await stripe.refunds.create({ payment_intent: paymentIntentId });
        await supabaseAdmin
          .from("inspector_upgrade_disputes")
          .update({ stripe_refund_id: refund.id })
          .eq("id", disputeId);
        console.log(`Stripe refund ${refund.id} processed for dispute ${disputeId}`);
      } catch (e) {
        console.error("Stripe refund failed (non-fatal — check manually):", e);
      }
    } else {
      // Upgrade was paid with credits — restore them
      await restoreCredits(`upg_${assignmentId}`).catch((e: unknown) =>
        console.error("Credit restore failed (non-fatal):", e)
      );
    }

    // Flag the original inspector
    await supabaseAdmin
      .from("inspector_flags")
      .insert({
        inspector_id: originalInspectorId,
        dispute_id: disputeId,
        flag_reason: "UPGRADE_NOT_JUSTIFIED",
      })
      .then(({ error }) => {
        if (error) console.error("Inspector flag insert failed:", error);
      });

    // Recompute rate-based flag status — may block upgrades and notify admin
    checkInspectorFlagStatus(originalInspectorId).catch((e: unknown) =>
      console.error("checkInspectorFlagStatus failed (non-fatal):", e)
    );
  }

  // ── RESOLVED_PARTIAL_CREDIT ───────────────────────────────────────
  if (decision === "RESOLVED_PARTIAL_CREDIT" && creditCents > 0) {
    await grantCredit({
      clientId,
      amountCents: creditCents,
      source: "DISPUTE_RESOLUTION",
      sourceReferenceId: disputeId,
    }).catch((e: unknown) => console.error("Credit grant failed (non-fatal):", e));
  }

  // ── Notifications (fire-and-forget) ──────────────────────────────
  try {
    const [{ data: project }, { data: clientAuth }, { data: inspectorAuth }] =
      await Promise.all([
        supabaseAdmin.from("projects").select("title").eq("id", projectId).single(),
        supabaseAdmin.auth.admin.getUserById(clientId),
        supabaseAdmin.auth.admin.getUserById(originalInspectorId),
      ]);

    const projTitle     = (project as any)?.title ?? "Your Project";
    const clientEmail   = clientAuth?.user?.email;
    const inspectorEmail = inspectorAuth?.user?.email;

    if (clientEmail) {
      sendDisputeResolvedClientEmail({
        clientEmail,
        projectTitle: projTitle,
        projectId,
        decision,
        reasoning,
        upgradeFeeCents: upgradeChargeCents,
        refundCents,
        creditCents,
      }).catch((e: unknown) => console.error("Dispute resolved client email failed:", e));
    }

    if (inspectorEmail) {
      sendDisputeResolvedInspectorEmail({
        inspectorEmail,
        projectTitle: projTitle,
        assignmentId,
        decision,
        reasoning,
        upgradeFeeCents: upgradeChargeCents,
        flagAdded: decision === "RESOLVED_REFUND",
      }).catch((e: unknown) => console.error("Dispute resolved inspector email failed:", e));
    }
  } catch (e) {
    console.error("Dispute resolution notifications failed (non-fatal):", e);
  }

  redirect("/dashboard/inspector/disputes?resolved=1");
}

/**
 * Admin-only: override a dispute resolution after it has been resolved.
 * Records the override in admin_actions and re-runs financial adjustments.
 */
export async function adminOverrideResolution(disputeId: string, formData: FormData) {
  const { user } = await requireRole(["ADMIN"]);

  const decisionRaw = formData.get("decision") as string | null;
  const reasoning = ((formData.get("reasoning") as string | null) ?? "").trim();

  if (!decisionRaw || !VALID_DECISIONS.includes(decisionRaw as Decision)) {
    throw new Error("Please select a valid override decision.");
  }
  const decision = decisionRaw as Decision;

  if (reasoning.length < 20) {
    throw new Error("Override reasoning must be at least 20 characters.");
  }

  const { data: dispute, error: disputeErr } = await supabaseAdmin
    .from("inspector_upgrade_disputes")
    .select(
      "id, status, upgrade_charge_cents, client_id, original_inspector_id, inspector_request_id, project_id"
    )
    .eq("id", disputeId)
    .single();

  if (disputeErr || !dispute) throw new Error("Dispute not found.");

  const upgradeChargeCents = (dispute as any).upgrade_charge_cents as number;
  const clientId = (dispute as any).client_id as string;
  const originalInspectorId = (dispute as any).original_inspector_id as string;
  const assignmentId = (dispute as any).inspector_request_id as string;

  const refundCents = decision === "RESOLVED_REFUND" ? upgradeChargeCents : 0;
  const escrowStatus = decision === "RESOLVED_REFUND" ? "REFUNDED_TO_CLIENT" : "RELEASED_TO_INSPECTOR";
  const now = new Date().toISOString();

  // Update the dispute with the override decision
  const { error: updateErr } = await supabaseAdmin
    .from("inspector_upgrade_disputes")
    .update({
      status: decision,
      resolution_decision: decision,
      resolution_reasoning: `[ADMIN OVERRIDE] ${reasoning}`,
      refund_cents: refundCents,
      resolved_at: now,
      escrow_status: escrowStatus,
      updated_at: now,
    })
    .eq("id", disputeId);

  if (updateErr) throw new Error(`Override update failed: ${JSON.stringify(updateErr)}`);

  // Log the admin action
  await supabaseAdmin.from("admin_actions").insert({
    action_type: "OVERRIDE_DISPUTE_RESOLUTION",
    target_id: disputeId,
    notes: `Decision: ${decision} — ${reasoning}`,
    performed_at: now,
    performed_by: user.id,
  });

  // Financial adjustments for override
  if (decision === "RESOLVED_REFUND") {
    const { data: assignment } = await supabaseAdmin
      .from("project_inspector_assignments")
      .select("upgrade_stripe_payment_intent_id")
      .eq("id", assignmentId)
      .single();

    const paymentIntentId = (assignment as any)?.upgrade_stripe_payment_intent_id as string | null;
    if (paymentIntentId) {
      try {
        const refund = await stripe.refunds.create({ payment_intent: paymentIntentId });
        await supabaseAdmin
          .from("inspector_upgrade_disputes")
          .update({ stripe_refund_id: refund.id })
          .eq("id", disputeId);
      } catch (e) {
        console.error("Admin override Stripe refund failed (non-fatal):", e);
      }
    } else {
      await restoreCredits(`upg_${assignmentId}`).catch((e: unknown) =>
        console.error("Admin override credit restore failed (non-fatal):", e)
      );
    }

    // Ensure the inspector is flagged
    await supabaseAdmin
      .from("inspector_flags")
      .upsert(
        { inspector_id: originalInspectorId, dispute_id: disputeId, flag_reason: "UPGRADE_NOT_JUSTIFIED" },
        { onConflict: "dispute_id" }
      )
      .then(({ error }) => {
        if (error) console.error("Override flag upsert failed:", error);
      });

    checkInspectorFlagStatus(originalInspectorId).catch((e: unknown) =>
      console.error("Override checkInspectorFlagStatus failed (non-fatal):", e)
    );
  }

  if (decision === "RESOLVED_PARTIAL_CREDIT") {
    const creditCentsRaw = formData.get("credit_cents") as string | null;
    const creditCents = parseInt(creditCentsRaw ?? "10000", 10);
    if (!isNaN(creditCents) && creditCents > 0) {
      await grantCredit({
        clientId,
        amountCents: creditCents,
        source: "DISPUTE_RESOLUTION",
        sourceReferenceId: `${disputeId}_override`,
      }).catch((e: unknown) => console.error("Override credit grant failed (non-fatal):", e));
    }
  }

  redirect(`/dashboard/inspector/disputes/${disputeId}?overridden=1`);
}
