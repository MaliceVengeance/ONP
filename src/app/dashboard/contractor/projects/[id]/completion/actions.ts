"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendCompletionRequestedEmail } from "@/lib/email";

export async function requestCompletion(projectId: string) {
  const { user } = await requireRole(["CONTRACTOR", "ADMIN"]);

  // Verify this contractor is the awarded contractor
  const { data: award } = await supabaseAdmin
    .from("project_awards")
    .select("contractor_id")
    .eq("project_id", projectId)
    .eq("contractor_id", user.id)
    .maybeSingle();

  if (!award) redirect(`/dashboard/contractor/projects/${projectId}`);

  // Verify project is AWARDED with no existing completion request
  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("state, title, client_id, completion_requested_at")
    .eq("id", projectId)
    .maybeSingle();

  if (!project || project.state !== "AWARDED" || (project as any).completion_requested_at) {
    redirect(`/dashboard/contractor/projects/${projectId}`);
  }

  await supabaseAdmin
    .from("projects")
    .update({ completion_requested_at: new Date().toISOString() })
    .eq("id", projectId);

  // Email the client
  try {
    const { data: clientAuth } = await supabaseAdmin.auth.admin.getUserById((project as any).client_id);
    const clientEmail = clientAuth?.user?.email;

    const { data: clientProfile } = await supabaseAdmin
      .from("profiles")
      .select("display_name")
      .eq("id", (project as any).client_id)
      .maybeSingle();

    const { data: contractorProfile } = await supabaseAdmin
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();

    if (clientEmail) {
      await sendCompletionRequestedEmail({
        clientEmail,
        clientName: (clientProfile as any)?.display_name || "there",
        contractorName: (contractorProfile as any)?.display_name || "Your contractor",
        projectTitle: (project as any).title || "Your Project",
        projectId,
      });
    }
  } catch (e) {
    console.error("requestCompletion: failed to send email", e);
  }

  redirect(`/dashboard/contractor/projects/${projectId}?completion=signaled`);
}
