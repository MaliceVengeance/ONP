"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { sendBidAwardedEmail } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase/admin";

function wrapErr(step: string, err: any) {
  return new Error(`${step} failed: ${JSON.stringify(err)}`);
}

export type BidReview = {
  bidId: string;
  rank: number;
  note: string;
};

export async function awardBid(
  projectId: string,
  bidId: string,
  reviews: BidReview[] = []
) {
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

  // Save review rankings (server-side amount lookup — never trust client-sent values)
  if (reviews.length > 0) {
    const reviewedBidIds = reviews.map((r) => r.bidId);

    const { data: bidVersions } = await supabaseAdmin
      .from("bid_versions")
      .select("bid_id, amount_cents, version_number")
      .in("bid_id", reviewedBidIds)
      .order("version_number", { ascending: false });

    // Keep only the latest version per bid
    const latestAmounts = new Map<string, number>();
    (bidVersions ?? []).forEach((v: any) => {
      if (!latestAmounts.has(v.bid_id)) latestAmounts.set(v.bid_id, v.amount_cents);
    });

    for (const review of reviews) {
      const { error: rankErr } = await supabaseAdmin
        .from("bids")
        .update({
          review_rank: review.rank,
          review_note: review.note || null,
          review_amount_cents: latestAmounts.get(review.bidId) ?? null,
        })
        .eq("id", review.bidId)
        .eq("project_id", projectId);

      if (rankErr) {
        console.error(`Failed to save rank for bid ${review.bidId}:`, rankErr.message);
      }
    }
  }

  // Send email to winning contractor
  try {
    if (bid?.contractor_id) {
      const { data: contractorProfile } = await supabaseAdmin
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
