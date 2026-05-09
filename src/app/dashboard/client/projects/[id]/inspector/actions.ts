"use server";

import { requireRole } from "@/lib/auth/requireRole";
import { revalidatePath } from "next/cache";

export async function requestInspector(projectId: string) {
  const { supabase, user } = await requireRole(["CLIENT", "ADMIN"]);

  // Check if already requested
  const { data: existing } = await supabase
    .from("project_inspector_assignments")
    .select("id, request_status")
    .eq("project_id", projectId)
    .maybeSingle();

  if (existing) {
    throw new Error("An inspector has already been requested for this project.");
  }

  const { error } = await supabase
    .from("project_inspector_assignments")
    .insert({
      project_id: projectId,
      client_id: user.id,
      requested_at: new Date().toISOString(),
      request_status: "PENDING",
      is_takeoff_provider: true,
    });

  if (error) throw new Error(`requestInspector failed: ${JSON.stringify(error)}`);

  revalidatePath(`/dashboard/client/projects/${projectId}/inspector`);
}