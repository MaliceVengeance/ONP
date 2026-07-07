"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function sendAdminMessage(projectId: string, formData: FormData) {
  const { user } = await requireRole(["ADMIN"]);
  const body = (formData.get("body") as string | null)?.trim() ?? "";

  if (!body || body.length > 2000) {
    redirect(`/dashboard/admin/projects/${projectId}#messages`);
    return;
  }

  // Admin can message on any AWARDED project
  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("state")
    .eq("id", projectId)
    .maybeSingle();

  if (!project || project.state !== "AWARDED") {
    redirect(`/dashboard/admin/projects/${projectId}`);
    return;
  }

  await supabaseAdmin.from("project_messages").insert({
    project_id: projectId,
    sender_id: user.id,
    sender_role: "ADMIN",
    body,
  });

  redirect(`/dashboard/admin/projects/${projectId}#messages`);
}
