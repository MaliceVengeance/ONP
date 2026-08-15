import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { runQuarantineSequence } from "@/lib/quarantineService";

/**
 * Vercel Cron — runs hourly.
 * Drives any project_attachments row stuck in SENSITIVE_REMOVAL_PENDING to
 * completion (SENSITIVE_REMOVED). A row can be stuck at any step of the
 * quarantine sequence (download/upload/verify/delete-original/finalize) --
 * every step is safely re-runnable from scratch, so this just re-invokes
 * the same sequence used at the moment of removal.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: pending, error: fetchErr } = await supabaseAdmin
    .from("project_attachments")
    .select("id, storage_object_key, mime_type")
    .eq("attachment_status", "SENSITIVE_REMOVAL_PENDING");

  if (fetchErr) {
    console.error("sensitive-removal-cleanup fetch error:", fetchErr);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }

  if (!pending || pending.length === 0) {
    return NextResponse.json({ processed: 0, message: "Nothing pending" });
  }

  const results: Array<{ id: string; ok: boolean; step?: string; message?: string }> = [];
  for (const row of pending) {
    const result = await runQuarantineSequence({
      attachmentId: row.id,
      storageObjectKey: row.storage_object_key,
      mimeType: row.mime_type,
    });
    if (result.ok) {
      results.push({ id: row.id, ok: true });
    } else {
      console.error(`sensitive-removal-cleanup: attachment ${row.id} stuck at ${result.step}: ${result.message}`);
      results.push({ id: row.id, ok: false, step: result.step, message: result.message });
    }
  }

  const completed = results.filter((r) => r.ok).length;
  const stillPending = results.filter((r) => !r.ok).length;

  return NextResponse.json({ completed, stillPending, results, timestamp: new Date().toISOString() });
}
