"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { sendRfiSubmittedEmail } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase/admin";

function wrapErr(step: string, err: any) {
  return new Error(`${step} failed: ${JSON.stringify(err)}`);
}

export async function submitRfi(projectId: string, formData: FormData) {
  const { supabase, user } = await requireRole(["CONTRACTOR", "ADMIN"]);

  const catalog_id = formData.get("catalog_id") as string;
  const question = (formData.get("question") as string)?.trim() || null;

  if (!catalog_id) throw new Error("Please select a question type.");

  // Check project is open
  const { data: windowRows } = await supabase.rpc("get_open_project_window", {
    p_project_id: projectId,
  });

  const window = (windowRows as any[])?.[0];
  if (!window || window.state !== "OPEN") {
    throw new Error("Project is not open for RFIs.");
  }

  // Check this question type hasn't been asked yet on this project
  const { data: existing } = await supabase
    .from("rfis")
    .select("id")
    .eq("project_id", projectId)
    .eq("catalog_id", catalog_id)
    .maybeSingle();

  if (existing) {
    throw new Error("This question type has already been asked on this project.");
  }

  // Fetch catalog item for the prompt text
  const { data: catalogItem } = await supabase
    .from("rfi_catalog")
    .select("prompt")
    .eq("id", catalog_id)
    .maybeSingle();

  const { error } = await supabase.from("rfis").insert({
    project_id: projectId,
    contractor_id: user.id,
    catalog_id,
    question,
    status: "OPEN",
    revision_number: window.revision_number ?? 0,
  });

  if (error) throw wrapErr("rfis.insert", error);

  // Send email notification to client
  try {
    const { data: project } = await supabase
      .from("projects")
      .select("title, client_id")
      .eq("id", projectId)
      .single();

    console.log("RFI email - project:", project);

    if (project) {
      const { data: clientProfile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", project.client_id)
        .single();

      console.log("RFI email - clientProfile:", clientProfile);

      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(
        project.client_id
      );

      console.log("RFI email - authUser email:", authUser?.user?.email);

      if (authUser?.user?.email) {
        await sendRfiSubmittedEmail({
          clientEmail: authUser.user.email,
          clientName: clientProfile?.display_name ?? "Client",
          projectTitle: project.title ?? "Your Project",
          question: question ?? catalogItem?.prompt ?? "Question submitted",
          projectId,
        });
        console.log("RFI email - sent successfully");
      }
    }
  } catch (e) {
    console.error("Failed to send RFI email:", e);
  }

  redirect(`/dashboard/contractor/projects/${projectId}/rfis?submitted=1`);
}