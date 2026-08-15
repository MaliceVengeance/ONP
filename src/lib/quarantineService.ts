import { createHash } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { toUploadBody } from "@/app/dashboard/client/projects/[id]/files/uploadPipeline";

const SOURCE_BUCKET = "project-files";
const QUARANTINE_BUCKET = "quarantined-attachments";

/**
 * Opaque, deterministic quarantine key -- {attachment_id}.{ext}. No original
 * filename fragment: the filename already lives in project_attachments.
 * original_filename (client/admin-readable there), and a Storage key is not
 * the right place for it -- keys can leak through logs, browser history, or
 * Storage-provider tooling in ways the DB column doesn't. Deterministic so a
 * retry re-targets the same object instead of littering orphaned copies.
 */
export function quarantineKeyFor(attachmentId: string, mimeType: string): string {
  const ext = extensionForMimeType(mimeType);
  return `${attachmentId}.${ext}`;
}

function extensionForMimeType(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "text/plain": "txt",
  };
  return map[mimeType] ?? "bin";
}

export type QuarantineResult =
  | { ok: true }
  | { ok: false; step: "download" | "upload" | "verify" | "delete_original" | "finalize"; message: string };

/**
 * The post-transaction sensitive-removal sequence (design v3, section 1):
 * download original -> upload to quarantine (deterministic key) -> verify
 * SHA-256 + byte length -> delete original -> finalize_sensitive_removal RPC
 * (SENSITIVE_REMOVAL_PENDING -> SENSITIVE_REMOVED, stamps
 * original_object_deleted_at). Every step is safely retryable from scratch:
 * nothing destructive happens until the delete-original step, and that step
 * only runs after the quarantine copy is verified byte-for-byte identical to
 * the source. Never reverts attachment_status back to ACTIVE on any failure
 * -- a failure here just leaves the row in SENSITIVE_REMOVAL_PENDING for the
 * cleanup cron (or an immediate retry) to pick up again.
 */
export async function runQuarantineSequence(params: {
  attachmentId: string;
  storageObjectKey: string;
  mimeType: string;
}): Promise<QuarantineResult> {
  const { attachmentId, storageObjectKey, mimeType } = params;
  const quarantineKey = quarantineKeyFor(attachmentId, mimeType);

  const { data: downloaded, error: dlErr } = await supabaseAdmin.storage
    .from(SOURCE_BUCKET)
    .download(storageObjectKey);
  if (dlErr || !downloaded) {
    // Original object may already be gone from a prior successful run of
    // this same sequence that failed only at the finalize step -- in that
    // case, go straight to finalize (idempotent: matches only
    // SENSITIVE_REMOVAL_PENDING rows).
    return finalizeIfAlreadyQuarantined(attachmentId, quarantineKey, dlErr);
  }
  const sourceBuffer = Buffer.from(await downloaded.arrayBuffer());
  const sourceHash = createHash("sha256").update(sourceBuffer).digest("hex");

  const { error: upErr } = await supabaseAdmin.storage
    .from(QUARANTINE_BUCKET)
    .upload(quarantineKey, toUploadBody(sourceBuffer), {
      contentType: mimeType || undefined,
      upsert: true, // deterministic key: a retry re-uploads to the same target
    });
  if (upErr) {
    return { ok: false, step: "upload", message: JSON.stringify(upErr) };
  }

  const { data: verifyDownload, error: verifyErr } = await supabaseAdmin.storage
    .from(QUARANTINE_BUCKET)
    .download(quarantineKey);
  if (verifyErr || !verifyDownload) {
    return { ok: false, step: "verify", message: JSON.stringify(verifyErr) };
  }
  const verifyBuffer = Buffer.from(await verifyDownload.arrayBuffer());
  const verifyHash = createHash("sha256").update(verifyBuffer).digest("hex");

  if (verifyBuffer.length !== sourceBuffer.length || verifyHash !== sourceHash) {
    // Do NOT delete the original -- integrity check failed, nothing
    // destructive happens. Best-effort discard the bad quarantine copy so a
    // retry doesn't compare against corrupt data; harmless if this fails,
    // since the bucket has no contractor policy regardless.
    await supabaseAdmin.storage.from(QUARANTINE_BUCKET).remove([quarantineKey]).catch(() => {});
    return {
      ok: false,
      step: "verify",
      message: `Hash/size mismatch: source ${sourceBuffer.length}b/${sourceHash} vs quarantine ${verifyBuffer.length}b/${verifyHash}`,
    };
  }

  const { error: removeErr } = await supabaseAdmin.storage.from(SOURCE_BUCKET).remove([storageObjectKey]);
  if (removeErr) {
    return { ok: false, step: "delete_original", message: JSON.stringify(removeErr) };
  }

  return finalize(attachmentId, quarantineKey);
}

async function finalize(attachmentId: string, quarantineKey: string): Promise<QuarantineResult> {
  const { data, error } = await supabaseAdmin.rpc("finalize_sensitive_removal", {
    p_attachment_id: attachmentId,
    p_quarantine_storage_key: quarantineKey,
  });
  if (error) {
    return { ok: false, step: "finalize", message: JSON.stringify(error) };
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (row && row.ok === false && row.already_finalized) {
    return { ok: true }; // idempotent no-op: already completed by a prior run
  }
  return { ok: true };
}

async function finalizeIfAlreadyQuarantined(
  attachmentId: string,
  quarantineKey: string,
  originalDownloadError: unknown
): Promise<QuarantineResult> {
  const { data: existsInQuarantine } = await supabaseAdmin.storage
    .from(QUARANTINE_BUCKET)
    .list("", { search: quarantineKey });
  const found = (existsInQuarantine ?? []).some((o) => o.name === quarantineKey);
  if (found) {
    return finalize(attachmentId, quarantineKey);
  }
  return { ok: false, step: "download", message: JSON.stringify(originalDownloadError) };
}
