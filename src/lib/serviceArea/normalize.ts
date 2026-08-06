// Plain module (no "use server") — importable from both client and server
// code, so signup forms can validate a ZIP client-side using the exact same
// rule the server enforces, rather than a hand-rolled duplicate.

export function normalizeEmail(raw: string | null | undefined): string {
  return (raw ?? "").trim().toLowerCase();
}

const ZIP5_RE = /^\d{5}$/;
const ZIP9_RE = /^\d{9}$/;
const ZIP_PLUS4_RE = /^\d{5}-\d{4}$/;

/** HTML `pattern` attribute value matching the same three accepted shapes. */
export const ZIP_INPUT_PATTERN = "\\d{5}|\\d{5}-\\d{4}|\\d{9}";

/**
 * Accepts exactly: 5 digits ("12345"), ZIP+4 with a dash ("12345-6789"), or
 * 9 contiguous digits ("123456789"). Anything else — short, long, malformed
 * dash placement, or containing letters — is rejected outright rather than
 * silently stripped/truncated into something that merely looks valid.
 * Accepted ZIP+4 forms are normalized down to the first 5 digits.
 */
export function normalizeZip(raw: string | null | undefined): string | null {
  const trimmed = (raw ?? "").trim();
  if (ZIP5_RE.test(trimmed)) return trimmed;
  if (ZIP_PLUS4_RE.test(trimmed)) return trimmed.slice(0, 5);
  if (ZIP9_RE.test(trimmed)) return trimmed.slice(0, 5);
  return null;
}

export const VALID_INTENDED_ROLES = ["CLIENT", "CONTRACTOR", "BOTH", "UNKNOWN"] as const;
export type IntendedRole = (typeof VALID_INTENDED_ROLES)[number];

// Soft categorization data with a safe DB default — an invalid/missing value
// just falls back to UNKNOWN rather than rejecting the caller's request.
export function normalizeIntendedRole(raw: string | null | undefined): IntendedRole {
  const value = (raw ?? "").trim().toUpperCase();
  return (VALID_INTENDED_ROLES as readonly string[]).includes(value) ? (value as IntendedRole) : "UNKNOWN";
}

export const VALID_SOURCES = ["HOMEPAGE", "SIGNUP_BLOCKED", "PROJECT_POST_BLOCKED", "HISTORICAL_SIGNUP_BACKFILL"] as const;
export type WaitlistSource = (typeof VALID_SOURCES)[number];

// source is always a hardcoded literal supplied by calling code, never raw
// user input — an invalid value here means a programming bug and should
// throw loudly rather than silently default.
export function assertValidSource(source: string): asserts source is WaitlistSource {
  if (!(VALID_SOURCES as readonly string[]).includes(source)) {
    throw new Error(
      `Invalid waitlist source: "${source}". source must be a hardcoded literal supplied by the caller, not user input.`
    );
  }
}
