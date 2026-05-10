"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { sendBidAwardedEmail } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase/admin";

function wrapErr(step: string, err: any) {
  return new Error(`${step} failed: ${JSON.stringify(err)}`);
}

export async function awardBid(projectId: string, bidId: string) {
  const { supabase } = await requireRole(["CLIENT", "ADMIN"]);

  // Fetch bid and project details before awarding
  const { data: bid } = await supabase
    .from("bids")
    .select("contractor_id")
    .eq("id", bidId)
    .single();

  const { data: project } = await supabase
    .from("projects")
    .select("title")
    .eq("id", projectId)
    .single();

  const { error } = await supabase.rpc("award_project_bid", {
    p_project_id: projectId,
    p_bid_id: bidId,
  });

  if (error) throw wrapErr("rpc.award_project_bid", error);

  // Send email to winning contractor
  try {
    if (bid?.contractor_id) {
      const { data: contractorProfile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", bid.contractor_id)
        .single();

      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(
        bid.contractor_id
      );

      if (authUser?.user?.email) {
        await sendBidAwardedEmail({
          contractorEmail: authUser.user.email,
          contractorName: contractorProfile?.display_name ?? "Contractor",
          projectTitle: project?.title ?? "Project",
          projectId,
        });
      }
    }
  } catch (e) {
    console.error("Failed to send award email:", e);
  }

  redirect(`/dashboard/client/projects/${projectId}/bids?award=ok`);
}