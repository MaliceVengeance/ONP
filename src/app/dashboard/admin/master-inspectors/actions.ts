"use server";

import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function promoteToMasterInspector(
  inspectorId: string,
  _formData: FormData
) {
  await requireRole(["ADMIN"]);

  // Verify the target is an inspector
  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .select("id, role, is_master_inspector")
    .eq("id", inspectorId)
    .single();

  if (profileErr || !profile) throw new Error("Inspector not found.");
  if ((profile as any).role !== "INSPECTOR") {
    throw new Error("Only users with the INSPECTOR role can become Master Inspectors.");
  }
  if ((profile as any).is_master_inspector) {
    throw new Error("This inspector is already a Master Inspector.");
  }

  const now = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      is_master_inspector: true,
      master_inspector_since: now,
    })
    .eq("id", inspectorId);

  if (error) throw new Error(`Promotion failed: ${JSON.stringify(error)}`);

  // Log the admin action
  await supabaseAdmin.from("admin_actions").insert({
    action_type: "PROMOTE_MASTER_INSPECTOR",
    target_id: inspectorId,
    performed_at: now,
  });

  revalidatePath("/dashboard/admin/master-inspectors");
}

export async function demoteFromMasterInspector(
  inspectorId: string,
  formData: FormData
) {
  await requireRole(["ADMIN"]);

  const reason = (formData.get("reason") as string | null)?.trim() ?? "";
  if (reason.length < 10) {
    throw new Error("Please provide a reason for demotion (at least 10 characters).");
  }

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .select("id, is_master_inspector")
    .eq("id", inspectorId)
    .single();

  if (profileErr || !profile) throw new Error("Inspector not found.");
  if (!(profile as any).is_master_inspector) {
    throw new Error("This inspector is not currently a Master Inspector.");
  }

  // Unassign from any open disputes
  await supabaseAdmin
    .from("inspector_upgrade_disputes")
    .update({
      master_inspector_id: null,
      assigned_at: null,
      status: "SUBMITTED",
    })
    .eq("master_inspector_id", inspectorId)
    .in("status", ["SUBMITTED", "UNDER_REVIEW"]);

  const now = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      is_master_inspector: false,
      master_inspector_since: null,
    })
    .eq("id", inspectorId);

  if (error) throw new Error(`Demotion failed: ${JSON.stringify(error)}`);

  await supabaseAdmin.from("admin_actions").insert({
    action_type: "DEMOTE_MASTER_INSPECTOR",
    target_id: inspectorId,
    notes: reason,
    performed_at: now,
  });

  revalidatePath("/dashboard/admin/master-inspectors");
}
