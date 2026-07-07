"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";

function wrapErr(step: string, err: any) {
  return new Error(`${step} failed: ${JSON.stringify(err)}`);
}

export async function updatePriceRow(pricingKey: string, formData: FormData) {
  const { user } = await requireRole(["ADMIN"]);

  const feeDollars = parseFloat(formData.get("fee_dollars") as string);
  const inspectorSharePercent = parseInt(
    formData.get("inspector_share_percent") as string,
    10
  );
  const description = (formData.get("description") as string)?.trim() || null;

  if (isNaN(feeDollars) || feeDollars < 0)
    throw new Error("Invalid fee — must be a positive number.");
  if (
    isNaN(inspectorSharePercent) ||
    inspectorSharePercent < 1 ||
    inspectorSharePercent > 99
  )
    throw new Error("Inspector share must be between 1 and 99.");

  const feeCents = Math.round(feeDollars * 100);

  // Fetch current values for the audit record
  const { data: before } = await supabaseAdmin
    .from("inspector_price_list")
    .select("fee_cents, inspector_share_percent, description")
    .eq("pricing_key", pricingKey)
    .single();

  const { error } = await supabaseAdmin
    .from("inspector_price_list")
    .update({
      fee_cents: feeCents,
      inspector_share_percent: inspectorSharePercent,
      description,
      updated_at: new Date().toISOString(),
    })
    .eq("pricing_key", pricingKey);

  if (error) throw wrapErr("inspector_price_list.update", error);

  // Audit log — non-fatal if admin_actions table doesn't exist yet
  try {
    await supabaseAdmin.from("admin_actions").insert({
      admin_id: user.id,
      action_type: "UPDATE_INSPECTOR_PRICE",
      target_id: pricingKey,
      details: {
        pricing_key: pricingKey,
        before,
        after: { fee_cents: feeCents, inspector_share_percent: inspectorSharePercent, description },
      },
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Admin audit log failed (non-fatal):", e);
  }

  revalidatePath("/dashboard/admin/inspector-pricing");
}

export async function setAllInspectorPercent(formData: FormData) {
  const { user } = await requireRole(["ADMIN"]);

  const percent = parseInt(formData.get("percent") as string, 10);
  if (isNaN(percent) || percent < 1 || percent > 99)
    throw new Error("Percentage must be between 1 and 99.");

  const { error } = await supabaseAdmin
    .from("inspector_price_list")
    .update({
      inspector_share_percent: percent,
      updated_at: new Date().toISOString(),
    })
    .neq("pricing_key", ""); // update all rows

  if (error) throw wrapErr("inspector_price_list.setAllPercent", error);

  try {
    await supabaseAdmin.from("admin_actions").insert({
      admin_id: user.id,
      action_type: "SET_ALL_INSPECTOR_PERCENT",
      target_id: "ALL",
      details: { inspector_share_percent: percent },
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Admin audit log failed (non-fatal):", e);
  }

  revalidatePath("/dashboard/admin/inspector-pricing");
}

export async function togglePriceActive(pricingKey: string, currentIsActive: boolean) {
  const { user } = await requireRole(["ADMIN"]);

  const newIsActive = !currentIsActive;

  const { error } = await supabaseAdmin
    .from("inspector_price_list")
    .update({
      is_active: newIsActive,
      updated_at: new Date().toISOString(),
    })
    .eq("pricing_key", pricingKey);

  if (error) throw wrapErr("inspector_price_list.toggle", error);

  // Audit log
  try {
    await supabaseAdmin.from("admin_actions").insert({
      admin_id: user.id,
      action_type: newIsActive ? "ACTIVATE_INSPECTOR_PRICE" : "DEACTIVATE_INSPECTOR_PRICE",
      target_id: pricingKey,
      details: { pricing_key: pricingKey, is_active: newIsActive },
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Admin audit log failed (non-fatal):", e);
  }

  revalidatePath("/dashboard/admin/inspector-pricing");
}
