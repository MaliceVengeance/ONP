"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { isInServiceArea } from "@/lib/serviceArea/launchZips";
import { sendWaitlistExpansionEmail } from "@/lib/email";

export async function updateWaitlistNotes(id: string, notes: string) {
  await requireRole(["ADMIN"]);
  await supabaseAdmin
    .from("service_area_waitlist")
    .update({ notes })
    .eq("id", id);
  revalidatePath("/dashboard/admin/waitlist");
}

export async function notifyWaitlistByZips(formData: FormData) {
  await requireRole(["ADMIN"]);

  const zipInput = (formData.get("zips") as string | null)?.trim() ?? "";
  const subject = (formData.get("subject") as string | null)?.trim() ?? "ONP has launched in your area!";
  const bodyTemplate = (formData.get("body") as string | null)?.trim() ?? "";

  if (!zipInput || !bodyTemplate) {
    redirect("/dashboard/admin/waitlist?notify_error=missing_fields");
  }

  // Parse ZIP list — comma or newline separated
  const zips = zipInput.split(/[\s,]+/).map((z) => z.trim().replace(/\D/g, "").slice(0, 5)).filter((z) => z.length === 5);

  if (zips.length === 0) {
    redirect("/dashboard/admin/waitlist?notify_error=no_valid_zips");
  }

  // Fetch matching unnotified waitlist entries
  const { data: entries } = await supabaseAdmin
    .from("service_area_waitlist")
    .select("id, email, zip, city, state")
    .in("zip", zips)
    .is("notified_at", null);

  if (!entries || entries.length === 0) {
    redirect("/dashboard/admin/waitlist?notify_error=no_entries");
  }

  const now = new Date().toISOString();
  let sent = 0;

  for (const entry of entries) {
    try {
      await sendWaitlistExpansionEmail({
        toEmail: entry.email,
        zip: entry.zip,
        city: entry.city,
        state: entry.state,
        subject,
        body: bodyTemplate,
      });
      await supabaseAdmin
        .from("service_area_waitlist")
        .update({ notified_at: now })
        .eq("id", entry.id);
      sent++;
    } catch {
      // Continue on individual email failures
    }
  }

  redirect(`/dashboard/admin/waitlist?notified=${sent}`);
}
