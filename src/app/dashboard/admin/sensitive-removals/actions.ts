"use server";

import { requireRole } from "@/lib/auth/requireRole";
import { revalidatePath } from "next/cache";

function wrapErr(step: string, err: any) {
  return new Error(`${step} failed: ${JSON.stringify(err)}`);
}

const VALID_RESOLUTIONS = ["REACKNOWLEDGE_ALLOWED", "BIDDING_REOPENED", "PROJECT_RESTARTED", "NO_ACTION_NEEDED"];

/**
 * The only way to clear projects.bidding_paused_at -- resolve_bidding_pause
 * (migration 028) is the DB-layer authority; this action just forwards the
 * admin's choice and surfaces any rejection (already resolved, not found,
 * not actually an admin) as a clean inline message rather than a thrown
 * error reaching a raw form action.
 */
export async function resolveSensitiveRemoval(
  projectId: string,
  reviewId: string,
  resolutionAction: string,
  adminNote: string | null
) {
  const { supabase } = await requireRole(["ADMIN"]);

  if (!VALID_RESOLUTIONS.includes(resolutionAction)) {
    throw new Error("Please choose a valid resolution.");
  }

  const { error } = await supabase.rpc("resolve_bidding_pause", {
    p_project_id: projectId,
    p_review_id: reviewId,
    p_resolution_action: resolutionAction,
    p_admin_note: adminNote,
  });
  if (error) throw wrapErr("rpc.resolve_bidding_pause", error);

  revalidatePath("/dashboard/admin/sensitive-removals");
}
