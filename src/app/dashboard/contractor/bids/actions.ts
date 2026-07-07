"use server";

import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { CONTRACTOR_EMERGENCY_BID_SUBMIT } from "@/lib/disclaimers/contractorEmergencyBidSubmit";
import { isProfileComplete, profileMissingFields } from "@/lib/contractor/profileComplete";

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

  // Profile completion gate
  const { data: contractorProfile } = await supabase
    .from("contractor_profiles")
    .select("business_name, phone, categories")
    .eq("contractor_id", user.id)
    .maybeSingle();

  if (!isProfileComplete(contractorProfile as any)) {
    const missing = profileMissingFields(contractorProfile as any);
    throw new Error(
      `Your profile is incomplete. Please add your ${missing.join(", ")} at /dashboard/contractor/profile before submitting bids.`
    );
  }

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

  const warranty_terms = clean(formData.get("warranty_terms")) || null;
  const deposit_terms = clean(formData.get("deposit_terms")) || null;
  const scope_disclaimers = clean(formData.get("scope_disclaimers")) || null;
  const estimate_valid_until = clean(formData.get("estimate_valid_until")) || null;

  let lineItems: { description: string; quantity: number; unitPriceCents: number; taxPct: number }[] = [];
  const lineItemsRaw = formData.get("line_items");
  if (lineItemsRaw) {
    try {
      const parsed = JSON.parse(String(lineItemsRaw));
      if (Array.isArray(parsed)) {
        lineItems = parsed.filter((li) => li && String(li.description ?? "").trim());
      }
    } catch {
      // Malformed line items are non-fatal — the quote PDF (if attached) remains authoritative.
    }
  }

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

  // 5) Upload the contractor's official quote PDF, if attached — this becomes the
  //    authoritative document for the Bid Detail Page (letterhead, signature, etc.)
  let quote_pdf_path: string | null = null;
  let quote_pdf_filename: string | null = null;
  const quotePdf = formData.get("quote_pdf");
  if (quotePdf instanceof File && quotePdf.size > 0) {
    if (quotePdf.size > 10 * 1024 * 1024) {
      throw new Error("Quote PDF is too large. Maximum file size is 10MB.");
    }
    const path = `${bidId}/${Date.now()}_${quotePdf.name}`;
    const { error: uploadErr } = await supabaseAdmin.storage
      .from("bid-quotes")
      .upload(path, quotePdf, { contentType: quotePdf.type || "application/pdf" });
    if (uploadErr) throw wrapErr("storage.upload(quote_pdf)", uploadErr);
    quote_pdf_path = path;
    quote_pdf_filename = quotePdf.name;
  }

  // 6) Insert bid version
  const { data: insertedVersion, error: vErr } = await supabase
    .from("bid_versions")
    .insert({
      bid_id: bidId,
      version_number: nextVersion,
      project_revision_number: projectRevisionNumber,
      amount_cents: amount_cents.toString(),
      notes,
      warranty_terms,
      deposit_terms,
      scope_disclaimers,
      estimate_valid_until,
      quote_pdf_path,
      quote_pdf_filename,
    })
    .select("id")
    .single();

  if (vErr) throw wrapErr("bid_versions.insert(version)", vErr);

  // 7) Insert itemized line items for this version, if any were provided
  if (lineItems.length > 0) {
    const rows = lineItems.map((li, idx) => ({
      bid_version_id: insertedVersion.id,
      description: String(li.description).slice(0, 500),
      quantity: Number(li.quantity) || 1,
      unit_price_cents: Math.round(Number(li.unitPriceCents) || 0),
      tax_pct: Number(li.taxPct) || 0,
      sort_order: idx,
    }));
    const { error: liErr } = await supabase.from("bid_line_items").insert(rows);
    if (liErr) throw wrapErr("bid_line_items.insert", liErr);
  }

  // 8) Record bid acknowledgment (non-fatal — table may not exist yet)
  if (formData.get("terms_acknowledged") === "true") {
    const disclaimerVersion = String(formData.get("disclaimer_version") ?? "v1.0-2026-05-25");
    const { error: ackErr } = await supabase.from("bid_acknowledgments").insert({
      contractor_id: user.id,
      bid_id: bidId,
      bid_version_number: nextVersion,
      disclaimer_version: disclaimerVersion,
      terms_checked: true,
      credentials_checked: formData.get("credentials_acknowledged") === "true",
    });
    if (ackErr) {
      console.warn("bid_acknowledgments insert skipped:", ackErr.message);
    }
  }

  // 9) If emergency project and emergency checkbox acknowledged, log disclaimer (first bid only)
  if (formData.get("emergency_acknowledged") === "true" && nextVersion === 1) {
    try {
      const { data: isEmergencyRow } = await supabaseAdmin
        .from("projects")
        .select("is_emergency, emergency_bid_mode")
        .eq("id", projectId)
        .maybeSingle();

      const isAnyEmergency =
        (isEmergencyRow as any)?.is_emergency ||
        (isEmergencyRow as any)?.emergency_bid_mode;

      if (isAnyEmergency) {
        await supabaseAdmin.from("disclaimer_acknowledgments").insert({
          user_id: user.id,
          disclaimer_type: CONTRACTOR_EMERGENCY_BID_SUBMIT.type,
          disclaimer_version: CONTRACTOR_EMERGENCY_BID_SUBMIT.version,
          project_id: projectId,
          acknowledged_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn("Emergency disclaimer log skipped:", e);
    }
  }

}
