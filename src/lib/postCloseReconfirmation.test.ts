// Guardrail regression test: post-close reconfirmation must use an explicit
// state allowlist, never "anything except OPEN". Run with:
//   node "src/lib/postCloseReconfirmation.test.ts"
import { test } from "node:test";
import assert from "node:assert/strict";
import { isPostCloseReconfirmationAllowed } from "./postCloseReconfirmation.ts";

const PAST = "2026-01-01T00:00:00Z";
const NOW = new Date("2026-01-02T00:00:00Z");

function base(overrides: Partial<Parameters<typeof isPostCloseReconfirmationAllowed>[0]> = {}) {
  return {
    state: "OPEN",
    deadlineAt: PAST,
    isAwarded: false,
    biddingPausedAt: null,
    acknowledgedInformationRevision: 1,
    liveInformationRevision: 2,
    now: NOW,
    ...overrides,
  };
}

test("DRAFT cannot reconfirm", () => {
  assert.equal(isPostCloseReconfirmationAllowed(base({ state: "DRAFT" })).allowed, false);
});

test("CANCELED cannot reconfirm", () => {
  assert.equal(isPostCloseReconfirmationAllowed(base({ state: "CANCELED" })).allowed, false);
});

test("EMERGENCY_EXPIRED cannot reconfirm", () => {
  assert.equal(isPostCloseReconfirmationAllowed(base({ state: "EMERGENCY_EXPIRED" })).allowed, false);
});

test("AWARDED (state) cannot reconfirm", () => {
  assert.equal(isPostCloseReconfirmationAllowed(base({ state: "AWARDED" })).allowed, false);
});

test("COMPLETED cannot reconfirm", () => {
  assert.equal(isPostCloseReconfirmationAllowed(base({ state: "COMPLETED" })).allowed, false);
});

test("isAwarded=true blocks reconfirmation even if state hasn't flipped yet", () => {
  assert.equal(isPostCloseReconfirmationAllowed(base({ isAwarded: true })).allowed, false);
});

test("paused projects cannot reconfirm", () => {
  assert.equal(isPostCloseReconfirmationAllowed(base({ biddingPausedAt: "2026-01-01T12:00:00Z" })).allowed, false);
});

test("current/non-stale bids do not create unnecessary reconfirmations", () => {
  const r = isPostCloseReconfirmationAllowed(base({ acknowledgedInformationRevision: 2, liveInformationRevision: 2 }));
  assert.equal(r.allowed, false);
});

test("a stale bid on a legitimately closed, unawarded, unpaused project CAN reconfirm", () => {
  const r = isPostCloseReconfirmationAllowed(base());
  assert.equal(r.allowed, true);
});

test("deadline not yet passed is rejected (not post-close)", () => {
  assert.equal(
    isPostCloseReconfirmationAllowed(base({ deadlineAt: "2026-01-03T00:00:00Z" })).allowed,
    false
  );
});

test("null deadline is rejected", () => {
  assert.equal(isPostCloseReconfirmationAllowed(base({ deadlineAt: null })).allowed, false);
});
