"use server";

import { requireRole } from "@/lib/auth/requireRole";
import { revalidatePath } from "next/cache";
import { sendInspectorAssignedEmail } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase/admin";

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

  // Send email to inspector
  try {
    const { data: assignment } = await supabase
      .from("project_inspector_assignments")
      .select("project_id")
      .eq("id", assignmentId)
      .single();

    if (assignment?.project_id) {
      const { data: project } = await supabase
        .from("projects")
        .select("title, city")
        .eq("id", assignment.project_id)
        .single();

      const { data: inspectorProfile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", inspector_id)
        .single();

      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(
        inspector_id
      );

      if (authUser?.user?.email) {
        await sendInspectorAssignedEmail({
          inspectorEmail: authUser.user.email,
          inspectorName: inspectorProfile?.display_name ?? "Inspector",
          projectTitle: project?.title ?? "Project",
          projectCity: project?.city ?? "—",
          assignmentId,
        });
      }
    }
  } catch (e) {
    console.error("Failed to send inspector email:", e);
  }

  revalidatePath("/dashboard/admin/inspector-requests");
}