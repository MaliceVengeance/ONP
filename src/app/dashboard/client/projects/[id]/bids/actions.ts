"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";

function wrapErr(step: string, err: any) {
  return new Error(`${step} failed: ${JSON.stringify(err)}`);
}

export async function awardBid(projectId: string, bidId: string) {
  const { supabase } = await requireRole(["CLIENT", "ADMIN"]);

  const { error } = await supabase.rpc("award_project_bid", {
    p_project_id: projectId,
    p_bid_id: bidId,
  });

  if (error) throw wrapErr("rpc.award_project_bid", error);

  redirect(`/dashboard/client/projects/${projectId}/bids?award=ok`);
}
