"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { CLIENT_UPGRADE_DISPUTE } from "@/lib/disclaimers/clientUpgradeDispute";
import {
  sendDisputeSubmittedClientEmail,
  sendDisputeFiledInspectorEmail,
  sendDisputeAdminEmail,
} from "@/lib/email";

export async function submitDispute(projectId: string, formData: FormData) {
  const { user } = await requireRole(["CLIENT", "ADMIN"]);

  // Parse form fields
  const statement = (formData.get("statement") as string | null)?.trim() ?? "";
  const inspectorExplainedRaw = formData.get("inspector_explained") as string | null;
  const disclaimerAccepted = formData.get("disclaimer_accepted") === "on";

  if (statement.length < 20) {
    throw new Error("Please provide at least 20 characters explaining your dispute.");
  }
  if (statement.length > 1000) {
    throw new Error("Statement must be 1000 characters or fewer.");
  }
  if (!inspectorExplainedRaw) {
    throw new Error("Please answer whether the inspector explained the upgrade reason on-site.");
  }
  if (!disclaimerAccepted) {
    throw new Error("You must read and accept the dispute terms to continue.");
  }

  const inspectorExplained: boolean | null =
    inspectorExplainedRaw === "yes"
      ? true
      : inspectorExplainedRaw === "no"
      ? false
      : null; // "unsure"

  // Verify project ownership
  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("id, title, client_id")
    .eq("id", projectId)
    .single();

  if (!project || (project as any).client_id !== user.id) {
    throw new Error("Project not found.");
  }

  // Fetch paid assignment with upgrade info
  const { data: assignment } = await supabaseAdmin
    .from("project_inspector_assignments")
    .select("id, inspector_id, upgrade_payment_status, upgrade_fee_cents, upgrade_charged_at")
    .eq("project_id", projectId)
    .eq("payment_status", "PAID")
    .eq("upgrade_payment_status", "PAID")
    .maybeSingle();

  if (!assignment) {
    throw new Error("No paid upgrade found for this project.");
  }

  const upgradeChargedAt = (assignment as any).upgrade_charged_at as string | null;
  if (!upgradeChargedAt) {
    throw new Error("Upgrade charge date is missing — contact support.");
  }

  // Enforce 14-day dispute window
  const windowExpiresAt = new Date(
    new Date(upgradeChargedAt).getTime() + 14 * 24 * 60 * 60 * 1000
  );
  if (new Date() > windowExpiresAt) {
    throw new Error(
      "The 14-day dispute window has closed. This upgrade charge is final."
    );
  }

  // Check for an existing active dispute
  const { data: existing } = await supabaseAdmin
    .from("inspector_upgrade_disputes")
    .select("id, status")
    .eq("inspector_request_id", (assignment as any).id)
    .maybeSingle();

  if (existing && (existing as any).status !== "WITHDRAWN") {
    throw new Error("A dispute already exists for this upgrade.");
  }

  const upgradeFeeCents = (assignment as any).upgrade_fee_cents as number ?? 20000;

  // Insert the dispute row
  const { data: dispute, error: disputeErr } = await supabaseAdmin
    .from("inspector_upgrade_disputes")
    .insert({
      inspector_request_id: (assignment as any).id,
      project_id: projectId,
      client_id: user.id,
      original_inspector_id: (assignment as any).inspector_id,
      client_statement: statement,
      inspector_showed_reasons_on_site: inspectorExplained,
      status: "SUBMITTED",
      upgrade_charge_cents: upgradeFeeCents,
      escrow_status: "HELD",
      upgrade_charged_at: upgradeChargedAt,
      dispute_window_expires_at: windowExpiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (disputeErr || !dispute) {
    throw new Error(`Failed to submit dispute: ${JSON.stringify(disputeErr)}`);
  }

  const disputeId = (dispute as any).id as string;

  // Log disclaimer acknowledgment
  await supabaseAdmin.from("disclaimer_acknowledgments").insert({
    user_id: user.id,
    disclaimer_type: CLIENT_UPGRADE_DISPUTE.type,
    disclaimer_version: CLIENT_UPGRADE_DISPUTE.version,
    project_id: projectId,
    acknowledged_at: new Date().toISOString(),
  });

  // Send notifications (fire-and-forget)
  const projTitle = (project as any).title ?? "Your Project";
  const inspectorId = (assignment as any).inspector_id as string | null;

  // Client confirmation
  try {
    const { data: clientAuth } = await supabaseAdmin.auth.admin.getUserById(user.id);
    const clientEmail = clientAuth?.user?.email;
    if (clientEmail) {
      sendDisputeSubmittedClientEmail({
        clientEmail,
        projectTitle: projTitle,
        projectId,
        upgradeFeeCents,
      }).catch((e: unknown) => console.error("Dispute client confirmation email failed:", e));
    }
  } catch (e) {
    console.error("Client dispute email (non-fatal):", e);
  }

  // Inspector notification
  try {
    if (inspectorId) {
      const { data: inspAuth } = await supabaseAdmin.auth.admin.getUserById(inspectorId);
      const inspEmail = inspAuth?.user?.email;
      if (inspEmail) {
        sendDisputeFiledInspectorEmail({
          inspectorEmail: inspEmail,
          projectTitle: projTitle,
          projectId,
          assignmentId: (assignment as any).id,
          disputeId,
        }).catch((e: unknown) => console.error("Dispute inspector notification email failed:", e));
      }
    }
  } catch (e) {
    console.error("Inspector dispute email (non-fatal):", e);
  }

  // Admin notification
  try {
    const { data: adminProfiles } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("role", "ADMIN");
    for (const admin of adminProfiles ?? []) {
      const { data: adminAuth } = await supabaseAdmin.auth.admin.getUserById((admin as any).id);
      const adminEmail = adminAuth?.user?.email;
      if (adminEmail) {
        sendDisputeAdminEmail({
          adminEmail,
          projectTitle: projTitle,
          projectId,
          disputeId,
          upgradeFeeCents,
        }).catch((e: unknown) => console.error("Dispute admin email failed:", e));
      }
    }
  } catch (e) {
    console.error("Admin dispute email (non-fatal):", e);
  }

  redirect(`/dashboard/client/projects/${projectId}/inspector?dispute_submitted=1`);
}
