"use server";

import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function setFeatureFlag(key: string, value: boolean) {
  await requireRole(["ADMIN"]);

  const { error } = await supabaseAdmin
    .from("platform_settings")
    .upsert({ key, value: value ? "true" : "false", updated_at: new Date().toISOString() }, { onConflict: "key" });

  if (error) throw new Error(`setFeatureFlag failed: ${JSON.stringify(error)}`);

  revalidatePath("/dashboard/admin/settings");
  revalidatePath("/dashboard/admin");
}
