"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/requireRole";
import { sendBidAwardedEmail, sendBidDismissedEmail } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { moderateDismissalText } from "@/lib/contentModeration";

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

const DISMISSAL_REASON_LABELS: Record<string, string> = {
  OVER_BUDGET: "Over Budget",
  UNDER_BUDGET: "Under Budget",
  TIMELINE: "Timeline doesn't work",
  PROPOSAL_UNCLEAR: "Proposal incomplete or unclear",
  MISSING_CREDENTIALS: "Missing license/insurance/bond info",
  PORTFOLIO_MISMATCH: "Portfolio/experience didn't match project needs",
  WENT_ANOTHER: "Went with another contractor",
  OTHER: "Other",
};

async function dismissSingleBid(
  projectId: string,
  bidId: string,
  clientId: string,
  reasonCode: string | null,
  reasonOtherTextRaw: string | null
) {
  const { data: bid } = await supabaseAdmin
    .from("bids")
    .select("id, contractor_id, project_id")
    .eq("id", bidId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (!bid) return; // not this project's bid — silently skip in batch context

  const isOtherReason = reasonCode === "OTHER";
  const reasonOtherText = isOtherReason ? (reasonOtherTextRaw?.trim() || null) : null;
  const { containsProfanity: hasProfanity, moderationStatus } = moderateDismissalText(reasonOtherText);

  const { error: insertErr } = await supabaseAdmin.from("bid_dismissals").insert({
    project_id: projectId,
    contractor_id: bid.contractor_id,
    bid_id: bidId,
    reason_code: reasonCode || null,
    reason_other_text: reasonOtherText,
    dismissed_by: clientId,
    contains_profanity: hasProfanity,
    moderation_status: moderationStatus,
  });
  if (insertErr) throw wrapErr("bid_dismissals.insert", insertErr);

  const { error: statusErr } = await supabaseAdmin
    .from("bids")
    .update({ status: "DISMISSED" })
    .eq("id", bidId);
  if (statusErr) throw wrapErr("bids.update(status=DISMISSED)", statusErr);

  // Immediate notification, regardless of moderation hold — the contractor
  // needs to know their bid was dismissed right away. Only the free-text
  // "Other" reason is ever held back; reason codes are fixed labels, never
  // subject to moderation.
  const deliverReasonNow = !isOtherReason || (!hasProfanity && moderationStatus !== "pending_review");
  const reasonLabel = deliverReasonNow
    ? (isOtherReason ? reasonOtherText : reasonCode ? DISMISSAL_REASON_LABELS[reasonCode] ?? reasonCode : null)
    : null;

  try {
    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("title")
      .eq("id", projectId)
      .single();
    const { data: contractorProfile } = await supabaseAdmin
      .from("contractor_profiles")
      .select("business_name")
      .eq("contractor_id", bid.contractor_id)
      .maybeSingle();
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(bid.contractor_id);

    if (authUser?.user?.email) {
      await sendBidDismissedEmail({
        contractorEmail: authUser.user.email,
        contractorName: contractorProfile?.business_name ?? "Contractor",
        projectTitle: project?.title ?? "Project",
        reasonLabel,
      });
    }
  } catch (e) {
    console.error(`Failed to send dismissal email for bid ${bidId}:`, e);
  }
}

export async function dismissBid(
  projectId: string,
  bidId: string,
  reasonCode: string | null,
  reasonOtherText: string | null
) {
  const { supabase, user, role } = await requireRole(["CLIENT", "ADMIN"]);

  const { data: project } = await supabase
    .from("projects")
    .select("id, client_id")
    .eq("id", projectId)
    .single();
  if (!project) throw new Error("Project not found.");
  if (project.client_id !== user.id && role !== "ADMIN") {
    throw new Error("Not authorized to dismiss bids on this project.");
  }

  await dismissSingleBid(projectId, bidId, user.id, reasonCode, reasonOtherText);

  revalidatePath(`/dashboard/client/projects/${projectId}/bids`);
  redirect(`/dashboard/client/projects/${projectId}/bids?dismissed=1`);
}

export async function batchDismissBids(
  projectId: string,
  bidIds: string[],
  reasonCode: string | null,
  reasonOtherText: string | null
) {
  const { supabase, user, role } = await requireRole(["CLIENT", "ADMIN"]);

  const { data: project } = await supabase
    .from("projects")
    .select("id, client_id")
    .eq("id", projectId)
    .single();
  if (!project) throw new Error("Project not found.");
  if (project.client_id !== user.id && role !== "ADMIN") {
    throw new Error("Not authorized to dismiss bids on this project.");
  }

  for (const bidId of bidIds) {
    await dismissSingleBid(projectId, bidId, user.id, reasonCode, reasonOtherText);
  }

  revalidatePath(`/dashboard/client/projects/${projectId}/bids`);
  redirect(`/dashboard/client/projects/${projectId}/bids?dismissed=${bidIds.length}`);
}
