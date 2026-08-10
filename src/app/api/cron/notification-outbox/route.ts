import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  sendRfiAnsweredEmail,
  sendRfiInfoUpdateEmail,
  sendBidIneligibleEmail,
} from "@/lib/email";

/**
 * Vercel Cron — runs once daily (07:00 UTC).
 *
 * Intended cadence is hourly; this is temporarily once-daily because the
 * Vercel plan in use (Hobby) only permits daily cron schedules. Upgrade
 * vercel.json's schedule back to hourly ("0 * * * *") once ONP moves to
 * Vercel Pro or another scheduler capable of sub-daily execution.
 *
 * This delay affects ONLY notification delivery timing:
 * - Bid eligibility itself is immediate and DB-enforced (the
 *   acknowledged_information_revision vs. projects.information_revision_number
 *   comparison, checked live by the client bid list and by award_project_bid)
 *   -- it does not depend on this cron running at all.
 * - A stale bid becomes non-awardable the instant the deadline passes,
 *   regardless of when this cron next runs.
 * - What's delayed is only the contractor's "your bid was not eligible"
 *   email and any RFI-notification retries queued after a failed
 *   synchronous send -- those may now arrive up to ~24h later instead of
 *   ~1h. Deadlines/extensions are never altered to compensate for this.
 *
 * Two jobs, sharing one durable/retryable delivery mechanism
 * (notification_outbox):
 *
 * 1. Detect newly-ineligible bids: projects whose deadline has passed while
 *    still OPEN, where the latest bid_versions row's acknowledged
 *    information revision no longer matches the project's live one (or was
 *    never affirmed). Queues one outbox row per such bid, if not already
 *    queued.
 *
 * 2. Process every unsent notification_outbox row (this covers the
 *    ineligibility rows just queued above, plus any RFI-answered /
 *    RFI-info-update rows that failed their synchronous send attempt in
 *    respondToRfi). sent_at is only ever set after a successful send --
 *    a failed send leaves the row unsent for the next run to retry.
 *    bids.ineligibility_notified_at is likewise only set after the
 *    ineligibility email actually succeeds, so a failed send is retried,
 *    not silently marked done.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  let queued = 0;
  const queueErrors: string[] = [];

  try {
    // --- Job 1: queue ineligibility notifications ---
    const { data: expiredProjects, error: projErr } = await supabaseAdmin
      .from("projects")
      .select("id, title, information_revision_number")
      .eq("state", "OPEN")
      .lte("deadline_at", now.toISOString());

    if (projErr) {
      console.error("notification-outbox: failed to fetch expired projects", projErr);
    } else {
      for (const project of expiredProjects ?? []) {
        try {
          const { data: bidRows } = await supabaseAdmin
            .from("bids")
            .select("id, contractor_id, ineligibility_notified_at")
            .eq("project_id", project.id)
            .is("ineligibility_notified_at", null);

          if (!bidRows || bidRows.length === 0) continue;

          const bidIds = bidRows.map((b) => b.id);
          const { data: versionRows } = await supabaseAdmin
            .from("bid_versions")
            .select("bid_id, version_number, acknowledged_information_revision, acknowledgment_affirmed")
            .in("bid_id", bidIds)
            .order("version_number", { ascending: false });

          const latestByBid = new Map<string, any>();
          (versionRows ?? []).forEach((v) => {
            if (!latestByBid.has(v.bid_id)) latestByBid.set(v.bid_id, v);
          });

          const staleBidIds = bidIds.filter((id) => {
            const v = latestByBid.get(id);
            if (!v) return false;
            return !(
              v.acknowledgment_affirmed === true &&
              v.acknowledged_information_revision === project.information_revision_number
            );
          });

          if (staleBidIds.length === 0) continue;

          const { data: alreadyQueued } = await supabaseAdmin
            .from("notification_outbox")
            .select("bid_id")
            .eq("kind", "bid_ineligible")
            .in("bid_id", staleBidIds);

          const alreadyQueuedIds = new Set((alreadyQueued ?? []).map((r) => r.bid_id));

          for (const bidId of staleBidIds) {
            if (alreadyQueuedIds.has(bidId)) continue;
            const bidRow = bidRows.find((b) => b.id === bidId);
            if (!bidRow) continue;

            const { error: insErr } = await supabaseAdmin.from("notification_outbox").insert({
              kind: "bid_ineligible",
              project_id: project.id,
              bid_id: bidId,
              recipient_contractor_id: bidRow.contractor_id,
              payload: { project_title: project.title },
            });

            if (insErr) {
              queueErrors.push(`${bidId}: ${insErr.message}`);
            } else {
              queued++;
            }
          }
        } catch (e: any) {
          queueErrors.push(`project ${project.id}: ${e?.message ?? e}`);
        }
      }
    }

    // --- Job 2: process unsent outbox rows (all kinds) ---
    const { data: unsent, error: unsentErr } = await supabaseAdmin
      .from("notification_outbox")
      .select("id, kind, project_id, bid_id, recipient_contractor_id, payload, attempt_count")
      .is("sent_at", null)
      .order("created_at", { ascending: true })
      .limit(200);

    if (unsentErr) {
      console.error("notification-outbox: failed to fetch unsent rows", unsentErr);
      return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
    }

    let sent = 0;
    let failed = 0;

    for (const row of unsent ?? []) {
      try {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(
          row.recipient_contractor_id
        );
        const email = authUser?.user?.email;
        if (!email) throw new Error("No email on file for recipient");

        const payload = (row.payload ?? {}) as Record<string, any>;

        if (row.kind === "rfi_answered_asker") {
          await sendRfiAnsweredEmail({
            contractorEmail: email,
            projectTitle: payload.project_title ?? "Project",
            question: payload.question ?? "Your question",
            response: payload.response ?? "",
            projectId: row.project_id,
          });
        } else if (row.kind === "rfi_info_update") {
          await sendRfiInfoUpdateEmail({
            contractorEmail: email,
            projectTitle: payload.project_title ?? "Project",
            deadlineAt: payload.deadline_at ?? now.toISOString(),
            projectId: row.project_id,
          });
        } else if (row.kind === "bid_ineligible") {
          await sendBidIneligibleEmail({
            contractorEmail: email,
            projectTitle: payload.project_title ?? "Project",
          });
        } else {
          throw new Error(`Unknown notification kind: ${row.kind}`);
        }

        const sentAt = new Date().toISOString();
        await supabaseAdmin
          .from("notification_outbox")
          .update({ sent_at: sentAt, attempt_count: (row.attempt_count ?? 0) + 1, last_attempt_at: sentAt })
          .eq("id", row.id);

        // Only stamp bids.ineligibility_notified_at once the email has
        // actually succeeded -- a failed send must remain retryable.
        if (row.kind === "bid_ineligible" && row.bid_id) {
          await supabaseAdmin
            .from("bids")
            .update({ ineligibility_notified_at: sentAt })
            .eq("id", row.bid_id);
        }

        sent++;
      } catch (e: any) {
        failed++;
        await supabaseAdmin
          .from("notification_outbox")
          .update({
            attempt_count: (row.attempt_count ?? 0) + 1,
            last_attempt_at: new Date().toISOString(),
            last_error: String(e?.message ?? e),
          })
          .eq("id", row.id);
      }
    }

    return NextResponse.json({
      queued,
      queueErrors,
      sent,
      failed,
      timestamp: now.toISOString(),
    });
  } catch (err) {
    console.error("notification-outbox handler error:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
}
