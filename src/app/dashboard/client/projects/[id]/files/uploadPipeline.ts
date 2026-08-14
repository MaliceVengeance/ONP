// Pure byte-processing helpers for the project-files upload path --
// deliberately free of any Supabase/network import, so they can be
// exercised directly by a regression test without mocking I/O.
import sharp from "sharp";

// Every remaining accepted image format is verified to go through this
// strip path -- there is no accepted image extension left that bypasses it
// (HEIC/HEIF is rejected at validation time instead, in fileValidation.ts).
export const EXIF_STRIP_SUPPORTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function stripExifIfSupported(buffer: Buffer, mimeType: string): Promise<Buffer> {
  if (!EXIF_STRIP_SUPPORTED_TYPES.has(mimeType)) return buffer;
  return sharp(buffer).rotate().toBuffer();
}

// Supabase Storage's .upload() accepts a Node Buffer directly, but a real
// production investigation (correlated, hash-verified logging across every
// pipeline stage, cross-checked against an ArrayBuffer upload of the exact
// same bytes in the same request) found that passing a Buffer specifically
// corrupts the object as stored -- an ArrayBuffer upload of identical bytes
// round-tripped clean every time in the deployed Vercel runtime, the Buffer
// upload did not. Root cause not fully traced inside the SDK/fetch stack,
// but the fix is precise: never hand a Buffer to .upload() for this bucket.
//
// `new Uint8Array(buffer)` copies the buffer's bytes into a fresh,
// exactly-sized backing ArrayBuffer -- deliberately not `buffer.buffer`
// directly, which can alias Node's larger pooled ArrayBuffer with a byte
// offset for small buffers. `.buffer` on that fresh copy is the ArrayBuffer
// actually passed to Storage.
export function toUploadBody(buffer: Buffer): ArrayBuffer {
  return new Uint8Array(buffer).buffer;
}
