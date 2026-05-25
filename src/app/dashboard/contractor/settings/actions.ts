"use server";

import { requireRole } from "@/lib/auth/requireRole";
import { redirect } from "next/navigation";

export async function saveContractorSettings(formData: FormData) {
  const { supabase, user } = await requireRole(["CONTRACTOR", "ADMIN"]);

  const emergencyNotificationsEnabled =
    formData.get("emergency_notifications_enabled") === "on";

  const { error } = await supabase
    .from("contractor_settings")
    .upsert(
      {
        contractor_id: user.id,
        emergency_notifications_enabled: emergencyNotificationsEnabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "contractor_id" }
    );

  if (error) throw new Error(`Settings save failed: ${JSON.stringify(error)}`);

  redirect("/dashboard/contractor/settings?saved=1");
}
