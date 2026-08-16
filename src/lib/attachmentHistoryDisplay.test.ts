// Run with: node "src/lib/attachmentHistoryDisplay.test.ts"
import { test } from "node:test";
import assert from "node:assert/strict";
import { getHistoryDisplay } from "./attachmentHistoryDisplay.ts";

test("contractor viewing SENSITIVE_REMOVED gets a stub only: no filename/thumbnail/download/reason", () => {
  const d = getHistoryDisplay("SENSITIVE_REMOVED", "CONTRACTOR", false);
  assert.equal(d.showDownloadLink, false);
  assert.equal(d.showFilename, false);
  assert.equal(d.showThumbnail, false);
  assert.equal(d.showReasonCategory, false);
  assert.equal(d.showClientFreeText, false);
});

test("contractor viewing SENSITIVE_REMOVAL_PENDING gets the same stub treatment", () => {
  const d = getHistoryDisplay("SENSITIVE_REMOVAL_PENDING", "CONTRACTOR", false);
  assert.equal(d.showDownloadLink, false);
  assert.equal(d.showFilename, false);
});

test("admin viewing a sensitive-removed attachment sees full audit info including client free text", () => {
  const d = getHistoryDisplay("SENSITIVE_REMOVED", "ADMIN", false);
  assert.equal(d.showFilename, true);
  assert.equal(d.showReasonCategory, true);
  assert.equal(d.showClientFreeText, true);
});

test("client viewing a sensitive-removed attachment sees filename/reason but not free text (that's their own text, still shown as client)", () => {
  const d = getHistoryDisplay("SENSITIVE_REMOVED", "CLIENT", false);
  assert.equal(d.showFilename, true);
  assert.equal(d.showReasonCategory, true);
});

test("contractor viewing WITHDRAWN: downloadable, reason category shown, but no free text and neutral filename pre-award", () => {
  const d = getHistoryDisplay("WITHDRAWN", "CONTRACTOR", false);
  assert.equal(d.showDownloadLink, true);
  assert.equal(d.showFilename, false);
  assert.equal(d.showReasonCategory, true);
  assert.equal(d.showClientFreeText, false);
});

test("awarded contractor viewing WITHDRAWN sees the real filename (existing post-award rule preserved)", () => {
  const d = getHistoryDisplay("WITHDRAWN", "CONTRACTOR", true);
  assert.equal(d.showFilename, true);
});

test("non-awarded contractor viewing ACTIVE also gets the neutral-filename treatment, matching existing behavior", () => {
  const d = getHistoryDisplay("ACTIVE", "CONTRACTOR", false);
  assert.equal(d.showFilename, false);
  assert.equal(d.showDownloadLink, true);
});

test("client viewing WITHDRAWN sees full info including their own free text", () => {
  const d = getHistoryDisplay("WITHDRAWN", "CLIENT", false);
  assert.equal(d.showFilename, true);
  assert.equal(d.showClientFreeText, true);
});
