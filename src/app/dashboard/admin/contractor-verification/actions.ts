"use server";

import { requireRole } from "@/lib/auth/requireRole";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";

async function writeLog(
  adminId: string,
  adminEmail: string,
  contractorId: string,
  actionType: string,
  note: string
) {
  const { error } = await supabaseAdmin.from("contractor_verification_log").insert({
    contractor_id: contractorId,
    admin_id: adminId,
    admin_email: adminEmail,
    action_type: actionType,
    note,
  });
  if (error) console.error("Audit log write failed (non-fatal):", error);
}

// ── BBB Link (independent of the license/insurance approve-reject decision) ──

export async function updateBbbLink(contractorId: string, formData: FormData) {
  await requireRole(["ADMIN"]);

  const bbb_url = (formData.get("bbb_url") as string | null)?.trim() || null;

  const { error } = await supabaseAdmin
    .from("contractor_profiles")
    .update({ bbb_url })
    .eq("contractor_id", contractorId);
  if (error) throw new Error(`updateBbbLink failed: ${JSON.stringify(error)}`);

  revalidatePath("/dashboard/admin/contractor-verification");
}

// ── Directory Verification (License & Insurance) ─────────────────────────────

export async function handleDirectoryDecision(contractorId: string, formData: FormData) {
  const { user } = await requireRole(["ADMIN"]);

  const decision = formData.get("decision") as string;
  const note = (formData.get("note") as string | null)?.trim() ?? "";

  if (!note) throw new Error("A note is required before approving or rejecting.");
  if (decision !== "approve" && decision !== "reject")
    throw new Error("Invalid decision value.");

  if (decision === "approve") {
    const { error } = await supabaseAdmin
      .from("contractor_profiles")
      .update({
        directory_verified: true,
        directory_verified_at: new Date().toISOString(),
        directory_verified_by: user.id,
      })
      .eq("contractor_id", contractorId);
    if (error) throw new Error(`approveDirectory failed: ${JSON.stringify(error)}`);

    await writeLog(user.id, user.email ?? "", contractorId, "DIR_APPROVED", note);
  } else {
    const { error } = await supabaseAdmin
      .from("contractor_profiles")
      .update({
        directory_verified: false,
        directory_verified_by: null,
      })
      .eq("contractor_id", contractorId);
    if (error) throw new Error(`rejectDirectory failed: ${JSON.stringify(error)}`);

    await writeLog(user.id, user.email ?? "", contractorId, "DIR_REJECTED", note);
  }

  revalidatePath("/dashboard/admin/contractor-verification");
}
