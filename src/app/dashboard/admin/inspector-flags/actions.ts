"use server";

import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function unblockInspector(
  inspectorId: string,
  formData: FormData
) {
  await requireRole(["ADMIN"]);

  const notes = (formData.get("notes") as string | null)?.trim() ?? "";
  if (notes.length < 10) {
    throw new Error("Please provide a reason for unblocking (at least 10 characters).");
  }

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .select("id, upgrade_blocked")
    .eq("id", inspectorId)
    .single();

  if (profileErr || !profile) throw new Error("Inspector not found.");
  if (!(profile as any).upgrade_blocked) {
    throw new Error("This inspector is not currently blocked.");
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ upgrade_blocked: false })
    .eq("id", inspectorId);

  if (error) throw new Error(`Unblock failed: ${JSON.stringify(error)}`);

  const now = new Date().toISOString();
  await supabaseAdmin.from("admin_actions").insert({
    action_type: "UNBLOCK_INSPECTOR",
    target_id: inspectorId,
    notes,
    performed_at: now,
  });

  revalidatePath("/dashboard/admin/inspector-flags");
}

export async function suspendInspector(
  inspectorId: string,
  formData: FormData
) {
  await requireRole(["ADMIN"]);

  const notes = (formData.get("notes") as string | null)?.trim() ?? "";
  if (notes.length < 10) {
    throw new Error("Please provide a reason for suspension (at least 10 characters).");
  }

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .select("id, role")
    .eq("id", inspectorId)
    .single();

  if (profileErr || !profile) throw new Error("Inspector not found.");
  if ((profile as any).role !== "INSPECTOR") throw new Error("Target is not an inspector.");

  // Block upgrade requests
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ upgrade_blocked: true })
    .eq("id", inspectorId);

  if (error) throw new Error(`Suspension failed: ${JSON.stringify(error)}`);

  const now = new Date().toISOString();
  await supabaseAdmin.from("admin_actions").insert({
    action_type: "SUSPEND_INSPECTOR",
    target_id: inspectorId,
    notes,
    performed_at: now,
  });

  revalidatePath("/dashboard/admin/inspector-flags");
}
