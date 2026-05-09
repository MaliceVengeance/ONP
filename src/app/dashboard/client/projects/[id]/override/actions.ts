"use server";

import { requireRole } from "@/lib/auth/requireRole";
import { revalidatePath } from "next/cache";

function clean(v: FormDataEntryValue | null) {
  return String(v ?? "").trim();
}

export async function requestDeadlineOverride(projectId: string, formData: FormData) {
  const { supabase, user } = await requireRole(["CLIENT", "ADMIN"]);

  const reason = clean(formData.get("reason"));

  if (!reason) throw new Error("Please provide a reason for the extension request.");

  const { error } = await supabase
    .from("projects")
    .update({
      override_requested_at: new Date().toISOString(),
      override_requested_reason: reason,
      override_requested_by: user.id,
    })
    .eq("id", projectId)
    .eq("client_id", user.id);

  if (error) throw new Error(`requestDeadlineOverride failed: ${JSON.stringify(error)}`);

  revalidatePath(`/dashboard/client/projects/${projectId}/override`);
}