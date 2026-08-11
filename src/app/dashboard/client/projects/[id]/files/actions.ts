"use server";

import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { sendRfiInfoUpdateEmail } from "@/lib/email";
import { validateFile, uploadOneFile, removeUploadedFiles } from "./fileValidation";

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

  const { error: insertErr } = await supabaseAdmin.from("project_attachments").insert({
    project_id: projectId,
    storage_object_key: uploaded.key,
    original_filename: uploaded.originalFilename,
    mime_type: uploaded.mimeType,
    file_size_bytes: uploaded.sizeBytes,
    uploaded_by: user.id,
    related_rfi_id: null,
    // information_revision_number intentionally omitted -- the
    // project_attachments_stamp_and_bump trigger computes it.
  });

  if (insertErr) {
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
