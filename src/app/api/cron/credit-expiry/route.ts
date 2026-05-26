import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendCreditExpiryReminderEmail } from "@/lib/email";

/**
 * Vercel Cron — runs daily at 09:00 UTC.
 * Finds AVAILABLE client credits expiring within 30 days and sends
 * a reminder email to the client. Uses expiry_reminder_sent_at to
 * ensure each credit only gets one reminder.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const window30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // Credits that expire within 30 days, haven't been reminded yet
  const { data: expiringCredits, error } = await supabaseAdmin
    .from("client_credits")
    .select("id, client_id, amount_cents, expires_at")
    .eq("status", "AVAILABLE")
    .not("expires_at", "is", null)
    .lte("expires_at", window30)
    .gt("expires_at", now.toISOString()) // not already expired
    .is("expiry_reminder_sent_at", null);

  if (error) {
    console.error("Credit expiry fetch error:", error);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }

  let sent = 0;

  for (const credit of expiringCredits ?? []) {
    const c = credit as any;
    try {
      const { data: clientAuth } = await supabaseAdmin.auth.admin.getUserById(c.client_id);
      const clientEmail = clientAuth?.user?.email;
      if (!clientEmail) continue;

      await sendCreditExpiryReminderEmail({
        clientEmail,
        amountCents: c.amount_cents as number,
        expiresAt: c.expires_at as string,
      });

      // Mark reminder sent
      await supabaseAdmin
        .from("client_credits")
        .update({ expiry_reminder_sent_at: now.toISOString() })
        .eq("id", c.id);

      sent++;
    } catch (e) {
      console.error(`Credit expiry reminder failed for credit ${c.id}:`, e);
    }
  }

  console.log(`Credit expiry cron: ${sent} reminders sent`);
  return NextResponse.json({ sent });
}
