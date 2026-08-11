import { randomUUID } from "crypto";
import sharp from "sharp";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const MAX_FILE_BYTES = 10 * 1024 * 1024;

// Extension -> accepted MIME types. Extension is checked first and is the
// primary gate (reliable, not spoofed by client-side "accept" hints); the
// MIME cross-check only rejects an implausible combination when the browser
// actually reported a specific, meaningful type. DWG/DXF MIME reporting is
// inconsistent across browsers/OS, so those two rely on extension alone.
export const ALLOWED_EXTENSIONS: Record<string, string[] | null> = {
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  webp: ["image/webp"],
  heic: ["image/heic", "image/heif"],
  heif: ["image/heic", "image/heif"],
  gif: ["image/gif"],
  pdf: ["application/pdf"],
  doc: ["application/msword"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  xls: ["application/vnd.ms-excel"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  txt: ["text/plain"],
  dwg: null, // no reliable MIME across browsers -- extension only
  dxf: null,
};

export function validateFile(file: File): string | null {
  if (file.size === 0) return `${file.name} is empty.`;
  if (file.size > MAX_FILE_BYTES) return `${file.name} is too large. Maximum file size is 10MB.`;

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!(ext in ALLOWED_EXTENSIONS)) {
    return `${file.name} is not an accepted file type. Allowed: images, PDF, Word/Excel documents, text, DWG/DXF.`;
  }
  const allowedMimes = ALLOWED_EXTENSIONS[ext];
  if (allowedMimes && file.type && !allowedMimes.includes(file.type)) {
    return `${file.name} does not match its file extension.`;
  }
  return null;
}

// sharp supports HEIC/HEIF input only when built with libheif, which is not
// guaranteed present in the deployed environment. Rather than risk an
// unhandled sharp failure on every phone photo in that format, HEIC/HEIF
// files are stored as-is (EXIF/GPS NOT stripped for this format) and this
// is surfaced via this explicit allowlist rather than attempting and
// silently failing.
const EXIF_STRIP_SUPPORTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

async function stripExifIfSupported(buffer: Buffer, mimeType: string): Promise<Buffer> {
  if (!EXIF_STRIP_SUPPORTED_TYPES.has(mimeType)) return buffer;
  return sharp(buffer).rotate().toBuffer();
}

export type UploadResult = { key: string; originalFilename: string; mimeType: string; sizeBytes: number };

export async function uploadOneFile(projectId: string, file: File): Promise<UploadResult> {
  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const outputBuffer = await stripExifIfSupported(inputBuffer, file.type);

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const key = `${projectId}/${randomUUID()}.${ext}`;

  const { error: uploadErr } = await supabaseAdmin.storage
    .from("project-files")
    .upload(key, outputBuffer, { contentType: file.type || undefined });
  if (uploadErr) throw new Error(`storage.upload(project_file) failed: ${JSON.stringify(uploadErr)}`);

  return { key, originalFilename: file.name, mimeType: file.type || "application/octet-stream", sizeBytes: file.size };
}

export async function removeUploadedFiles(keys: string[]) {
  if (keys.length === 0) return;
  await supabaseAdmin.storage.from("project-files").remove(keys);
}
