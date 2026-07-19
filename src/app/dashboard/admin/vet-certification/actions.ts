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

// ── Veteran Certification ────────────────────────────────────────────────────

export async function handleVetCertDecision(contractorId: string, formData: FormData) {
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
        veteran_verified: true,
        veteran_verified_at: new Date().toISOString(),
        veteran_verified_by: user.id,
        veteran_rejection_reason: null,
      })
      .eq("contractor_id", contractorId);
    if (error) throw new Error(`approveVetCert failed: ${JSON.stringify(error)}`);

    await writeLog(user.id, user.email ?? "", contractorId, "VET_APPROVED", note);
  } else {
    const { error } = await supabaseAdmin
      .from("contractor_profiles")
      .update({
        veteran_applied_at: null,
        veteran_verified: false,
        veteran_verified_by: null,
        veteran_rejection_reason: note,
      })
      .eq("contractor_id", contractorId);
    if (error) throw new Error(`rejectVetCert failed: ${JSON.stringify(error)}`);

    await writeLog(user.id, user.email ?? "", contractorId, "VET_REJECTED", note);
  }

  revalidatePath("/dashboard/admin/vet-certification");
}
