// Run with: node "src/lib/sensitiveRemovalDecision.test.ts"
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  statusForDecision,
  decisionAttemptsToClearPause,
  isReviewUnresolved,
  projectHasUnresolvedSensitiveRemoval,
} from "./sensitiveRemovalDecision.ts";

test("statusForDecision maps each client decision to the correct review status", () => {
  assert.equal(statusForDecision("NOT_NEEDED"), "RESOLVED_NOT_NEEDED");
  assert.equal(statusForDecision("REPLACEMENT_UPLOADED"), "RESOLVED_REPLACEMENT_UPLOADED");
  assert.equal(statusForDecision("UNSURE"), "PENDING_REVIEW");
});

test("UNSURE never attempts to clear the pause; the other two do", () => {
  assert.equal(decisionAttemptsToClearPause("UNSURE"), false);
  assert.equal(decisionAttemptsToClearPause("NOT_NEEDED"), true);
  assert.equal(decisionAttemptsToClearPause("REPLACEMENT_UPLOADED"), true);
});

test("a review with no decision recorded yet is unresolved", () => {
  assert.equal(isReviewUnresolved({ status: "PENDING_CLIENT_DECISION", attachmentStatus: "SENSITIVE_REMOVAL_PENDING", originalObjectDeletedAt: null }), true);
  assert.equal(isReviewUnresolved({ status: "PENDING_REVIEW", attachmentStatus: "SENSITIVE_REMOVAL_PENDING", originalObjectDeletedAt: null }), true);
});

test("a decision recorded but quarantine still pending is unresolved (Fix 1 requirement)", () => {
  assert.equal(isReviewUnresolved({ status: "RESOLVED_NOT_NEEDED", attachmentStatus: "SENSITIVE_REMOVAL_PENDING", originalObjectDeletedAt: null }), true);
  assert.equal(isReviewUnresolved({ status: "RESOLVED_REPLACEMENT_UPLOADED", attachmentStatus: "SENSITIVE_REMOVED", originalObjectDeletedAt: null }), true);
});

test("a decision recorded AND quarantine fully complete is resolved", () => {
  assert.equal(isReviewUnresolved({ status: "RESOLVED_NOT_NEEDED", attachmentStatus: "SENSITIVE_REMOVED", originalObjectDeletedAt: "2026-01-01T00:00:00Z" }), false);
  assert.equal(isReviewUnresolved({ status: "BIDDING_RESUMED", attachmentStatus: "SENSITIVE_REMOVED", originalObjectDeletedAt: "2026-01-01T00:00:00Z" }), false);
});

test("project with zero reviews and no pending attachments has nothing unresolved", () => {
  assert.equal(projectHasUnresolvedSensitiveRemoval([], []), false);
});

test("project cannot unpause merely because all review decisions are resolved if an attachment is still SENSITIVE_REMOVAL_PENDING (explicit requirement)", () => {
  const reviews = [{ status: "RESOLVED_NOT_NEEDED" as const, attachmentStatus: "SENSITIVE_REMOVED" as const, originalObjectDeletedAt: "2026-01-01T00:00:00Z" }];
  // All reviews individually resolved, but a DIFFERENT attachment on the
  // same project is mid-quarantine with no review row (defensive case).
  assert.equal(projectHasUnresolvedSensitiveRemoval(reviews, ["SENSITIVE_REMOVAL_PENDING"]), true);
});

test("sibling-review handling: one resolved review does not mask another still-open review", () => {
  const reviews = [
    { status: "RESOLVED_NOT_NEEDED" as const, attachmentStatus: "SENSITIVE_REMOVED" as const, originalObjectDeletedAt: "2026-01-01T00:00:00Z" },
    { status: "PENDING_CLIENT_DECISION" as const, attachmentStatus: "SENSITIVE_REMOVAL_PENDING" as const, originalObjectDeletedAt: null },
  ];
  assert.equal(projectHasUnresolvedSensitiveRemoval(reviews, []), true);
});

test("all reviews resolved and fully quarantined, no other pending attachments -> nothing unresolved", () => {
  const reviews = [
    { status: "RESOLVED_NOT_NEEDED" as const, attachmentStatus: "SENSITIVE_REMOVED" as const, originalObjectDeletedAt: "2026-01-01T00:00:00Z" },
    { status: "BIDDING_RESUMED" as const, attachmentStatus: "SENSITIVE_REMOVED" as const, originalObjectDeletedAt: "2026-01-02T00:00:00Z" },
  ];
  assert.equal(projectHasUnresolvedSensitiveRemoval(reviews, []), false);
});
