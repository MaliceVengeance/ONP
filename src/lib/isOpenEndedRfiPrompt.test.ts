// Regression test for the open-ended RFI exemption bug: the real stored
// catalog prompt carries trailing note text that a strict "===" comparison
// never matched, silently defeating the "askable multiple times" exemption.
//
// Run with: node "src/lib/isOpenEndedRfiPrompt.test.ts"
import { test } from "node:test";
import assert from "node:assert/strict";
import { isOpenEndedRfiPrompt } from "./isOpenEndedRfiPrompt.ts";

test("isOpenEndedRfiPrompt: matches the real production catalog prompt (with trailing admin-review note)", () => {
  // This is the actual stored rfi_catalog.prompt text that a strict "==="
  // comparison against the bare sentence never matched.
  const realProdPrompt =
    "I have a specific question not covered above. (Note: this will be reviewed by ONP admin before being posted.)";
  assert.equal(isOpenEndedRfiPrompt(realProdPrompt), true);
});

test("isOpenEndedRfiPrompt: matches the bare sentence with no trailing text too", () => {
  assert.equal(isOpenEndedRfiPrompt("I have a specific question not covered above."), true);
});

test("isOpenEndedRfiPrompt: is case-insensitive", () => {
  assert.equal(isOpenEndedRfiPrompt("I HAVE A SPECIFIC QUESTION NOT COVERED ABOVE."), true);
});

test("isOpenEndedRfiPrompt: a normal, non-open-ended catalog prompt is NOT matched (duplicate rule must still apply)", () => {
  assert.equal(isOpenEndedRfiPrompt("What are the site access requirements and hours?"), false);
  assert.equal(isOpenEndedRfiPrompt("Can you confirm the measurements or square footage?"), false);
  assert.equal(isOpenEndedRfiPrompt("Are there existing conditions I should be aware of?"), false);
});

test("isOpenEndedRfiPrompt: null/undefined prompt (e.g. catalog lookup miss) is handled safely, not open-ended", () => {
  assert.equal(isOpenEndedRfiPrompt(null), false);
  assert.equal(isOpenEndedRfiPrompt(undefined), false);
});

test("isOpenEndedRfiPrompt: empty string is not open-ended", () => {
  assert.equal(isOpenEndedRfiPrompt(""), false);
});
