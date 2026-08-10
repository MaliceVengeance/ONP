"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { sendRfiAnsweredEmail, sendRfiInfoUpdateEmail } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase/admin";

function wrapErr(step: string, err: any) {
  return new Error(`${step} failed: ${JSON.stringify(err)}`);
}

/**
 * Queues a notification durably (notification_outbox), then makes a
 * best-effort synchronous send for immediacy. On failure the row stays
 * unsent and is retried by the hourly outbox-processing cron -- nothing is
 * silently lost, but the common case still delivers right away.
 */
async function notifyRecipient({
  kind,
  projectId,
  recipientContractorId,
  payload,
  send,
}: {
  kind: string;
  projectId: string;
  recipientContractorId: string;
  payload: Record<string, unknown>;
  send: (email: string) => Promise<unknown>;
}) {
  // payload is stored so the notification-outbox cron can reconstruct and
  // retry this send later without depending on this request's live closures.
  const { data: outboxRow, error: insErr } = await supabaseAdmin
    .from("notification_outbox")
    .insert({
      kind,
      project_id: projectId,
      recipient_contractor_id: recipientContractorId,
      payload,
    })
    .select("id")
    .single();

  if (insErr || !outboxRow) {
    console.error("Failed to queue notification:", insErr);
    return;
  }

  try {
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(
      recipientContractorId
    );
    const email = authUser?.user?.email;
    if (!email) throw new Error("No email on file for recipient");

    await send(email);

    await supabaseAdmin
      .from("notification_outbox")
      .update({ sent_at: new Date().toISOString(), attempt_count: 1, last_attempt_at: new Date().toISOString() })
      .eq("id", outboxRow.id);
  } catch (e: any) {
    // Leave sent_at NULL -- the hourly outbox-processing cron retries.
    await supabaseAdmin
      .from("notification_outbox")
      .update({
        attempt_count: 1,
        last_attempt_at: new Date().toISOString(),
        last_error: String(e?.message ?? e),
      })
      .eq("id", outboxRow.id);
  }
}

export async function respondToRfi(
  projectId: string,
  rfiId: string,
  formData: FormData
) {
  const { supabase } = await requireRole(["CLIENT", "ADMIN"]);

  const response = (formData.get("response") as string)?.trim();
  if (!response) throw new Error("Response cannot be empty.");

  // Fetch RFI details before updating
  const { data: rfi } = await supabase
    .from("rfis")
    .select("contractor_id, question, catalog_id, rfi_catalog(prompt)")
    .eq("id", rfiId)
    .single();

  // Fetch project title
  const { data: project } = await supabase
    .from("projects")
    .select("title")
    .eq("id", projectId)
    .single();

  // Record the answer. `.neq("status", "ANSWERED")` makes a retry/double-submit
  // a no-op instead of re-running side effects. This is NOT `.eq("status",
  // "SENT")` -- the "SENT" value is only the column's schema default and is
  // never actually inserted by live app code: contractor-submitted questions
  // insert status "OPEN" (src/app/dashboard/contractor/projects/[id]/rfis/actions.ts),
  // and client-side pre-answers insert status "ANSWERED" directly. Guarding
  // on the unused default would silently no-op every real contractor
  // question. The real "not after the deadline" enforcement is
  // rfis_update_client's RLS (requires project_is_open_for_bidding) --
  // Postgres raises a row-level-security error rather than silently
  // affecting zero rows when the row is visible (client owns it) but WITH
  // CHECK fails, so that's translated into a clean message below rather
  // than surfaced raw.
  let updatedRows: { id: string }[] | null = null;
  try {
    const { data, error } = await supabase
      .from("rfis")
      .update({
        response,
        responded_at: new Date().toISOString(),
        status: "ANSWERED",
      })
      .eq("id", rfiId)
      .eq("project_id", projectId)
      .neq("status", "ANSWERED")
      .select("id");

    if (error) throw error;
    updatedRows = data;
  } catch (err: any) {
    if (/row-level security/i.test(err?.message ?? "")) {
      throw new Error(
        "This question can no longer be answered — the bidding deadline has passed, or the project is closed or awarded."
      );
    }
    throw wrapErr("rfis.update", err);
  }

  if (!updatedRows || updatedRows.length === 0) {
    // Already answered (retry / double-submit) -- no duplicate side effects.
    redirect(`/dashboard/client/projects/${projectId}/rfis?saved=1`);
  }

  // projects.information_revision_number has already been advanced by the
  // rfis_bump_information_revision trigger, in the same transaction as the
  // update above.

  // Apply the standard (24h) / emergency (12h) deadline-extension rule, if
  // applicable -- a single row-locked DB function, safe under concurrent
  // RFI answers on the same project.
  let finalDeadlineAt: string | undefined;
  try {
    const { data: extendResult } = await supabaseAdmin.rpc(
      "apply_rfi_deadline_extension",
      { p_project_id: projectId }
    );
    finalDeadlineAt = (extendResult as any)?.[0]?.deadline_at;
  } catch (e) {
    console.error("Deadline extension check failed:", e);
  }

  // Notify: asker gets the existing asker-specific email; every other
  // distinct contractor who already has a bid on this project gets the
  // info-update email. Contractors who have not bid are never notified.
  try {
    const { data: bidRows } = await supabaseAdmin
      .from("bids")
      .select("contractor_id")
      .eq("project_id", projectId);

    const bidderIds = Array.from(
      new Set((bidRows ?? []).map((b) => b.contractor_id as string))
    );
    const askerId = rfi?.contractor_id ?? null;
    const otherBidderIds = bidderIds.filter((id) => id !== askerId);
    const deadlineIso = finalDeadlineAt ?? new Date().toISOString();

    const projectTitle = project?.title ?? "Project";
    const questionText =
      rfi?.question ?? (rfi?.rfi_catalog as any)?.prompt ?? "Your question";

    if (askerId) {
      await notifyRecipient({
        kind: "rfi_answered_asker",
        projectId,
        recipientContractorId: askerId,
        payload: { project_title: projectTitle, question: questionText, response },
        send: (email) =>
          sendRfiAnsweredEmail({
            contractorEmail: email,
            projectTitle,
            question: questionText,
            response,
            projectId,
          }),
      });
    }

    for (const contractorId of otherBidderIds) {
      await notifyRecipient({
        kind: "rfi_info_update",
        projectId,
        recipientContractorId: contractorId,
        payload: { project_title: projectTitle, deadline_at: deadlineIso },
        send: (email) =>
          sendRfiInfoUpdateEmail({
            contractorEmail: email,
            projectTitle,
            deadlineAt: deadlineIso,
            projectId,
          }),
      });
    }
  } catch (e) {
    console.error("RFI notification dispatch failed:", e);
  }

  redirect(`/dashboard/client/projects/${projectId}/rfis?saved=1`);
}
