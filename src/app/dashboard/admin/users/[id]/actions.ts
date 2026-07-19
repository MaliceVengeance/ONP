"use server";

import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

function clean(v: FormDataEntryValue | null) {
  return String(v ?? "").trim() || null;
}

export async function updateContractorVerification(contractorId: string, formData: FormData) {
  await requireRole(["ADMIN"]);

  const license_number = clean(formData.get("license_number"));
  const license_expiry = clean(formData.get("license_expiry"));
  const coi_provider = clean(formData.get("coi_provider"));
  const coi_policy_number = clean(formData.get("coi_policy_number"));
  const coi_expiry = clean(formData.get("coi_expiry"));
  const coi_amount_raw = clean(formData.get("coi_amount"));
  const coi_amount = coi_amount_raw ? parseInt(coi_amount_raw) : null;
  const bbb_url = clean(formData.get("bbb_url"));

  const { error } = await supabaseAdmin
    .from("contractor_profiles")
    .update({
      license_number,
      license_expiry,
      coi_provider,
      coi_policy_number,
      coi_expiry,
      coi_amount,
      bbb_url,
    })
    .eq("contractor_id", contractorId);

  if (error) throw new Error(`updateContractorVerification failed: ${JSON.stringify(error)}`);

  revalidatePath(`/dashboard/admin/users/${contractorId}`);
}

export async function setCredentialVerified(contractorId: string, credentialId: string, formData: FormData) {
  const { user } = await requireRole(["ADMIN"]);

  const verify = formData.get("verify") === "true";

  const { error } = await supabaseAdmin
    .from("contractor_credentials")
    .update(
      verify
        ? { verified: true, verified_at: new Date().toISOString(), verified_by: user.id }
        : { verified: false, verified_at: null, verified_by: null }
    )
    .eq("id", credentialId);

  if (error) throw new Error(`setCredentialVerified failed: ${JSON.stringify(error)}`);

  revalidatePath(`/dashboard/admin/users/${contractorId}`);
}

export async function deleteCredentialAdmin(contractorId: string, credentialId: string) {
  await requireRole(["ADMIN"]);

  const { error } = await supabaseAdmin.from("contractor_credentials").delete().eq("id", credentialId);
  if (error) throw new Error(`deleteCredentialAdmin failed: ${JSON.stringify(error)}`);

  revalidatePath(`/dashboard/admin/users/${contractorId}`);
}
