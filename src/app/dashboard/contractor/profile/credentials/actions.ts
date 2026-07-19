"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";

const CREDENTIAL_TYPES = ["STATE_LICENSE", "CITY_REGISTRATION", "TRADE_LICENSE", "BOND"];

function clean(v: FormDataEntryValue | null) {
  return String(v ?? "").trim() || null;
}

export async function addCredential(formData: FormData) {
  const { user } = await requireRole(["CONTRACTOR", "ADMIN"]);

  const credential_type = clean(formData.get("credential_type"));
  if (!credential_type || !CREDENTIAL_TYPES.includes(credential_type)) {
    throw new Error("Choose a valid credential type.");
  }

  const bond_amount_raw = clean(formData.get("bond_amount"));
  const bond_amount_cents = bond_amount_raw ? Math.round(Number(bond_amount_raw) * 100) : null;

  const { error } = await supabaseAdmin.from("contractor_credentials").insert({
    contractor_id: user.id,
    credential_type,
    state: clean(formData.get("state")),
    city: clean(formData.get("city")),
    credential_number: clean(formData.get("credential_number")),
    issuing_authority: clean(formData.get("issuing_authority")),
    trade: clean(formData.get("trade")),
    expiration_date: clean(formData.get("expiration_date")),
    bond_amount_cents,
    bonding_company: clean(formData.get("bonding_company")),
  });

  if (error) throw new Error(`addCredential failed: ${JSON.stringify(error)}`);

  redirect("/dashboard/contractor/profile/credentials");
}

export async function deleteCredential(credentialId: string) {
  const { user } = await requireRole(["CONTRACTOR", "ADMIN"]);

  const { data: cred, error: fetchErr } = await supabaseAdmin
    .from("contractor_credentials")
    .select("id, contractor_id")
    .eq("id", credentialId)
    .single();
  if (fetchErr || !cred) throw new Error("Credential not found.");
  if (cred.contractor_id !== user.id) throw new Error("Not authorized to delete this credential.");

  const { error } = await supabaseAdmin.from("contractor_credentials").delete().eq("id", credentialId);
  if (error) throw new Error(`deleteCredential failed: ${JSON.stringify(error)}`);

  redirect("/dashboard/contractor/profile/credentials");
}
