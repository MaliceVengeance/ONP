"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendCompletionConfirmedEmail } from "@/lib/email";

export async function confirmCompletion(projectId: string) {
  const { user, role } = await requireRole(["CLIENT", "ADMIN"]);

  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("state, title, client_id")
    .eq("id", projectId)
    .maybeSingle();

  if (!project || project.state !== "AWARDED") redirect(`/dashboard/client/projects/${projectId}`);
  if (role !== "ADMIN" && (project as any).client_id !== user.id) throw new Error("Not authorized");

  // Move to COMPLETED and clear the completion request
  await supabaseAdmin
    .from("projects")
    .update({ state: "COMPLETED", completion_requested_at: null })
    .eq("id", projectId);

  // Email the contractor
  try {
    const { data: award } = await supabaseAdmin
      .from("project_awards")
      .select("contractor_id")
      .eq("project_id", projectId)
      .maybeSingle();

    if (award) {
      const { data: contractorAuth } = await supabaseAdmin.auth.admin.getUserById(
        (award as any).contractor_id
      );
      const contractorEmail = contractorAuth?.user?.email;

      if (contractorEmail) {
        await sendCompletionConfirmedEmail({
          contractorEmail,
          projectTitle: (project as any).title || "Your Project",
          projectId,
        });
      }
    }
  } catch (e) {
    console.error("confirmCompletion: failed to send email", e);
  }

  redirect(`/dashboard/client/projects/${projectId}?completed=1`);
}

export async function dismissCompletionRequest(projectId: string) {
  const { user, role } = await requireRole(["CLIENT", "ADMIN"]);

  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("client_id")
    .eq("id", projectId)
    .maybeSingle();

  if (!project) redirect(`/dashboard/client/projects/${projectId}`);
  if (role !== "ADMIN" && (project as any).client_id !== user.id) throw new Error("Not authorized");

  await supabaseAdmin
    .from("projects")
    .update({ completion_requested_at: null })
    .eq("id", projectId);

  redirect(`/dashboard/client/projects/${projectId}`);
}
