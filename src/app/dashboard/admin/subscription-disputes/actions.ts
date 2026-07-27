"use server";

import { requireRole } from "@/lib/auth/requireRole";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function resolveSubscriptionDispute(disputeId: string, formData: FormData) {
  const { user } = await requireRole(["ADMIN"]);

  const note = (formData.get("note") as string | null)?.trim() || null;

  const { error } = await supabaseAdmin
    .from("subscription_disputes")
    .update({
      status: "RESOLVED",
      admin_note: note,
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
    })
    .eq("id", disputeId);
  if (error) throw new Error(`resolveSubscriptionDispute failed: ${JSON.stringify(error)}`);

  revalidatePath("/dashboard/admin/subscription-disputes");
}
