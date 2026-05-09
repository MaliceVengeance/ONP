"use server";

import { requireRole } from "@/lib/auth/requireRole";
import { revalidatePath } from "next/cache";

function wrapErr(step: string, err: any) {
  return new Error(`${step} failed: ${JSON.stringify(err)}`);
}

export async function approveOverride(projectId: string, formData: FormData) {
  const { supabase } = await requireRole(["ADMIN"]);

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