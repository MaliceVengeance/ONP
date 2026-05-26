"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { CLIENT_INSPECTOR_REQUEST } from "@/lib/disclaimers/clientInspectorRequest";

function wrapErr(step: string, err: any) {
  return new Error(`${step} failed: ${JSON.stringify(err)}`);
}

export async function selectInspectorTier(projectId: string, formData: FormData) {
  const { user } = await requireRole(["CLIENT", "ADMIN"]);

  const pricingKey = (formData.get("pricing_key") as string)?.trim();
  if (!pricingKey) throw new Error("Please select an inspection type.");

  const disclaimerAccepted = formData.get("disclaimer_accepted") === "on";
  if (!disclaimerAccepted) throw new Error("You must accept the disclaimer to continue.");

  // Check for existing active (non-FAILED) assignment
  const { data: existing } = await supabaseAdmin
    .from("project_inspector_assignments")
    .select("id, payment_status")
    .eq("project_id", projectId)
    .neq("payment_status", "FAILED")
    .maybeSingle();

  if (existing) {
    if (existing.payment_status === "PENDING") {
      redirect(`/dashboard/client/projects/${projectId}/inspector/pay`);
    }
    throw new Error("An inspector request already exists for this project.");
  }

  // Look up fee from price list
  const { data: priceRow } = await supabaseAdmin
    .from("inspector_price_list")
    .select("fee_cents, inspector_share_percent, display_name")
    .eq("pricing_key", pricingKey)
    .eq("is_active", true)
    .maybeSingle();

  if (!priceRow) throw new Error("Selected inspection type is not available.");

  const feeCents = priceRow.fee_cents;
  const inspectorShareCents = Math.round((feeCents * priceRow.inspector_share_percent) / 100);
  const onpShareCents = feeCents - inspectorShareCents;

  // Insert the assignment row
  const { error } = await supabaseAdmin
    .from("project_inspector_assignments")
    .insert({
      project_id: projectId,
      client_id: user.id,
      requested_at: new Date().toISOString(),
      request_status: "PENDING",
      is_takeoff_provider: true,
      pricing_key: pricingKey,
      fee_charged_cents: feeCents,
      inspector_share_cents: inspectorShareCents,
      onp_share_cents: onpShareCents,
      payment_status: "PENDING",
    });

  if (error) throw wrapErr("project_inspector_assignments.insert", error);

  // Log disclaimer acknowledgment
  await supabaseAdmin.from("disclaimer_acknowledgments").insert({
    user_id: user.id,
    disclaimer_type: CLIENT_INSPECTOR_REQUEST.type,
    disclaimer_version: CLIENT_INSPECTOR_REQUEST.version,
    project_id: projectId,
    acknowledged_at: new Date().toISOString(),
  });

  redirect(`/dashboard/client/projects/${projectId}/inspector/pay`);
}

export async function cancelInspectorRequest(projectId: string) {
  const { user } = await requireRole(["CLIENT", "ADMIN"]);

  // Only delete PENDING (unpaid) rows — cannot cancel after payment
  const { error } = await supabaseAdmin
    .from("project_inspector_assignments")
    .delete()
    .eq("project_id", projectId)
    .eq("client_id", user.id)
    .eq("payment_status", "PENDING");

  if (error) throw wrapErr("project_inspector_assignments.delete", error);

  redirect(`/dashboard/client/projects/${projectId}/inspector`);
}
