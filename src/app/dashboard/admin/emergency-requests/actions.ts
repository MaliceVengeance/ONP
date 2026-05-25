"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Grant a client one additional emergency slot beyond the normal 2/30-day limit.
 * Inserts a project-less log row with admin_granted = true.
 */
export async function grantEmergencySlot(clientId: string) {
  await requireRole(["ADMIN"]);

  const { error } = await supabaseAdmin
    .from("emergency_request_log")
    .insert({
      client_id: clientId,
      project_id: null,
      payment_status: "PAID",        // doesn't block real paid rows
      charged_amount_cents: 0,
      counts_against_limit: false,   // bonus slot — not counted against used
      admin_granted: true,
    });

  if (error) throw new Error(`Grant slot failed: ${JSON.stringify(error)}`);

  revalidatePath("/dashboard/admin/emergency-requests");
}

/**
 * Unsuspend a client account that was auto-suspended due to an emergency
 * payment dispute / chargeback.
 */
export async function unsuspendClient(clientId: string) {
  await requireRole(["ADMIN"]);

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      suspended: false,
      suspended_reason: null,
    })
    .eq("id", clientId);

  if (error) throw new Error(`Unsuspend failed: ${JSON.stringify(error)}`);

  revalidatePath("/dashboard/admin/emergency-requests");
}
