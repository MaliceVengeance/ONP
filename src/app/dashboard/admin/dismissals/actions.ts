"use server";

import { requireRole } from "@/lib/auth/requireRole";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendDismissalReasonFollowUpEmail } from "@/lib/email";

export async function moderateDismissalReason(dismissalId: string, decision: "approve" | "reject") {
  const { user } = await requireRole(["ADMIN"]);

  const { data: dismissal, error: fetchErr } = await supabaseAdmin
    .from("bid_dismissals")
    .select("id, project_id, contractor_id, reason_other_text, contains_profanity, moderation_status")
    .eq("id", dismissalId)
    .single();
  if (fetchErr || !dismissal) throw new Error("Dismissal not found.");
  if (dismissal.moderation_status !== "pending_review") throw new Error("This item is not pending review.");

  const newStatus = decision === "approve" ? "approved" : "rejected";

  const { error: updateErr } = await supabaseAdmin
    .from("bid_dismissals")
    .update({
      moderation_status: newStatus,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", dismissalId);
  if (updateErr) throw new Error(`moderateDismissalReason failed: ${JSON.stringify(updateErr)}`);

  // Approved text is delivered as a follow-up — but never if it also tripped
  // the separate profanity flag, regardless of this decision.
  if (decision === "approve" && !dismissal.contains_profanity && dismissal.reason_other_text) {
    try {
      const { data: project } = await supabaseAdmin
        .from("projects")
        .select("title")
        .eq("id", dismissal.project_id)
        .single();
      const { data: contractorProfile } = await supabaseAdmin
        .from("contractor_profiles")
        .select("business_name")
        .eq("contractor_id", dismissal.contractor_id)
        .maybeSingle();
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(dismissal.contractor_id);

      if (authUser?.user?.email) {
        await sendDismissalReasonFollowUpEmail({
          contractorEmail: authUser.user.email,
          contractorName: contractorProfile?.business_name ?? "Contractor",
          projectTitle: project?.title ?? "Project",
          reasonText: dismissal.reason_other_text,
        });
      }
    } catch (e) {
      console.error("Failed to send dismissal reason follow-up email:", e);
    }
  }

  revalidatePath("/dashboard/admin/dismissals");
}
