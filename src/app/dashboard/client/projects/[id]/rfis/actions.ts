"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { sendRfiAnsweredEmail } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase/admin";

function wrapErr(step: string, err: any) {
  return new Error(`${step} failed: ${JSON.stringify(err)}`);
}

export async function respondToRfi(
  projectId: string,
  rfiId: string,
  formData: FormData
) {
  const { supabase } = await requireRole(["CLIENT", "ADMIN"]);

  const response = (formData.get("response") as string)?.trim();
  if (!response) throw new Error("Response cannot be empty.");

  // Fetch RFI details before updating
  const { data: rfi } = await supabase
    .from("rfis")
    .select("contractor_id, question, catalog_id, rfi_catalog(prompt)")
    .eq("id", rfiId)
    .single();

  // Fetch project title
  const { data: project } = await supabase
    .from("projects")
    .select("title")
    .eq("id", projectId)
    .single();

  const { error } = await supabase
    .from("rfis")
    .update({
      response,
      responded_at: new Date().toISOString(),
      status: "ANSWERED",
    })
    .eq("id", rfiId)
    .eq("project_id", projectId);

  if (error) throw wrapErr("rfis.update", error);

  // Send email to contractor
  try {
    if (rfi?.contractor_id) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(
        rfi.contractor_id
      );

      if (authUser?.user?.email) {
        await sendRfiAnsweredEmail({
          contractorEmail: authUser.user.email,
          projectTitle: project?.title ?? "Project",
          question: rfi.question ?? (rfi.rfi_catalog as any)?.prompt ?? "Your question",
          response,
          projectId,
        });
      }
    }
  } catch (e) {
    console.error("Failed to send RFI answer email:", e);
  }

  redirect(`/dashboard/client/projects/${projectId}/rfis?saved=1`);
}