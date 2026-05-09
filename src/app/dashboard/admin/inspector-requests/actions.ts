"use server";

import { requireRole } from "@/lib/auth/requireRole";
import { revalidatePath } from "next/cache";

export async function assignInspector(assignmentId: string, formData: FormData) {
  const { supabase } = await requireRole(["ADMIN"]);

  const inspector_id = formData.get("inspector_id") as string;
  if (!inspector_id) throw new Error("Please select an inspector.");

  const { error } = await supabase
    .from("project_inspector_assignments")
    .update({
      inspector_id,
      assigned_at: new Date().toISOString(),
      request_status: "ASSIGNED",
    })
    .eq("id", assignmentId);

  if (error) throw new Error(`assignInspector failed: ${JSON.stringify(error)}`);

  revalidatePath("/dashboard/admin/inspector-requests");
}