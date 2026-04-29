"use server";

import { requireRole } from "@/lib/auth/requireRole";
import { revalidatePath } from "next/cache";

function wrapErr(step: string, err: any) {
  return new Error(`${step} failed: ${JSON.stringify(err)}`);
}

export async function approveVetCert(contractorId: string) {
  const { supabase } = await requireRole(["ADMIN"]);

  const { error } = await supabase
    .from("contractor_profiles")
    .update({
      veteran_verified: true,
      veteran_verified_at: new Date().toISOString(),
    })
    .eq("contractor_id", contractorId);

  if (error) throw wrapErr("approveVetCert", error);

  revalidatePath("/dashboard/admin/vet-certification");
}

export async function rejectVetCert(contractorId: string) {
  const { supabase } = await requireRole(["ADMIN"]);

  const { error } = await supabase
    .from("contractor_profiles")
    .update({
      veteran_verified: false,
      veteran_applied_at: null,
    })
    .eq("contractor_id", contractorId);

  if (error) throw wrapErr("rejectVetCert", error);

  revalidatePath("/dashboard/admin/vet-certification");
}