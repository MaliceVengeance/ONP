"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";

function normalizeCategories(input: string) {
  // comma-separated -> array of trimmed strings
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export async function saveContractorProfile(formData: FormData) {
  const { supabase, user } = await requireRole(["CONTRACTOR", "ADMIN"]);

  const business_name = String(formData.get("business_name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const categoriesText = String(formData.get("categories") ?? "").trim();
  const is_listed = formData.get("is_listed") === "on";
  const apply_veteran = formData.get("apply_veteran") === "on";

  const categories = normalizeCategories(categoriesText);

  const payload: any = {
    contractor_id: user.id,
    business_name: business_name || null,
    city: city || null,
    state: state || null,
    description: description || null,
    categories,
    is_listed,
  };

  // If they checked "apply", set applied_at (but don't auto-verify)
  if (apply_veteran) {
    payload.veteran_applied_at = new Date().toISOString();
  }

  const { error } = await supabase.from("contractor_profiles").upsert(payload, {
    onConflict: "contractor_id",
  });

  if (error) {
    throw new Error(`saveContractorProfile failed: ${JSON.stringify(error)}`);
  }

  redirect("/dashboard/contractor/profile?saved=1");
}
