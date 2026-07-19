"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendCredentialSubmittedAdminEmail } from "@/lib/email";

const CREDENTIAL_TYPES = ["STATE_LICENSE", "CITY_REGISTRATION", "TRADE_LICENSE", "BOND"];

const CREDENTIAL_TYPE_LABELS: Record<string, string> = {
  STATE_LICENSE: "State License",
  CITY_REGISTRATION: "City Registration",
  TRADE_LICENSE: "Trade-Specific License",
  BOND: "Surety Bond",
};

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
  const state = clean(formData.get("state"));
  const city = clean(formData.get("city"));
  const trade = clean(formData.get("trade"));

  const { error } = await supabaseAdmin.from("contractor_credentials").insert({
    contractor_id: user.id,
    credential_type,
    state,
    city,
    credential_number: clean(formData.get("credential_number")),
    issuing_authority: clean(formData.get("issuing_authority")),
    trade,
    expiration_date: clean(formData.get("expiration_date")),
    bond_amount_cents,
    bonding_company: clean(formData.get("bonding_company")),
  });

  if (error) throw new Error(`addCredential failed: ${JSON.stringify(error)}`);

  // Alert admins — non-fatal if this fails, the credential is already saved
  // and will still show up in the admin review queue either way.
  try {
    const { data: profile } = await supabaseAdmin
      .from("contractor_profiles")
      .select("business_name")
      .eq("contractor_id", user.id)
      .maybeSingle();

    const { data: adminProfiles } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("role", "ADMIN");

    for (const admin of adminProfiles ?? []) {
      const { data: adminAuth } = await supabaseAdmin.auth.admin.getUserById(admin.id);
      const adminEmail = adminAuth?.user?.email;
      if (adminEmail) {
        sendCredentialSubmittedAdminEmail({
          adminEmail,
          businessName: profile?.business_name ?? "A contractor",
          credentialType: CREDENTIAL_TYPE_LABELS[credential_type] ?? credential_type,
          trade,
          state,
          city,
          contractorId: user.id,
        }).catch((e) => console.error("Credential submitted admin email failed:", e));
      }
    }
  } catch (notifyErr) {
    console.error("Credential submission admin notification error (non-fatal):", notifyErr);
  }

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
