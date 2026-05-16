"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";

function clean(v: FormDataEntryValue | null) {
  return String(v ?? "").trim();
}

function moneyToCents(inputRaw: string): bigint {
  const normalized = inputRaw.replace(/[$, ]/g, "");
  if (!normalized) throw new Error("Missing bid amount.");

  const num = Number(normalized);
  if (!Number.isFinite(num) || num <= 0) {
    throw new Error("Bid amount must be a positive number.");
  }

  return BigInt(Math.round(num * 100));
}

function wrapErr(step: string, err: any) {
  return new Error(`${step} failed: ${JSON.stringify(err)}`);
}

type ProjectWindowRow = {
  id: string;
  state: string;
  deadline_at: string | null;
  revision_number: number | null;
};

export async function submitBid(projectId: string, formData: FormData) {
  const { supabase, user } = await requireRole(["CONTRACTOR", "ADMIN"]);

  // Subscription gate — server-side enforcement
  const { data: subData } = await supabase
    .from("contractor_subscriptions")
    .select("status")
    .eq("contractor_id", user.id)
    .maybeSingle();

  const isSubscribed =
    subData?.status === "ACTIVE" || subData?.status === "TRIALING";

  if (!isSubscribed) {
    throw new Error(
      "An active subscription is required to submit bids. Please subscribe at /dashboard/contractor/subscribe."
    );
  }

  const amountInput = clean(formData.get("amount"));
  const notes = clean(formData.get("notes"));
  const amount_cents = moneyToCents(amountInput);

  // 1) Read bidding window safely via RPC
  const { data: windowRows, error: wErr } = await supabase.rpc(
    "get_open_project_window",
    { p_project_id: projectId }
  );

  if (wErr) throw wrapErr("rpc.get_open_project_window", wErr);

  const row = (windowRows as ProjectWindowRow[] | null)?.[0];

  if (!row) {
    throw new Error("Project not found or you do not have access.");
  }

  if (row.state !== "OPEN" || !row.deadline_at) {
    throw new Error("Project is not open for bidding.");
  }

  if (new Date(row.deadline_at).getTime() <= Date.now()) {
    throw new Error("Bidding has closed for this project.");
  }

  const projectRevisionNumber =
    typeof row.revision_number === "number" ? row.revision_number : 0;

  // 2) Find existing bid (if any)
  const { data: existing, error: findErr } = await supabase
    .from("bids")
    .select("id")
    .eq("project_id", projectId)
    .eq("contractor_id", user.id)
    .maybeSingle();

  if (findErr) throw wrapErr("bids.select(existing)", findErr);

  let bidId: string;

  if (existing?.id) {
    // 3a) Touch updated_at
    const { error: updErr } = await supabase
      .from("bids")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", existing.id);

    if (updErr) throw wrapErr("bids.update(updated_at)", updErr);
    bidId = existing.id;
  } else {
    // 3b) Insert new bid row
    const { data: inserted, error: insErr } = await supabase
      .from("bids")
      .insert({
        project_id: projectId,
        contractor_id: user.id,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insErr) throw wrapErr("bids.insert(new)", insErr);
    bidId = inserted.id;
  }

  // 4) Compute next version_number
  const { data: lastV, error: lastErr } = await supabase
    .from("bid_versions")
    .select("version_number")
    .eq("bid_id", bidId)
    .order("version_number", { ascending: false })
    .limit(1);

  if (lastErr) throw wrapErr("bid_versions.select(last_version)", lastErr);

  const nextVersion =
    lastV && lastV.length > 0 && typeof (lastV[0] as any).version_number === "number"
      ? (lastV[0] as any).version_number + 1
      : 1;

  // 5) Insert bid version
  const { error: vErr } = await supabase.from("bid_versions").insert({
    bid_id: bidId,
    version_number: nextVersion,
    project_revision_number: projectRevisionNumber,
    amount_cents: amount_cents.toString(),
    notes,
  });

  if (vErr) throw wrapErr("bid_versions.insert(version)", vErr);

  redirect(`/dashboard/contractor/projects/${projectId}?bid=ok`);
}