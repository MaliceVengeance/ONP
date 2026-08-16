"use server";

import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { sendRfiInfoUpdateEmail } from "@/lib/email";
import { validateFile, uploadOneFile, removeUploadedFiles } from "./fileValidation";
import { runQuarantineSequence } from "@/lib/quarantineService";

/**
 * Standalone file upload (client "Files" page, not tied to answering a
 * specific RFI). Ownership/state are read fresh from the RLS-bound client
 * before anything else -- project_id and uploaded_by are never trusted from
 * the caller. A revision bump / deadline-extension check / bidder
 * notification only happen when the project is OPEN at the moment of this
 * request; the DB trigger independently enforces the same state condition
 * for the revision counter itself, so the two can never disagree.
 */
export async function uploadProjectFile(projectId: string, formData: FormData) {
  const { supabase, user } = await requireRole(["CLIENT", "ADMIN"]);

  const { data: project } = await supabase
    .from("projects")
    .select("id, state")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) throw new Error("Project not found or you don't have access to it.");

  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Choose a file to upload.");

  const validationError = validateFile(file);
  if (validationError) throw new Error(validationError);

  const uploaded = await uploadOneFile(projectId, file);

  const { data: insertedAttachment, error: insertErr } = await supabaseAdmin
    .from("project_attachments")
    .insert({
      project_id: projectId,
      storage_object_key: uploaded.key,
      original_filename: uploaded.originalFilename,
      mime_type: uploaded.mimeType,
      file_size_bytes: uploaded.sizeBytes,
      uploaded_by: user.id,
      related_rfi_id: null,
      // information_revision_number intentionally omitted -- the
      // project_attachments_stamp_and_bump trigger computes it.
    })
    .select("id")
    .single();

  if (insertErr || !insertedAttachment) {
    // DB write failed after a successful Storage upload -- clean up eagerly
    // rather than leaving an orphan for the (separately scheduled) sweep,
    // since this failure mode is synchronous and immediately known.
    await removeUploadedFiles([uploaded.key]);
    throw new Error(`project_attachments.insert failed: ${JSON.stringify(insertErr)}`);
  }

  if (project.state === "OPEN") {
    try {
      await supabaseAdmin.rpc("apply_rfi_deadline_extension", { p_project_id: projectId });
    } catch (e) {
      console.error("Deadline extension check failed (standalone file upload):", e);
    }

    try {
      await notifyCurrentBidders(projectId);
    } catch (e) {
      console.error("Bidder notification dispatch failed (standalone file upload):", e);
    }
  }

  revalidatePath(`/dashboard/client/projects/${projectId}/files`);

  return { attachmentId: insertedAttachment.id as string };
}

async function notifyCurrentBidders(projectId: string) {
  const { data: projectRow } = await supabaseAdmin
    .from("projects")
    .select("title, deadline_at")
    .eq("id", projectId)
    .single();
  const projectTitle = projectRow?.title ?? "Project";
  const deadlineIso = projectRow?.deadline_at ?? new Date().toISOString();

  const { data: bidRows } = await supabaseAdmin
    .from("bids")
    .select("contractor_id")
    .eq("project_id", projectId);
  const bidderIds = Array.from(new Set((bidRows ?? []).map((b) => b.contractor_id as string)));

  for (const contractorId of bidderIds) {
    const { data: outboxRow, error: insErr } = await supabaseAdmin
      .from("notification_outbox")
      .insert({
        kind: "file_info_update",
        project_id: projectId,
        recipient_contractor_id: contractorId,
        payload: { project_title: projectTitle, deadline_at: deadlineIso },
      })
      .select("id")
      .single();
    if (insErr || !outboxRow) {
      console.error("Failed to queue file_info_update notification:", insErr);
      continue;
    }
    try {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(contractorId);
      const email = authUser?.user?.email;
      if (!email) throw new Error("No email on file for recipient");
      await sendRfiInfoUpdateEmail({ contractorEmail: email, projectTitle, deadlineAt: deadlineIso, projectId });
      await supabaseAdmin
        .from("notification_outbox")
        .update({ sent_at: new Date().toISOString(), attempt_count: 1, last_attempt_at: new Date().toISOString() })
        .eq("id", outboxRow.id);
    } catch (e: any) {
      await supabaseAdmin
        .from("notification_outbox")
        .update({ attempt_count: 1, last_attempt_at: new Date().toISOString(), last_error: String(e?.message ?? e) })
        .eq("id", outboxRow.id);
    }
  }
}

/**
 * DRAFT-only delete. Storage RLS is the real backstop for every other
 * state (see migration 025) -- this action additionally keeps the metadata
 * row and the Storage object in sync, which a raw browser Storage.remove()
 * call could never do.
 */
export async function deleteProjectFile(projectId: string, attachmentId: string) {
  const { supabase } = await requireRole(["CLIENT", "ADMIN"]);

  const { data: project } = await supabase
    .from("projects")
    .select("id, state")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) throw new Error("Project not found or you don't have access to it.");
  if (project.state !== "DRAFT") {
    throw new Error("Files can only be removed while the project is still a draft.");
  }

  const { data: attachment } = await supabaseAdmin
    .from("project_attachments")
    .select("id, storage_object_key")
    .eq("id", attachmentId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (!attachment) throw new Error("File not found.");

  const { error: removeErr } = await supabaseAdmin.storage
    .from("project-files")
    .remove([attachment.storage_object_key]);
  if (removeErr) throw new Error(`storage.remove failed: ${JSON.stringify(removeErr)}`);

  const { error: deleteErr } = await supabaseAdmin
    .from("project_attachments")
    .delete()
    .eq("id", attachmentId);
  if (deleteErr) throw new Error(`project_attachments.delete failed: ${JSON.stringify(deleteErr)}`);

  revalidatePath(`/dashboard/client/projects/${projectId}/files`);
}

/**
 * Withdraw a published (non-DRAFT) file, ordinary or sensitive. All the
 * exactly-once machinery (revision bump, inline deadline evaluation,
 * notification enqueue, review/pause creation for sensitive removal) lives
 * inside the withdraw_project_attachment DB RPC (migration 028) -- this
 * action's job is authorization, calling it, and -- for sensitive removal
 * only -- kicking off the quarantine sequence (best-effort synchronous
 * attempt; the sensitive-removal-cleanup cron is the durable retry
 * backstop, mirroring the existing notification-outbox pattern).
 *
 * reasonCode = 'SENSITIVE_INFO' always routes to the sensitive path
 * regardless of what the caller passes as `action` -- the UI should already
 * enforce this, but the server action does not trust the client's routing
 * choice for a decision with this much consequence.
 */
export async function withdrawProjectFile(
  projectId: string,
  attachmentId: string,
  reasonCode: string,
  reasonOtherText: string | null,
  isHighRisk: boolean = false
) {
  const { supabase, user } = await requireRole(["CLIENT", "ADMIN"]);

  const { data: project } = await supabase
    .from("projects")
    .select("id, state")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) throw new Error("Project not found or you don't have access to it.");
  if (project.state === "DRAFT") {
    throw new Error("Draft files should be deleted, not withdrawn.");
  }

  const { data: attachment } = await supabaseAdmin
    .from("project_attachments")
    .select("id, project_id, mime_type, storage_object_key")
    .eq("id", attachmentId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (!attachment) throw new Error("File not found.");

  const action = reasonCode === "SENSITIVE_INFO" ? "SENSITIVE_REMOVE" : "WITHDRAW";

  const { data, error } = await supabaseAdmin.rpc("withdraw_project_attachment", {
    p_attachment_id: attachmentId,
    p_action: action,
    p_reason_code: reasonCode,
    p_reason_other_text: reasonOtherText,
    // From requireRole()'s authenticated session -- never from client-
    // submitted form data. Re-validated independently inside the RPC
    // itself against live database state, not trusted at face value.
    p_actor_id: user.id,
    p_is_high_risk: isHighRisk,
  });
  if (error) throw new Error(`withdraw_project_attachment failed: ${JSON.stringify(error)}`);

  const result = Array.isArray(data) ? data[0] : data;
  if (!result?.ok && !result?.already_handled) {
    throw new Error("Withdrawal did not complete.");
  }

  if (action === "SENSITIVE_REMOVE" && result?.ok) {
    // Best-effort, synchronous attempt. Contractor access is ALREADY denied
    // at this point (the RPC's DB transaction already committed the
    // SENSITIVE_REMOVAL_PENDING status, and the object-aware Storage helper
    // checks that live status, not object existence) -- this call is only
    // about relocating the bytes and closing the already-issued-signed-URL
    // gap. Any failure here is not user-facing; the cleanup cron retries.
    // finalize_sensitive_removal (called inside runQuarantineSequence) is
    // also what clears bidding_paused_at if the client's decision was
    // already recorded before quarantine finished -- nothing further to do
    // here either way.
    try {
      await runQuarantineSequence({
        attachmentId,
        storageObjectKey: attachment.storage_object_key,
        mimeType: attachment.mime_type,
      });
    } catch (e) {
      console.error("Quarantine sequence failed synchronously, cleanup cron will retry:", e);
    }
  }

  revalidatePath(`/dashboard/client/projects/${projectId}/files`);

  return {
    action,
    reviewId: (result?.review_id as string | undefined) ?? null,
  };
}

/**
 * The client's own routine decision after a sensitive removal: does the
 * file contain information contractors still need? Handles NOT_NEEDED and
 * REPLACEMENT_UPLOADED entirely self-service (no admin involvement) via
 * resolve_sensitive_removal_client_decision, which independently re-derives
 * everything it needs from live database state -- this action's job is
 * just authorization and forwarding. UNSURE flips the review to admin-
 * actionable without clearing the pause; the admin queue picks it up from
 * there via the existing resolve_bidding_pause path, unchanged.
 */
export async function resolveSensitiveRemovalClientDecision(
  projectId: string,
  reviewId: string,
  decision: "NOT_NEEDED" | "REPLACEMENT_UPLOADED" | "UNSURE",
  replacementAttachmentId: string | null
) {
  const { user } = await requireRole(["CLIENT", "ADMIN"]);

  const { data, error } = await supabaseAdmin.rpc("resolve_sensitive_removal_client_decision", {
    p_project_id: projectId,
    p_review_id: reviewId,
    p_actor_id: user.id,
    p_decision: decision,
    p_replacement_attachment_id: replacementAttachmentId,
  });
  if (error) throw new Error(`resolve_sensitive_removal_client_decision failed: ${JSON.stringify(error)}`);

  const result = Array.isArray(data) ? data[0] : data;
  if (!result?.ok && !result?.already_handled) {
    throw new Error("Could not record your decision.");
  }

  revalidatePath(`/dashboard/client/projects/${projectId}/files`);

  return {
    alreadyHandled: !!result?.already_handled,
    newStatus: result?.new_status as string | null,
    pauseCleared: !!result?.pause_cleared,
  };
}
