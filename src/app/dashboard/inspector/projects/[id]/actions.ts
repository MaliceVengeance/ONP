"use server";

import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import {
  sendInspectorUpgradeRequestedEmail,
} from "@/lib/email";


function clean(v: FormDataEntryValue | null) {
  return String(v ?? "").trim();
}

export async function requestUpgrade(assignmentId: string, formData: FormData) {
  const { user } = await requireRole(["INSPECTOR", "ADMIN"]);

  const justification = (formData.get("justification") as string | null)?.trim() ?? "";
  if (justification.length < 20) {
    throw new Error("Please provide a detailed justification (at least 20 characters).");
  }

  // Verify assignment — must be ASSIGNED, STANDARD, no upgrade yet
  const { data: assignment, error } = await supabaseAdmin
    .from("project_inspector_assignments")
    .select("id, project_id, inspector_id, pricing_key, upgrade_payment_status, client_id")
    .eq("id", assignmentId)
    .single();

  if (error || !assignment) throw new Error("Assignment not found.");
  if (assignment.inspector_id !== user.id) throw new Error("Not authorized.");
  if (assignment.pricing_key !== "STANDARD") {
    throw new Error("Upgrades are only available for Standard inspections.");
  }

  // Check if this inspector has been blocked from requesting upgrades
  const { data: inspProfile } = await supabaseAdmin
    .from("profiles")
    .select("upgrade_blocked")
    .eq("id", user.id)
    .single();
  if ((inspProfile as any)?.upgrade_blocked) {
    throw new Error(
      "Your account is currently under compliance review and upgrade requests have been paused. " +
      "Please contact support@ournextproject.us."
    );
  }
  const currentUpgradeStatus = (assignment as any).upgrade_payment_status ?? "NONE";
  if (currentUpgradeStatus !== "NONE") {
    throw new Error("An upgrade request has already been submitted for this assignment.");
  }

  const UPGRADE_FEE_CENTS = 20000; // $200

  const { error: updateErr } = await supabaseAdmin
    .from("project_inspector_assignments")
    .update({
      upgrade_payment_status: "PENDING",
      upgrade_justification: justification,
      upgrade_requested_at: new Date().toISOString(),
      upgrade_fee_cents: UPGRADE_FEE_CENTS,
    })
    .eq("id", assignmentId);

  if (updateErr) throw new Error(`requestUpgrade update failed: ${JSON.stringify(updateErr)}`);

  // Notify client by email
  try {
    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("title")
      .eq("id", assignment.project_id)
      .single();

    const { data: clientAuth } = await supabaseAdmin.auth.admin.getUserById(assignment.client_id);
    const clientEmail = clientAuth?.user?.email;

    if (clientEmail) {
      sendInspectorUpgradeRequestedEmail({
        clientEmail,
        projectTitle: (project as any)?.title ?? "Your Project",
        projectId: assignment.project_id,
        justification,
        upgradeFeeCents: UPGRADE_FEE_CENTS,
      }).catch((e: unknown) => console.error("Upgrade request email failed:", e));
    }
  } catch (e) {
    console.error("Upgrade notification error (non-fatal):", e);
  }

  revalidatePath(`/dashboard/inspector/projects/${assignmentId}`);
}

export async function submitDisputeResponse(assignmentId: string, formData: FormData) {
  const { user } = await requireRole(["INSPECTOR", "ADMIN"]);

  const statement = (formData.get("statement") as string | null)?.trim() ?? "";
  if (statement.length < 20) {
    throw new Error("Please provide at least 20 characters in your statement.");
  }
  if (statement.length > 2000) {
    throw new Error("Statement must be 2000 characters or fewer.");
  }

  // Verify assignment ownership
  const { data: assignment, error } = await supabaseAdmin
    .from("project_inspector_assignments")
    .select("id, inspector_id")
    .eq("id", assignmentId)
    .single();

  if (error || !assignment) throw new Error("Assignment not found.");
  if (assignment.inspector_id !== user.id) throw new Error("Not authorized.");

  // Find the open dispute for this assignment
  const { data: dispute } = await supabaseAdmin
    .from("inspector_upgrade_disputes")
    .select("id, status, original_inspector_statement")
    .eq("inspector_request_id", assignmentId)
    .in("status", ["SUBMITTED", "UNDER_REVIEW"])
    .maybeSingle();

  if (!dispute) throw new Error("No open dispute found for this assignment.");
  if ((dispute as any).original_inspector_statement) {
    throw new Error("You have already submitted a response to this dispute.");
  }

  const { error: updateErr } = await supabaseAdmin
    .from("inspector_upgrade_disputes")
    .update({
      original_inspector_statement: statement,
      original_inspector_responded_at: new Date().toISOString(),
    })
    .eq("id", (dispute as any).id);

  if (updateErr) {
    throw new Error(`submitDisputeResponse failed: ${JSON.stringify(updateErr)}`);
  }

  revalidatePath(`/dashboard/inspector/projects/${assignmentId}`);
}

export async function submitTakeoffReport(assignmentId: string, formData: FormData) {
  const { supabase, user } = await requireRole(["INSPECTOR", "ADMIN"]);

  const takeoff_report = clean(formData.get("takeoff_report"));

  if (!takeoff_report) {
    throw new Error("Takeoff report cannot be empty.");
  }

  const { error } = await supabase
    .from("project_inspector_assignments")
    .update({
      takeoff_report,
      takeoff_completed_at: new Date().toISOString(),
      request_status: "COMPLETED",
    })
    .eq("id", assignmentId)
    .eq("inspector_id", user.id);

  if (error) throw new Error(`submitTakeoffReport failed: ${JSON.stringify(error)}`);

  // Extend the project deadline by however long the inspection hold lasted
  try {
    const { data: asgn } = await supabaseAdmin
      .from("project_inspector_assignments")
      .select("project_id")
      .eq("id", assignmentId)
      .single();

    if (asgn?.project_id) {
      const { data: proj } = await supabaseAdmin
        .from("projects")
        .select("inspector_hold_started_at, deadline_at")
        .eq("id", asgn.project_id)
        .single();

      if ((proj as any)?.inspector_hold_started_at && (proj as any)?.deadline_at) {
        const holdMs = Date.now() - new Date((proj as any).inspector_hold_started_at).getTime();
        const extendedDeadline = new Date(
          new Date((proj as any).deadline_at).getTime() + holdMs
        );
        await supabaseAdmin
          .from("projects")
          .update({
            deadline_at: extendedDeadline.toISOString(),
            inspector_hold_started_at: null,
          })
          .eq("id", asgn.project_id);
      }
    }
  } catch (e) {
    console.error("Deadline extension after takeoff failed (non-fatal):", e);
  }

  revalidatePath(`/dashboard/inspector/projects/${assignmentId}`);
}