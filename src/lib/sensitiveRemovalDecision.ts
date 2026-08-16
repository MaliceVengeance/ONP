// Pure helpers mirroring the client-decision routing and the centralized
// "is anything still unresolved" predicate (project_has_unresolved_
// sensitive_removal / maybe_clear_sensitive_removal_pause, migration 030).
// This is a JS mirror for fast unit testing of the decision matrix -- it
// does not replace the real DB-level concurrency test, which exercises the
// actual SQL function under a genuine FOR UPDATE lock race.

export const CLIENT_DECISIONS = ["NOT_NEEDED", "REPLACEMENT_UPLOADED", "UNSURE"] as const;
export type ClientDecision = (typeof CLIENT_DECISIONS)[number];

export type ReviewStatus =
  | "PENDING_CLIENT_DECISION"
  | "PENDING_REVIEW"
  | "BIDDING_RESUMED"
  | "RESOLVED_NO_ACTION"
  | "RESOLVED_NOT_NEEDED"
  | "RESOLVED_REPLACEMENT_UPLOADED";

export type AttachmentStatus = "ACTIVE" | "WITHDRAWN" | "SENSITIVE_REMOVAL_PENDING" | "SENSITIVE_REMOVED";

export function statusForDecision(decision: ClientDecision): ReviewStatus {
  switch (decision) {
    case "NOT_NEEDED":
      return "RESOLVED_NOT_NEEDED";
    case "REPLACEMENT_UPLOADED":
      return "RESOLVED_REPLACEMENT_UPLOADED";
    case "UNSURE":
      return "PENDING_REVIEW";
  }
}

// UNSURE never even attempts to clear the pause -- it's an escalation, not
// a resolution. NOT_NEEDED/REPLACEMENT_UPLOADED attempt to, but the actual
// DB-level clear is still gated by projectHasUnresolvedSensitiveRemoval.
export function decisionAttemptsToClearPause(decision: ClientDecision): boolean {
  return decision !== "UNSURE";
}

export interface ReviewForPauseCheck {
  status: ReviewStatus;
  attachmentStatus: AttachmentStatus;
  originalObjectDeletedAt: string | null;
}

// Mirrors project_has_unresolved_sensitive_removal(): a review counts as
// unresolved if its decision hasn't been recorded yet, OR its decision is
// recorded but quarantine hasn't fully completed (status = SENSITIVE_REMOVED
// AND original_object_deleted_at IS NOT NULL). Also mirrors the defensive
// second EXISTS clause: any attachment still SENSITIVE_REMOVAL_PENDING
// blocks resumption regardless of review state.
export function isReviewUnresolved(review: ReviewForPauseCheck): boolean {
  if (review.status === "PENDING_CLIENT_DECISION" || review.status === "PENDING_REVIEW") {
    return true;
  }
  const quarantineComplete = review.attachmentStatus === "SENSITIVE_REMOVED" && review.originalObjectDeletedAt !== null;
  return !quarantineComplete;
}

export function projectHasUnresolvedSensitiveRemoval(
  reviews: ReviewForPauseCheck[],
  otherPendingAttachmentStatuses: AttachmentStatus[] = []
): boolean {
  if (otherPendingAttachmentStatuses.includes("SENSITIVE_REMOVAL_PENDING")) return true;
  return reviews.some(isReviewUnresolved);
}
