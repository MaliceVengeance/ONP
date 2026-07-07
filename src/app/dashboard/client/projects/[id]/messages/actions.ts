"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function sendClientMessage(projectId: string, formData: FormData) {
  const { user } = await requireRole(["CLIENT", "ADMIN"]);
  const body = (formData.get("body") as string | null)?.trim() ?? "";

  if (!body || body.length > 2000) {
    redirect(`/dashboard/client/projects/${projectId}#messages`);
    return;
  }

  // Verify the project belongs to this client and is AWARDED
  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("id, client_id, state")
    .eq("id", projectId)
    .maybeSingle();

  const role = project?.client_id === user.id ? "CLIENT" : "ADMIN";

  if (
    !project ||
    (role === "CLIENT" && project.client_id !== user.id) ||
    !["AWARDED", "COMPLETED"].includes(project.state)
  ) {
    redirect(`/dashboard/client/projects/${projectId}`);
    return;
  }

  await supabaseAdmin.from("project_messages").insert({
    project_id: projectId,
    sender_id: user.id,
    sender_role: role,
    body,
  });

  redirect(`/dashboard/client/projects/${projectId}#messages`);
}
