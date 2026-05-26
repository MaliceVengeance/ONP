import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  sendDisputeSlaReminderEmail,
  sendDisputeSlaEscalationEmail,
} from "@/lib/email";

/**
 * Vercel Cron — runs daily at 09:00 UTC.
 * Checks open disputes for SLA violations:
 *   - Day 3: sends a reminder to the assigned Master Inspector
 *   - Day 5: sends an escalation to the MI + all admins
 *
 * Uses sla_day3_sent_at / sla_day5_sent_at columns on inspector_upgrade_disputes
 * to guarantee each notice is sent at most once per dispute.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  // "5 business days" treated as 5 calendar days for simplicity
  const day3Cutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const day5Cutoff = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();

  // ── Day-3 reminders ────────────────────────────────────────────────────────
  const { data: day3Disputes } = await supabaseAdmin
    .from("inspector_upgrade_disputes")
    .select("id, project_id, master_inspector_id, assigned_at")
    .in("status", ["SUBMITTED", "UNDER_REVIEW"])
    .not("master_inspector_id", "is", null)
    .lte("assigned_at", day3Cutoff)
    .is("sla_day3_sent_at", null); // not yet reminded

  let reminders = 0;

  for (const d of day3Disputes ?? []) {
    const dispute = d as any;
    try {
      const [{ data: project }, { data: miAuth }] = await Promise.all([
        supabaseAdmin.from("projects").select("title").eq("id", dispute.project_id).single(),
        supabaseAdmin.auth.admin.getUserById(dispute.master_inspector_id),
      ]);

      const miEmail = miAuth?.user?.email;
      if (!miEmail) continue;

      const assignedAt  = new Date(dispute.assigned_at);
      const daysAssigned = Math.floor((now.getTime() - assignedAt.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, 5 - daysAssigned);

      await sendDisputeSlaReminderEmail({
        masterInspectorEmail: miEmail,
        projectTitle: (project as any)?.title ?? "A Project",
        disputeId: dispute.id,
        daysAssigned,
        daysRemaining,
      });

      // Mark reminder sent
      await supabaseAdmin
        .from("inspector_upgrade_disputes")
        .update({ sla_day3_sent_at: now.toISOString() })
        .eq("id", dispute.id);

      reminders++;
    } catch (e) {
      console.error(`Day-3 reminder failed for dispute ${dispute.id}:`, e);
    }
  }

  // ── Day-5 escalations ──────────────────────────────────────────────────────
  const { data: day5Disputes } = await supabaseAdmin
    .from("inspector_upgrade_disputes")
    .select("id, project_id, master_inspector_id, assigned_at")
    .in("status", ["SUBMITTED", "UNDER_REVIEW"])
    .not("master_inspector_id", "is", null)
    .lte("assigned_at", day5Cutoff)
    .is("sla_day5_sent_at", null); // not yet escalated

  let escalations = 0;

  // Fetch admin profiles once
  const { data: adminProfiles } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("role", "ADMIN");

  for (const d of day5Disputes ?? []) {
    const dispute = d as any;
    try {
      const [{ data: project }, { data: miAuth }] = await Promise.all([
        supabaseAdmin.from("projects").select("title").eq("id", dispute.project_id).single(),
        supabaseAdmin.auth.admin.getUserById(dispute.master_inspector_id),
      ]);

      const miEmail    = miAuth?.user?.email ?? null;
      const projTitle  = (project as any)?.title ?? "A Project";

      for (const admin of adminProfiles ?? []) {
        const { data: adminAuth } = await supabaseAdmin.auth.admin.getUserById(
          (admin as any).id
        );
        const adminEmail = adminAuth?.user?.email;
        if (!adminEmail) continue;

        await sendDisputeSlaEscalationEmail({
          masterInspectorEmail: miEmail,
          adminEmail,
          projectTitle: projTitle,
          disputeId: dispute.id,
        });
      }

      // Mark escalation sent
      await supabaseAdmin
        .from("inspector_upgrade_disputes")
        .update({ sla_day5_sent_at: now.toISOString() })
        .eq("id", dispute.id);

      escalations++;
    } catch (e) {
      console.error(`Day-5 escalation failed for dispute ${dispute.id}:`, e);
    }
  }

  console.log(`Dispute SLA cron: ${reminders} reminders, ${escalations} escalations`);
  return NextResponse.json({ reminders, escalations });
}
