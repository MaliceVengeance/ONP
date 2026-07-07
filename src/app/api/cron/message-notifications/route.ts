import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendProjectMessageNotificationEmail } from "@/lib/email";

/**
 * Vercel Cron — runs every hour.
 * Finds unnotified project messages older than 1 hour, groups them by project,
 * and sends a single notification email to each recipient (client + contractor)
 * who didn't send those messages. Marks messages notification_sent = true when done.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  // Fetch all unnotified messages older than 1 hour
  const { data: messages, error } = await supabaseAdmin
    .from("project_messages")
    .select("id, project_id, sender_id, sender_role, created_at")
    .eq("notification_sent", false)
    .lte("created_at", oneHourAgo)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("message-notifications cron fetch error:", error);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }

  if (!messages || messages.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // Group by project_id
  const byProject = new Map<string, typeof messages>();
  for (const msg of messages) {
    const m = msg as any;
    if (!byProject.has(m.project_id)) byProject.set(m.project_id, []);
    byProject.get(m.project_id)!.push(m);
  }

  let sent = 0;
  const notifiedIds: string[] = [];

  for (const [projectId, msgs] of byProject) {
    try {
      // Get project info (title + client_id)
      const { data: project } = await supabaseAdmin
        .from("projects")
        .select("title, client_id")
        .eq("id", projectId)
        .maybeSingle();

      if (!project) continue;

      // Get awarded contractor
      const { data: award } = await supabaseAdmin
        .from("project_awards")
        .select("contractor_id")
        .eq("project_id", projectId)
        .maybeSingle();

      if (!award) continue;

      const clientId: string = (project as any).client_id;
      const contractorId: string = (award as any).contractor_id;
      const projectTitle: string = (project as any).title ?? "Your Project";

      // Load auth info for client and contractor
      const [{ data: clientAuth }, { data: contractorAuth }] = await Promise.all([
        supabaseAdmin.auth.admin.getUserById(clientId),
        supabaseAdmin.auth.admin.getUserById(contractorId),
      ]);

      const clientEmail = clientAuth?.user?.email;
      const contractorEmail = contractorAuth?.user?.email;

      // Load display names from profiles
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, display_name")
        .in("id", [clientId, contractorId]);

      const nameFor = (id: string) => {
        const p = (profiles ?? []).find((x: any) => x.id === id);
        return (p as any)?.display_name || "ONP User";
      };

      const clientName = nameFor(clientId);
      const contractorName = nameFor(contractorId);

      // Determine unique senders among unnotified messages for this project
      // Group messages by sender to craft per-sender notifications
      const bySender = new Map<string, { role: string; count: number }>();
      for (const m of msgs) {
        const mm = m as any;
        const key = mm.sender_id;
        if (!bySender.has(key)) bySender.set(key, { role: mm.sender_role, count: 0 });
        bySender.get(key)!.count++;
      }

      for (const [senderId, { role: senderRole, count }] of bySender) {
        const senderName =
          senderRole === "CLIENT" ? clientName :
          senderRole === "CONTRACTOR" ? contractorName :
          "ONP Support";

        // Notify everyone except the sender (client + contractor, not admins)
        const recipients: Array<{ id: string; email: string; name: string; path: string }> = [];

        if (senderId !== clientId && clientEmail) {
          recipients.push({
            id: clientId,
            email: clientEmail,
            name: clientName,
            path: `/dashboard/client/projects/${projectId}`,
          });
        }
        if (senderId !== contractorId && contractorEmail) {
          recipients.push({
            id: contractorId,
            email: contractorEmail,
            name: contractorName,
            path: `/dashboard/contractor/projects/${projectId}`,
          });
        }

        for (const recipient of recipients) {
          try {
            await sendProjectMessageNotificationEmail({
              recipientEmail: recipient.email,
              recipientName: recipient.name,
              senderName,
              senderRole: senderRole as "CLIENT" | "CONTRACTOR" | "ADMIN",
              projectTitle,
              projectId,
              messageCount: count,
              dashboardPath: recipient.path,
            });
            sent++;
          } catch (emailErr) {
            console.error(
              `message-notifications: failed to email ${recipient.email} for project ${projectId}:`,
              emailErr
            );
          }
        }
      }

      // Mark all these project messages as notified
      notifiedIds.push(...msgs.map((m: any) => m.id));
    } catch (projectErr) {
      console.error(`message-notifications: error processing project ${projectId}:`, projectErr);
    }
  }

  // Batch-update notification_sent = true
  if (notifiedIds.length > 0) {
    await supabaseAdmin
      .from("project_messages")
      .update({ notification_sent: true })
      .in("id", notifiedIds);
  }

  console.log(`message-notifications cron: ${sent} emails sent, ${notifiedIds.length} messages marked`);
  return NextResponse.json({ sent, marked: notifiedIds.length });
}
