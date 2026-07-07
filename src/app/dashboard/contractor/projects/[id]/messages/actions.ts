"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function sendContractorMessage(projectId: string, formData: FormData) {
  const { user } = await requireRole(["CONTRACTOR", "ADMIN"]);
  const body = (formData.get("body") as string | null)?.trim() ?? "";

  if (!body || body.length > 2000) {
    redirect(`/dashboard/contractor/projects/${projectId}#messages`);
    return;
  }

  // Verify the contractor is the awarded contractor for this project
  const { data: award } = await supabaseAdmin
    .from("project_awards")
    .select("contractor_id")
    .eq("project_id", projectId)
    .eq("contractor_id", user.id)
    .maybeSingle();

  if (!award) {
    redirect(`/dashboard/contractor/projects/${projectId}`);
    return;
  }

  // Verify project is AWARDED
  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("state")
    .eq("id", projectId)
    .maybeSingle();

  if (!project || !["AWARDED", "COMPLETED"].includes(project.state)) {
    redirect(`/dashboard/contractor/projects/${projectId}`);
    return;
  }

  await supabaseAdmin.from("project_messages").insert({
    project_id: projectId,
    sender_id: user.id,
    sender_role: "CONTRACTOR",
    body,
  });

  redirect(`/dashboard/contractor/projects/${projectId}#messages`);
}
