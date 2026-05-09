"use server";

import { requireRole } from "@/lib/auth/requireRole";
import { revalidatePath } from "next/cache";

function clean(v: FormDataEntryValue | null) {
  return String(v ?? "").trim();
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

  revalidatePath(`/dashboard/inspector/projects/${assignmentId}`);
}