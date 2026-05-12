"use server";

import { requireRole } from "@/lib/auth/requireRole";
import { revalidatePath } from "next/cache";

export async function approveVetCert(contractorId: string) {
  const { supabase, user } = await requireRole(["ADMIN"]);

  const { error } = await supabase
    .from("contractor_profiles")
    .update({
      veteran_verified: true,
      veteran_verified_at: new Date().toISOString(),
    })
    .eq("contractor_id", contractorId);

  if (error) throw new Error(`approveVetCert failed: ${JSON.stringify(error)}`);

  revalidatePath("/dashboard/admin/vet-certification");
}

export async function rejectVetCert(contractorId: string) {
  const { supabase } = await requireRole(["ADMIN"]);

  const { error } = await supabase
    .from("contractor_profiles")
    .update({
      veteran_applied_at: null,
      veteran_verified: false,
    })
    .eq("contractor_id", contractorId);

  if (error) throw new Error(`rejectVetCert failed: ${JSON.stringify(error)}`);

  revalidatePath("/dashboard/admin/vet-certification");
}

export async function approveDirectoryVerification(contractorId: string) {
  const { supabase, user } = await requireRole(["ADMIN"]);

  const { error } = await supabase
    .from("contractor_profiles")
    .update({
      directory_verified: true,
      directory_verified_at: new Date().toISOString(),
      directory_verified_by: user.id,
    })
    .eq("contractor_id", contractorId);

  if (error) throw new Error(`approveDirectoryVerification failed: ${JSON.stringify(error)}`);

  revalidatePath("/dashboard/admin/vet-certification");
}

export async function rejectDirectoryVerification(contractorId: string) {
  const { supabase } = await requireRole(["ADMIN"]);

  const { error } = await supabase
    .from("contractor_profiles")
    .update({
      directory_verified: false,
      license_number: null,
      license_expiry: null,
      coi_provider: null,
      coi_policy_number: null,
      coi_expiry: null,
      coi_amount: null,
    })
    .eq("contractor_id", contractorId);

  if (error) throw new Error(`rejectDirectoryVerification failed: ${JSON.stringify(error)}`);

  revalidatePath("/dashboard/admin/vet-certification");
}