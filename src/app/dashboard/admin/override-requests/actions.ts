"use server";

import { requireRole } from "@/lib/auth/requireRole";
import { revalidatePath } from "next/cache";

function wrapErr(step: string, err: any) {
  return new Error(`${step} failed: ${JSON.stringify(err)}`);
}

/**
 * Both actions below refuse to run while a project is bidding_paused_at
 * (a sensitive-file-removal review in progress). Neither is the intended
 * resolution path for that pause -- resolve_bidding_pause (invoked from the
 * admin review queue) is the only way to clear it. Without this guard, an
 * admin handling an unrelated deadline-extension or emergency-bid-mode
 * request could accidentally resurrect bidding eligibility on a project
 * that's paused for an active safety review.
 */
async function assertNotPaused(supabase: any, projectId: string) {
  const { data } = await supabase
    .from("projects")
    .select("bidding_paused_at")
    .eq("id", projectId)
    .maybeSingle();
  if (data?.bidding_paused_at) {
    throw new Error(
      "This project is paused pending a sensitive-file-removal review. Resolve the review before making other overrides."
    );
  }
}

export async function approveOverride(projectId: string, formData: FormData) {
  const { supabase } = await requireRole(["ADMIN"]);

  await assertNotPaused(supabase, projectId);

  const newDeadlineStr = formData.get("new_deadline") as string;
  if (!newDeadlineStr) throw new Error("Please select a new deadline date.");

  const newDeadline = new Date(newDeadlineStr);
  newDeadline.setHours(23, 59, 59, 0);

  const { error } = await supabase
    .from("projects")
    .update({
      deadline_at: newDeadline.toISOString(),
      urgent_override: true,
      urgent_reason: "Deadline extended by admin upon client request.",
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  if (error) throw wrapErr("approveOverride", error);

  revalidatePath("/dashboard/admin/override-requests");
}

export async function approveEmergencyBidMode(projectId: string) {
  const { supabase } = await requireRole(["ADMIN"]);

  await assertNotPaused(supabase, projectId);

  const { error } = await supabase
    .from("projects")
    .update({
      emergency_bid_mode: true,
      urgent_override: true,
      urgent_reason: "[EMERGENCY BID MODE APPROVED] Admin approved emergency bid mode — bids are now visible as submitted.",
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  if (error) throw wrapErr("approveEmergencyBidMode", error);

  revalidatePath("/dashboard/admin/override-requests");
}

export async function denyOverride(projectId: string) {
  const { supabase } = await requireRole(["ADMIN"]);

  const { error } = await supabase
    .from("projects")
    .update({
      override_requested_at: null,
      override_requested_reason: null,
      override_requested_by: null,
    })
    .eq("id", projectId);

  if (error) throw wrapErr("denyOverride", error);

  revalidatePath("/dashboard/admin/override-requests");
}