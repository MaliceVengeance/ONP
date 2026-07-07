"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { isInServiceArea } from "./launchZips";

/**
 * Called after a successful signup to set service_area_status and
 * auto-enroll out-of-area users on the waitlist.
 */
export async function processSignupServiceArea(
  userId: string,
  zip: string,
  email: string,
  role: "CLIENT" | "CONTRACTOR"
): Promise<{ inArea: boolean }> {
  const cleanZip = zip.trim().replace(/\D/g, "").slice(0, 5);
  const inArea = isInServiceArea(cleanZip);
  const status = inArea ? "IN_AREA" : "OUT_OF_AREA";

  await supabaseAdmin
    .from("profiles")
    .update({ service_area_zip: cleanZip, service_area_status: status })
    .eq("id", userId);

  if (!inArea) {
    await supabaseAdmin.from("service_area_waitlist").insert({
      email,
      zip: cleanZip,
      intended_role: role,
      source: "SIGNUP_BLOCKED",
    });
  }

  return { inArea };
}

/**
 * Public waitlist join — used on the login/homepage form.
 */
export async function joinWaitlist(formData: FormData) {
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const zip = (formData.get("zip") as string | null)?.trim().replace(/\D/g, "").slice(0, 5) ?? "";
  const intended_role = (formData.get("intended_role") as string | null) ?? "UNKNOWN";
  const source = (formData.get("source") as string | null) ?? "HOMEPAGE";

  if (!email || zip.length !== 5) return;

  // Silently skip duplicates — ON CONFLICT DO NOTHING equivalent
  await supabaseAdmin.from("service_area_waitlist").insert({
    email,
    zip,
    intended_role,
    source,
  });
}
