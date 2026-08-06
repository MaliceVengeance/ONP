"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { isInServiceArea } from "@/lib/serviceArea/launchZips";
import { sendWaitlistExpansionEmail } from "@/lib/email";

export async function updateWaitlistNotes(id: string, notes: string): Promise<{ ok: true } | { ok: false; message: string }> {
  await requireRole(["ADMIN"]);

  const { data, error } = await supabaseAdmin
    .from("service_area_waitlist")
    .update({ notes })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(
      `[serviceArea:updateWaitlistNotes] failed to update notes id=${id} code=${error.code ?? "unknown"} message=${error.message}`
    );
    return { ok: false, message: "Failed to save notes. Please try again." };
  }

  if (!data) {
    console.error(`[serviceArea:updateWaitlistNotes] no matching waitlist row id=${id}`);
    return { ok: false, message: "Waitlist entry not found." };
  }

  revalidatePath("/dashboard/admin/waitlist");
  return { ok: true };
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

  // Fetch matching unnotified waitlist entries. A query error and a genuine
  // zero-match are distinct outcomes — conflating them would tell the admin
  // "no one to notify" when the real story is "we couldn't even check."
  const { data: entries, error: entriesError } = await supabaseAdmin
    .from("service_area_waitlist")
    .select("id, email, zip, city, state")
    .in("zip", zips)
    .is("notified_at", null);

  if (entriesError) {
    console.error(
      `[serviceArea:notifyWaitlistByZips] failed to query matching entries code=${entriesError.code ?? "unknown"} message=${entriesError.message}`
    );
    redirect("/dashboard/admin/waitlist?notify_error=query_failed");
  }

  if (!entries || entries.length === 0) {
    redirect("/dashboard/admin/waitlist?notify_error=no_entries");
  }

  const now = new Date().toISOString();
  let sent = 0;
  let failed = 0;

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

      // notified_at is only ever set after a confirmed send — a send that
      // fails must never be marked as notified.
      const { error: markError } = await supabaseAdmin
        .from("service_area_waitlist")
        .update({ notified_at: now })
        .eq("id", entry.id);

      if (markError) {
        console.error(
          `[serviceArea:notifyWaitlistByZips] email sent but failed to record notified_at id=${entry.id} code=${markError.code ?? "unknown"} message=${markError.message}`
        );
        failed++;
        continue;
      }

      sent++;
    } catch (err: any) {
      console.error(
        `[serviceArea:notifyWaitlistByZips] failed to send waitlist email id=${entry.id} zip=${entry.zip} message=${err?.message ?? "unknown"}`
      );
      failed++;
    }
  }

  redirect(`/dashboard/admin/waitlist?notified=${sent}&failed=${failed}`);
}
