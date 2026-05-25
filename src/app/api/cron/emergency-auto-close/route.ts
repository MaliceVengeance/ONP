import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Vercel Cron — runs every 5 minutes.
 * Finds emergency projects whose 8-hour window has expired and closes them.
 *
 * Protect with CRON_SECRET env var. Vercel sets Authorization: Bearer <secret>
 * automatically when invoking cron routes.
 */
export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sets this header automatically in prod)
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  try {
    // Find all open emergency projects whose auto-close time has passed
    const { data: expiredProjects, error: fetchErr } = await supabaseAdmin
      .from("projects")
      .select("id, title")
      .eq("is_emergency", true)
      .eq("state", "OPEN")
      .lte("emergency_auto_close_at", now.toISOString());

    if (fetchErr) {
      console.error("Emergency auto-close fetch error:", fetchErr);
      return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
    }

    if (!expiredProjects || expiredProjects.length === 0) {
      return NextResponse.json({ closed: 0, message: "Nothing to close" });
    }

    const results: Array<{ id: string; title: string | null; reason: string; ok: boolean }> = [];

    for (const project of expiredProjects) {
      try {
        const projectId = project.id;

        // Determine close reason
        const { count: bidCount } = await supabaseAdmin
          .from("bids")
          .select("id", { count: "exact", head: true })
          .eq("project_id", projectId);

        const { data: awardRow } = await supabaseAdmin
          .from("project_awards")
          .select("id")
          .eq("project_id", projectId)
          .maybeSingle();

        const hasAward = !!awardRow;
        const hasBids = (bidCount ?? 0) > 0;

        const closeReason = hasAward
          ? "AWARDED"
          : hasBids
          ? "AUTO_CLOSED"
          : "NO_BIDS";

        // Set project state to EMERGENCY_EXPIRED
        const { error: projErr } = await supabaseAdmin
          .from("projects")
          .update({
            state: "EMERGENCY_EXPIRED",
            updated_at: now.toISOString(),
          })
          .eq("id", projectId)
          .eq("state", "OPEN");

        if (projErr) {
          console.error(`Failed to expire project ${projectId}:`, projErr);
          results.push({ id: projectId, title: project.title, reason: closeReason, ok: false });
          continue;
        }

        // Update the emergency log row
        const logUpdate: Record<string, unknown> = {
          closed_at: now.toISOString(),
          close_reason: closeReason,
        };

        // If no bids were ever received, don't penalize the client's rate limit
        if (closeReason === "NO_BIDS") {
          logUpdate.counts_against_limit = false;
        }

        await supabaseAdmin
          .from("emergency_request_log")
          .update(logUpdate)
          .eq("project_id", projectId)
          .eq("payment_status", "PAID");

        console.log(`Emergency project ${projectId} closed: ${closeReason}`);
        results.push({ id: projectId, title: project.title, reason: closeReason, ok: true });
      } catch (err) {
        console.error(`Error processing project ${project.id}:`, err);
        results.push({ id: project.id, title: project.title, reason: "ERROR", ok: false });
      }
    }

    const closed = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok).length;

    return NextResponse.json({
      closed,
      failed,
      results,
      timestamp: now.toISOString(),
    });
  } catch (err) {
    console.error("Emergency auto-close handler error:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
}
