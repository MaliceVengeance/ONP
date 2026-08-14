import { randomUUID, createHash } from "crypto";
import sharp from "sharp";
import { supabaseAdmin } from "@/lib/supabase/admin";

// ============================================================
// TEMPORARY DIAGNOSTIC INSTRUMENTATION -- production byte-corruption
// investigation. Logs only length/first-16-bytes-hex/SHA-256 at each
// pipeline stage, plus a server-generated correlation ID, file.size,
// file.type, the resulting Storage key, and upload/download success.
// Never logs file contents, original filename, auth tokens, cookies,
// the service-role key, signed URLs, arbitrary headers, or EXIF/GPS data.
// Isolated to the project-files upload path only (uploadOneFile, shared
// by the standalone Project Files upload and the inline RFI attachment
// upload) -- no other request path is touched.
// REMOVE after the corruption boundary is identified.
function diagHash(label: string, buf: Buffer) {
  const info = {
    length: buf.length,
    first16hex: buf.subarray(0, 16).toString("hex"),
    sha256: createHash("sha256").update(buf).digest("hex"),
  };
  console.log(`[TEMP-DIAG project-files-upload] ${label}:`, info);
  return info;
}
// ============================================================

export const MAX_FILE_BYTES = 10 * 1024 * 1024;

// Extension -> accepted MIME types. Extension is checked first and is the
// primary gate (reliable, not spoofed by client-side "accept" hints); the
// MIME cross-check only rejects an implausible combination when the browser
// actually reported a specific, meaningful type. DWG/DXF MIME reporting is
// inconsistent across browsers/OS, so those two rely on extension alone.
//
// HEIC/HEIF are deliberately NOT in this allowlist. sharp's EXIF/GPS-strip
// path (below) cannot be verified to support HEIC/HEIF input in the
// deployed environment (it depends on libheif being present in the sharp
// build), and phone photos in this format routinely embed exact GPS
// coordinates. Silently accepting a format we can't guarantee stripping
// for is not acceptable -- rejecting it at validation time, with a clear
// message, is safer than uploading an unstripped image.
// BACKLOG: "HEIC/HEIF safe conversion + EXIF/GPS stripping" -- not
// implemented in this checkpoint.
export const ALLOWED_EXTENSIONS: Record<string, string[] | null> = {
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  webp: ["image/webp"],
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

const UNSUPPORTED_EXTENSIONS: Record<string, string> = {
  heic: "HEIC/HEIF photos aren't supported yet. Please upload JPG, PNG, WebP, or PDF.",
  heif: "HEIC/HEIF photos aren't supported yet. Please upload JPG, PNG, WebP, or PDF.",
};

export function validateFile(file: File): string | null {
  if (file.size === 0) return `${file.name} is empty.`;
  if (file.size > MAX_FILE_BYTES) return `${file.name} is too large. Maximum file size is 10MB.`;

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext in UNSUPPORTED_EXTENSIONS) {
    return UNSUPPORTED_EXTENSIONS[ext];
  }
  if (!(ext in ALLOWED_EXTENSIONS)) {
    return `${file.name} is not an accepted file type. Allowed: images, PDF, Word/Excel documents, text, DWG/DXF.`;
  }
  const allowedMimes = ALLOWED_EXTENSIONS[ext];
  if (allowedMimes && file.type && !allowedMimes.includes(file.type)) {
    return `${file.name} does not match its file extension.`;
  }
  return null;
}

// Every remaining accepted image format is verified to go through this
// strip path -- there is no accepted image extension left that bypasses it
// (HEIC/HEIF, the one format that would have, is rejected above instead).
const EXIF_STRIP_SUPPORTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

async function stripExifIfSupported(buffer: Buffer, mimeType: string): Promise<Buffer> {
  if (!EXIF_STRIP_SUPPORTED_TYPES.has(mimeType)) return buffer;
  return sharp(buffer).rotate().toBuffer();
}

export type UploadResult = { key: string; originalFilename: string; mimeType: string; sizeBytes: number };

export async function uploadOneFile(projectId: string, file: File): Promise<UploadResult> {
  // TEMPORARY DIAGNOSTIC -- see block above. Correlation ID only, no
  // filename logged (not needed to correlate a single controlled test upload).
  const diagId = randomUUID();
  console.log(`[TEMP-DIAG project-files-upload] ${diagId} start: file.size=${file.size} file.type=${file.type}`);

  const arrBuf = await file.arrayBuffer();
  diagHash(`${diagId} immediately after file.arrayBuffer()`, Buffer.from(arrBuf));

  const inputBuffer = Buffer.from(arrBuf);
  diagHash(`${diagId} immediately before sharp (== input buffer)`, inputBuffer);

  const outputBuffer = await stripExifIfSupported(inputBuffer, file.type);
  diagHash(`${diagId} immediately after sharp(...).toBuffer() (or passthrough if unsupported type)`, outputBuffer);

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const key = `${projectId}/${randomUUID()}.${ext}`;

  diagHash(`${diagId} exact buffer passed to supabaseAdmin.storage.upload()`, outputBuffer);
  console.log(`[TEMP-DIAG project-files-upload] ${diagId} storage key: ${key}`);

  const { error: uploadErr } = await supabaseAdmin.storage
    .from("project-files")
    .upload(key, outputBuffer, { contentType: file.type || undefined });

  if (uploadErr) {
    console.log(`[TEMP-DIAG project-files-upload] ${diagId} upload FAILED:`, uploadErr);
    throw new Error(`storage.upload(project_file) failed: ${JSON.stringify(uploadErr)}`);
  }
  console.log(`[TEMP-DIAG project-files-upload] ${diagId} upload succeeded`);

  // Immediate read-back, server-side, to check whether corruption occurs
  // during/after the Storage write itself. Does not change app behavior --
  // purely an extra diagnostic read, discarded after logging.
  try {
    const { data: dl, error: dlErr } = await supabaseAdmin.storage.from("project-files").download(key);
    if (dlErr || !dl) {
      console.log(`[TEMP-DIAG project-files-upload] ${diagId} read-back FAILED:`, dlErr);
    } else {
      const downloadedBuf = Buffer.from(await dl.arrayBuffer());
      diagHash(`${diagId} read back from Storage immediately after upload`, downloadedBuf);
    }
  } catch (e) {
    console.log(`[TEMP-DIAG project-files-upload] ${diagId} read-back threw:`, e instanceof Error ? e.message : String(e));
  }

  // TEMPORARY DIAGNOSTIC #2 -- Buffer vs ArrayBuffer hypothesis test. Uploads
  // the identical post-sharp bytes AGAIN, but as a plain ArrayBuffer instead
  // of a Node Buffer, to a brand-new, never-before-used opaque test key
  // (never overwrites the primary upload above or the earlier corrupted
  // diagnostic object). No metadata row, no revision/notification logic --
  // this exists purely to isolate whether Buffer-specific serialization is
  // the cause. Wrapped in try/catch so it can never affect the real upload
  // this function already completed above.
  try {
    diagHash(`${diagId} [ARRAYBUFFER-TEST] before conversion (== post-sharp outputBuffer)`, outputBuffer);

    // Explicit copy into a freshly-allocated Uint8Array -- guaranteed NOT to
    // alias Node's internal Buffer memory pool (Buffer.from/allocUnsafe can
    // share a larger pooled ArrayBuffer with an offset; constructing a new
    // Uint8Array from an existing Buffer copies exactly its bytes into a
    // fresh, exactly-sized backing ArrayBuffer). No text/base64 step anywhere.
    const uint8Copy = new Uint8Array(outputBuffer);
    const arrayBufferCopy: ArrayBuffer = uint8Copy.buffer;

    diagHash(`${diagId} [ARRAYBUFFER-TEST] after conversion to ArrayBuffer`, Buffer.from(arrayBufferCopy));

    const diagKey = `${projectId}/DIAG-ARRAYBUFFER-${randomUUID()}.jpg`;
    console.log(`[TEMP-DIAG project-files-upload] ${diagId} [ARRAYBUFFER-TEST] diagnostic storage key: ${diagKey}`);

    // ArrayBuffer is an explicitly supported FileBody type for
    // supabase-js storage .upload() (alongside Buffer, Uint8Array/
    // ArrayBufferView, Blob, File, ReadableStream, etc).
    const { error: diagUploadErr } = await supabaseAdmin.storage
      .from("project-files")
      .upload(diagKey, arrayBufferCopy, { contentType: file.type || undefined });

    if (diagUploadErr) {
      console.log(`[TEMP-DIAG project-files-upload] ${diagId} [ARRAYBUFFER-TEST] upload FAILED:`, diagUploadErr);
    } else {
      console.log(`[TEMP-DIAG project-files-upload] ${diagId} [ARRAYBUFFER-TEST] upload succeeded`);
      const { data: diagDl, error: diagDlErr } = await supabaseAdmin.storage.from("project-files").download(diagKey);
      if (diagDlErr || !diagDl) {
        console.log(`[TEMP-DIAG project-files-upload] ${diagId} [ARRAYBUFFER-TEST] read-back FAILED:`, diagDlErr);
      } else {
        const diagDownloadedBuf = Buffer.from(await diagDl.arrayBuffer());
        diagHash(`${diagId} [ARRAYBUFFER-TEST] read back from Storage immediately after upload`, diagDownloadedBuf);
      }
    }
  } catch (e) {
    console.log(`[TEMP-DIAG project-files-upload] ${diagId} [ARRAYBUFFER-TEST] threw:`, e instanceof Error ? e.message : String(e));
  }

  return { key, originalFilename: file.name, mimeType: file.type || "application/octet-stream", sizeBytes: file.size };
}

export async function removeUploadedFiles(keys: string[]) {
  if (keys.length === 0) return;
  await supabaseAdmin.storage.from("project-files").remove(keys);
}
