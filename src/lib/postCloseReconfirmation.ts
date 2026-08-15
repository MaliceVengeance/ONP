// Explicit allowlist for "is a stale bid allowed to reconfirm unchanged
// terms after bidding has closed." Deliberately NOT `state !== 'OPEN'` --
// that would also admit DRAFT, CANCELED, EMERGENCY_EXPIRED, AWARDED, and
// COMPLETED, several of which must never allow bidding to be resurrected.
// The chokepoint audit this session confirmed BIDDING_CLOSED/BIDS_UNLOCKED
// are never actually set anywhere in the current codebase -- "closed" today
// always means state stays OPEN with an elapsed deadline -- so only that
// case is allowlisted. If those enum values are ever wired up in the
// future, they must be added here explicitly, not admitted implicitly.
const ALLOWED_STATES = new Set(["OPEN"]);

export interface PostCloseReconfirmationInput {
  state: string;
  deadlineAt: string | null;
  isAwarded: boolean;
  biddingPausedAt: string | null;
  acknowledgedInformationRevision: number | null;
  liveInformationRevision: number;
  now?: Date;
}

export function isPostCloseReconfirmationAllowed(
  input: PostCloseReconfirmationInput
): { allowed: boolean; reason?: string } {
  const now = input.now ?? new Date();

  if (!ALLOWED_STATES.has(input.state)) {
    return { allowed: false, reason: `Project state '${input.state}' does not permit reconfirmation.` };
  }
  if (!input.deadlineAt || new Date(input.deadlineAt).getTime() > now.getTime()) {
    return { allowed: false, reason: "Bidding has not closed yet -- use the normal reconfirm/revise flow." };
  }
  if (input.isAwarded) {
    return { allowed: false, reason: "This project has already been awarded." };
  }
  if (input.biddingPausedAt) {
    return { allowed: false, reason: "This project is paused pending admin review." };
  }
  const isStale = input.acknowledgedInformationRevision !== input.liveInformationRevision;
  if (!isStale) {
    return { allowed: false, reason: "This bid already reflects the current project information -- no reconfirmation needed." };
  }

  return { allowed: true };
}
