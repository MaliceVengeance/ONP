"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";

function normalizeCategories(input: string) {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function clean(v: FormDataEntryValue | null) {
  return String(v ?? "").trim() || null;
}

export async function saveContractorProfile(formData: FormData) {
  const { supabase, user } = await requireRole(["CONTRACTOR", "ADMIN"]);

  const business_name = clean(formData.get("business_name"));
  const phone = clean(formData.get("phone"));
  const address_line1 = clean(formData.get("address_line1"));
  const address_line2 = clean(formData.get("address_line2"));
  const city = clean(formData.get("city"));
  const state = clean(formData.get("state"));
  const address_zip = clean(formData.get("address_zip"));
  const description = clean(formData.get("description"));
  const categoriesText = String(formData.get("categories") ?? "").trim();
  const is_listed = formData.get("is_listed") === "on";
  const has_no_license = formData.get("has_no_license") === "on";
  const has_no_insurance = formData.get("has_no_insurance") === "on";
  const apply_veteran = formData.get("apply_veteran") === "on";
  const military_branch = clean(formData.get("military_branch"));
  const veteran_credential_type = clean(formData.get("veteran_credential_type"));
  const veteran_credential_reference = clean(formData.get("veteran_credential_reference"));

  // License & COI
  const license_number = clean(formData.get("license_number"));
  const license_expiry = clean(formData.get("license_expiry"));
  const coi_provider = clean(formData.get("coi_provider"));
  const coi_policy_number = clean(formData.get("coi_policy_number"));
  const coi_expiry = clean(formData.get("coi_expiry"));
  const coi_amount_raw = clean(formData.get("coi_amount"));
  const coi_amount = coi_amount_raw ? parseInt(coi_amount_raw) : null;

  const categories = normalizeCategories(categoriesText);

  const payload: any = {
    contractor_id: user.id,
    business_name,
    phone,
    address_line1,
    address_line2,
    city,
    state,
    address_zip,
    description,
    categories,
    is_listed,
    has_no_license,
    has_no_insurance,
    military_branch,
    veteran_credential_type,
    veteran_credential_reference,
    license_number,
    license_expiry: license_expiry || null,
    coi_provider,
    coi_policy_number,
    coi_expiry: coi_expiry || null,
    coi_amount,
  };

  if (apply_veteran) {
    payload.veteran_applied_at = new Date().toISOString();
    payload.veteran_rejection_reason = null;
  }

  const { error } = await supabase.from("contractor_profiles").upsert(payload, {
    onConflict: "contractor_id",
  });

  if (error) {
    throw new Error(`saveContractorProfile failed: ${JSON.stringify(error)}`);
  }

  redirect("/dashboard/contractor/profile?saved=1");
}