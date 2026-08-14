// Regression test for the error-classification logic that makes the
// contractor "Ask a Question" inline-error fix work: a real validation
// rejection (e.g. "This question type has already been asked on this
// project.") must be shown inline, while Next.js's internal redirect()
// signal must be rethrown so navigation still happens on success.
//
// Run with: node "src/lib/isNextRedirectError.test.ts"
// (Not `node --test <path>` for this project's other bracket-directory
// test file, but this one has no such path segment, so `node --test .`
// style discovery would work too -- direct invocation is used here for
// consistency with the sibling test.)
import { test } from "node:test";
import assert from "node:assert/strict";
import { isNextRedirectError } from "./isNextRedirectError.ts";

test("isNextRedirectError: recognizes a genuine Next.js redirect signal", () => {
  const redirectErr = { digest: "NEXT_REDIRECT;push;/dashboard/contractor/projects/abc/rfis?submitted=1;307;" };
  assert.equal(isNextRedirectError(redirectErr), true);
});

test("isNextRedirectError: a real validation Error (e.g. duplicate question type) is NOT classified as a redirect", () => {
  const validationErr = new Error("This question type has already been asked on this project.");
  assert.equal(isNextRedirectError(validationErr), false);
});

test("isNextRedirectError: other Error subtypes without a digest are NOT classified as a redirect", () => {
  assert.equal(isNextRedirectError(new Error("Please select a question type.")), false);
  assert.equal(isNextRedirectError(new TypeError("unexpected")), false);
});

test("isNextRedirectError: a digest that merely resembles NEXT_REDIRECT in substring but doesn't start with it is rejected", () => {
  assert.equal(isNextRedirectError({ digest: "some other value containing NEXT_REDIRECT in the middle" }), false);
});

test("isNextRedirectError: non-object / nullish values are handled safely", () => {
  assert.equal(isNextRedirectError(null), false);
  assert.equal(isNextRedirectError(undefined), false);
  assert.equal(isNextRedirectError("a plain string error"), false);
  assert.equal(isNextRedirectError(42), false);
});

test("isNextRedirectError: an object with a non-string digest is rejected safely", () => {
  assert.equal(isNextRedirectError({ digest: 12345 }), false);
});
