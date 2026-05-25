"use server";

import { requireRole } from "@/lib/auth/requireRole";
import { revalidatePath } from "next/cache";

function clean(v: FormDataEntryValue | null) {
  return String(v ?? "").trim();
}

export async function requestDeadlineOverride(projectId: string, formData: FormData) {
  const { supabase, user } = await requireRole(["CLIENT", "ADMIN"]);

  const requestType = clean(formData.get("request_type")); // "extend" | "shorten"
  const reason = clean(formData.get("reason"));

  if (!reason) throw new Error("Please provide a reason for the request.");

  const typeLabel =
    requestType === "shorten"
      ? "[EMERGENCY — SHORTEN DEADLINE]"
      : "[EXTEND DEADLINE]";

  const fullReason = `${typeLabel} ${reason}`;

  const { error } = await supabase
    .from("projects")
    .update({
      override_requested_at: new Date().toISOString(),
      override_requested_reason: fullReason,
      override_requested_by: user.id,
    })
    .eq("id", projectId)
    .eq("client_id", user.id);

  if (error) throw new Error(`requestDeadlineOverride failed: ${JSON.stringify(error)}`);

  revalidatePath(`/dashboard/client/projects/${projectId}/override`);
}
