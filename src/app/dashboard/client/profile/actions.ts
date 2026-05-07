"use server";

import { requireRole } from "@/lib/auth/requireRole";
import { revalidatePath } from "next/cache";

function clean(v: FormDataEntryValue | null) {
  return String(v ?? "").trim();
}

function wrapErr(step: string, err: any) {
  return new Error(`${step} failed: ${JSON.stringify(err)}`);
}

export async function saveClientProfile(formData: FormData) {
  const { supabase, user } = await requireRole(["CLIENT", "ADMIN"]);

  const display_name = clean(formData.get("display_name"));
  const phone = clean(formData.get("phone"));
  const address_line1 = clean(formData.get("address_line1"));
  const address_line2 = clean(formData.get("address_line2"));
  const address_city = clean(formData.get("address_city"));
  const address_state = clean(formData.get("address_state"));
  const address_zip = clean(formData.get("address_zip"));

  const { error } = await supabase
      .from("profiles")
      .update({
        display_name,
        phone,
        address_line1,
        address_line2,
        address_city,
        address_state,
        address_zip,
      })
      .eq("id", user.id);

  if (error) throw wrapErr("saveClientProfile", error);

  revalidatePath("/dashboard/client/profile");
}