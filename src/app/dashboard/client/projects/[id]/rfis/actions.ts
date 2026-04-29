"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";

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

  redirect(`/dashboard/client/projects/${projectId}/rfis?saved=1`);
}