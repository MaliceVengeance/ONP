import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  sendDisputeAssignedMasterInspectorEmail,
  sendNoMasterInspectorAvailableAdminEmail,
} from "@/lib/email";

/**
 * Automatically assigns the most suitable available Master Inspector to a dispute.
 *
 * Selection logic (in order):
 * 1. All inspectors with is_master_inspector = true
 * 2. Exclude the original inspector on the dispute
 * 3. Exclude any MI who has previously inspected the same project
 * 4. Prefer MI with fewest open reviews (load balancing)
 *
 * If no suitable MI is found, admins are notified for manual assignment
 * and the dispute stays at SUBMITTED status.
 */
export async function assignMasterInspector({
  disputeId,
  projectId,
  originalInspectorId,
}: {
  disputeId: string;
  projectId: string;
  originalInspectorId: string;
}): Promise<{ assigned: boolean; masterInspectorId?: string }> {
  // 1. Get all master inspectors
  const { data: allMIs } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("is_master_inspector", true);

  if (!allMIs || allMIs.length === 0) {
    await notifyAdminsNoMI(disputeId, projectId);
    return { assigned: false };
  }

  // 2. Exclude the original inspector
  let candidates = (allMIs as any[]).filter((p) => p.id !== originalInspectorId);

  if (candidates.length === 0) {
    await notifyAdminsNoMI(disputeId, projectId);
    return { assigned: false };
  }

  // 3. Exclude MIs who have previously inspected this same project
  //    (only when we have more than one candidate — preserve at least one)
  if (candidates.length > 1) {
    const { data: priorAssignments } = await supabaseAdmin
      .from("project_inspector_assignments")
      .select("inspector_id")
      .eq("project_id", projectId);

    const priorIds = new Set(
      (priorAssignments ?? []).map((a: any) => a.inspector_id as string)
    );
    const filtered = candidates.filter((p) => !priorIds.has(p.id));
    if (filtered.length > 0) candidates = filtered;
    // If filtering would leave zero candidates, we keep all (rare edge case —
    // better to assign someone who inspected than leave it unassigned).
  }

  // 4. Load-balance: pick candidate with fewest currently open dispute reviews
  const candidateIds = candidates.map((p) => p.id) as string[];

  const { data: pendingRows } = await supabaseAdmin
    .from("inspector_upgrade_disputes")
    .select("master_inspector_id")
    .in("master_inspector_id", candidateIds)
    .in("status", ["SUBMITTED", "UNDER_REVIEW"]);

  const pendingCount = new Map<string, number>(candidateIds.map((id) => [id, 0]));
  for (const row of pendingRows ?? []) {
    const mid = (row as any).master_inspector_id as string;
    if (mid) pendingCount.set(mid, (pendingCount.get(mid) ?? 0) + 1);
  }

  candidates.sort((a, b) => (pendingCount.get(a.id) ?? 0) - (pendingCount.get(b.id) ?? 0));
  const chosen = candidates[0];

  // 5. Update dispute: assign MI, move to UNDER_REVIEW
  const now = new Date().toISOString();
  const { error: assignErr } = await supabaseAdmin
    .from("inspector_upgrade_disputes")
    .update({
      master_inspector_id: chosen.id,
      assigned_at: now,
      status: "UNDER_REVIEW",
      updated_at: now,
    })
    .eq("id", disputeId);

  if (assignErr) {
    console.error("Master inspector assignment DB update failed:", assignErr);
    await notifyAdminsNoMI(disputeId, projectId);
    return { assigned: false };
  }

  // 6. Notify the assigned Master Inspector
  try {
    const [{ data: miAuth }, { data: project }] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(chosen.id),
      supabaseAdmin.from("projects").select("title").eq("id", projectId).single(),
    ]);

    const miEmail = miAuth?.user?.email;
    if (miEmail) {
      sendDisputeAssignedMasterInspectorEmail({
        masterInspectorEmail: miEmail,
        projectTitle: (project as any)?.title ?? "A Project",
        disputeId,
      }).catch((e: unknown) =>
        console.error("MI assignment notification email failed:", e)
      );
    }
  } catch (e) {
    console.error("MI assignment notification error (non-fatal):", e);
  }

  return { assigned: true, masterInspectorId: chosen.id };
}

async function notifyAdminsNoMI(disputeId: string, projectId: string): Promise<void> {
  try {
    const [{ data: project }, { data: adminProfiles }] = await Promise.all([
      supabaseAdmin.from("projects").select("title").eq("id", projectId).single(),
      supabaseAdmin.from("profiles").select("id").eq("role", "ADMIN"),
    ]);

    const projTitle = (project as any)?.title ?? "A Project";

    for (const admin of adminProfiles ?? []) {
      const { data: adminAuth } = await supabaseAdmin.auth.admin.getUserById(
        (admin as any).id
      );
      const adminEmail = adminAuth?.user?.email;
      if (adminEmail) {
        sendNoMasterInspectorAvailableAdminEmail({
          adminEmail,
          projectTitle: projTitle,
          disputeId,
        }).catch((e: unknown) =>
          console.error("No MI available admin email failed:", e)
        );
      }
    }
  } catch (e) {
    console.error("notifyAdminsNoMI error (non-fatal):", e);
  }
}
