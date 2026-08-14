// Regression test for the project-files upload byte pipeline. Run with:
//   node "src/app/dashboard/client/projects/[id]/files/uploadPipeline.test.ts"
//
// (Not `node --test <path>` -- that flag's glob-based file discovery
// interprets the literal `[id]` directory segment as a character class and
// matches nothing. Direct invocation runs node:test's registered tests
// immediately and reports pass/fail correctly; verified 7/7 passing.)
//
// Deliberately imports only uploadPipeline.ts (no Supabase/network
// dependency) so this runs standalone, with zero external test framework,
// using Node's built-in test runner.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { stripExifIfSupported, toUploadBody } from "./uploadPipeline.ts";

function sha256(buf: Buffer | Uint8Array): string {
  return createHash("sha256").update(buf).digest("hex");
}

async function makeJpegWithGpsExif(): Promise<Buffer> {
  return sharp({ create: { width: 40, height: 30, channels: 3, background: { r: 10, g: 20, b: 30 } } })
    .withExif({
      IFD0: { Make: "TestCamera" },
      GPS: { GPSLatitude: "31/1,45/1,0/1", GPSLatitudeRef: "N", GPSLongitude: "106/1,29/1,0/1", GPSLongitudeRef: "W" },
    })
    .jpeg()
    .toBuffer();
}

test("toUploadBody: source bytes remain intact through conversion", () => {
  const source = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x01, 0x02, 0x03, 0x80, 0x81, 0xfe, 0xff]);
  const converted = toUploadBody(source);
  assert.equal(converted.byteLength, source.length, "length must be preserved exactly");
  assert.equal(
    Buffer.from(converted).toString("hex"),
    source.toString("hex"),
    "every byte must be preserved exactly, including bytes >= 0x80 that are invalid standalone UTF-8"
  );
  assert.equal(sha256(Buffer.from(converted)), sha256(source), "SHA-256 must match exactly");
});

test("toUploadBody: Storage upload receives a real ArrayBuffer, not a Node Buffer", () => {
  const source = Buffer.from("arbitrary test payload, including high bytes: \xff\xd8\xff\xdb", "binary");
  const converted = toUploadBody(source);

  // This is the exact property the production investigation isolated:
  // passing a Buffer to supabaseAdmin.storage.upload() corrupted the
  // object as stored; passing a plain ArrayBuffer of the identical bytes
  // did not. uploadOneFile() passes toUploadBody()'s return value directly
  // to .upload(), so asserting its type here is asserting what the real
  // upload call actually receives.
  assert.ok(converted instanceof ArrayBuffer, "must be a genuine ArrayBuffer instance");
  assert.equal(Buffer.isBuffer(converted), false, "must NOT be a Node Buffer");
  assert.equal(ArrayBuffer.isView(converted), false, "must NOT be a TypedArray/DataView -- a bare ArrayBuffer");

  // Also confirm it is NOT aliasing Node's larger pooled ArrayBuffer for
  // small buffers (the specific footgun toUploadBody's `new Uint8Array(...)`
  // copy step avoids) -- byteLength of the returned ArrayBuffer must equal
  // the source length exactly, not some larger pool-allocation size.
  assert.equal(converted.byteLength, source.length);
});

test("stripExifIfSupported + toUploadBody: JPEG round-trips as a valid, re-parseable image with EXIF/GPS stripped", async () => {
  const original = await makeJpegWithGpsExif();
  const originalMeta = await sharp(original).metadata();
  assert.ok(originalMeta.exif && originalMeta.exif.length > 0, "fixture sanity check: must actually have EXIF/GPS embedded");

  const stripped = await stripExifIfSupported(original, "image/jpeg");
  const strippedMeta = await sharp(stripped).metadata();
  assert.equal(strippedMeta.exif, undefined, "EXIF/GPS must be removed");
  assert.equal(strippedMeta.width, 40);
  assert.equal(strippedMeta.height, 30);

  const uploadBody = toUploadBody(stripped);
  assert.equal(uploadBody.byteLength, stripped.length);
  assert.equal(sha256(Buffer.from(uploadBody)), sha256(stripped), "conversion after sharp must not alter bytes");

  // The exact buffer sharp handed back must still be a valid, parseable
  // JPEG after the ArrayBuffer round-trip (proves the conversion step
  // itself introduces no corruption, mirroring what Storage will receive).
  const reparsed = await sharp(Buffer.from(uploadBody)).metadata();
  assert.equal(reparsed.format, "jpeg");
});

test("stripExifIfSupported + toUploadBody: PNG round-trips as a valid image with EXIF stripped", async () => {
  const original = await sharp({ create: { width: 20, height: 15, channels: 4, background: { r: 1, g: 2, b: 3, alpha: 1 } } })
    .withExif({ IFD0: { Make: "TestCamera" } })
    .png()
    .toBuffer();
  const stripped = await stripExifIfSupported(original, "image/png");
  const meta = await sharp(stripped).metadata();
  assert.equal(meta.exif, undefined);
  assert.equal(meta.format, "png");

  const uploadBody = toUploadBody(stripped);
  assert.equal(sha256(Buffer.from(uploadBody)), sha256(stripped));
});

test("stripExifIfSupported + toUploadBody: WebP round-trips as a valid image with EXIF stripped", async () => {
  const original = await sharp({ create: { width: 25, height: 25, channels: 3, background: { r: 5, g: 6, b: 7 } } })
    .withExif({ IFD0: { Make: "TestCamera" } })
    .webp()
    .toBuffer();
  const stripped = await stripExifIfSupported(original, "image/webp");
  const meta = await sharp(stripped).metadata();
  assert.equal(meta.exif, undefined);
  assert.equal(meta.format, "webp");

  const uploadBody = toUploadBody(stripped);
  assert.equal(sha256(Buffer.from(uploadBody)), sha256(stripped));
});

test("stripExifIfSupported + toUploadBody: non-image supported types (e.g. PDF) pass through byte-for-byte, no corruption", async () => {
  // A real PDF header + a spread of high bytes (>= 0x80), which is exactly
  // the class of byte that the original Buffer-upload bug mangled -- this
  // proves the fix isn't image-specific.
  const fakePdf = Buffer.concat([
    Buffer.from("%PDF-1.4\n", "utf8"),
    Buffer.from(Array.from({ length: 256 }, (_, i) => i)), // 0x00..0xff, every byte value once
  ]);

  const passthrough = await stripExifIfSupported(fakePdf, "application/pdf");
  assert.equal(passthrough, fakePdf, "non-image types must pass through the exact same Buffer, untouched");

  const uploadBody = toUploadBody(passthrough);
  assert.equal(uploadBody.byteLength, fakePdf.length);
  assert.equal(sha256(Buffer.from(uploadBody)), sha256(fakePdf), "every byte, including the full 0x00-0xff range, must survive conversion");
  assert.ok(uploadBody instanceof ArrayBuffer);
  assert.equal(Buffer.isBuffer(uploadBody), false);
});

test("stripExifIfSupported + toUploadBody: plain text passes through byte-for-byte", async () => {
  const text = Buffer.from("Plain text project file content — unaffected by image processing.", "utf8");
  const passthrough = await stripExifIfSupported(text, "text/plain");
  assert.equal(passthrough, text);

  const uploadBody = toUploadBody(passthrough);
  assert.equal(sha256(Buffer.from(uploadBody)), sha256(text));
});
