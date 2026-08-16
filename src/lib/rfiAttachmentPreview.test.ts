// Run with: node "src/lib/rfiAttachmentPreview.test.ts"
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  classifyPreview,
  removeFileAt,
  formatFileSize,
  requiresAttachmentAcknowledgment,
  submitButtonLabel,
} from "./rfiAttachmentPreview.ts";

function makeFile(name: string, type: string): File {
  return new File(["x"], name, { type });
}

test("classifyPreview: JPG/PNG/WebP are images", () => {
  assert.equal(classifyPreview(makeFile("a.jpg", "image/jpeg")), "image");
  assert.equal(classifyPreview(makeFile("a.png", "image/png")), "image");
  assert.equal(classifyPreview(makeFile("a.webp", "image/webp")), "image");
});

test("classifyPreview: PDF/doc/other are not images", () => {
  assert.equal(classifyPreview(makeFile("a.pdf", "application/pdf")), "other");
  assert.equal(classifyPreview(makeFile("a.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")), "other");
});

test("removeFileAt: splices the correct local file, no upload involved", () => {
  const files = [makeFile("a.jpg", "image/jpeg"), makeFile("b.pdf", "application/pdf"), makeFile("c.png", "image/png")];
  const result = removeFileAt(files, 1);
  assert.equal(result.length, 2);
  assert.equal(result[0].name, "a.jpg");
  assert.equal(result[1].name, "c.png");
});

test("formatFileSize renders human-readable sizes", () => {
  assert.equal(formatFileSize(500), "500 B");
  assert.equal(formatFileSize(2048), "2.0 KB");
  assert.equal(formatFileSize(5 * 1024 * 1024), "5.0 MB");
});

test("requiresAttachmentAcknowledgment: false with zero attachments", () => {
  assert.equal(requiresAttachmentAcknowledgment(0), false);
});

test("requiresAttachmentAcknowledgment: true once any attachment is present", () => {
  assert.equal(requiresAttachmentAcknowledgment(1), true);
  assert.equal(requiresAttachmentAcknowledgment(3), true);
});

test("submitButtonLabel switches on attachment presence", () => {
  assert.equal(submitButtonLabel(0), "Post Response");
  assert.equal(submitButtonLabel(1), "Submit Response & Publish Attachments");
});
