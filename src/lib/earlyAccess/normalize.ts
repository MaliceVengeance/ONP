// Plain module (no "use server") — importable from both client and server
// code. Deliberately self-contained (no cross-module relative imports),
// matching this repo's existing pattern for pure logic files that need to
// be runnable standalone via `node <file>.test.ts` (e.g.
// src/lib/attachmentHistoryDisplay.ts, src/lib/sensitiveRemovalDecision.ts)
// — Node's ESM loader requires explicit file extensions on relative
// imports, which conflicts with TypeScript's bundler resolution mode used
// by the rest of the app, so cross-file imports between testable pure
// modules are avoided rather than worked around. The email/ZIP format
// rules below are intentionally identical to
// src/lib/serviceArea/normalize.ts's — a small, deliberate duplication of
// a few lines of pure formatting logic, not a merge of the two features'
// data models, which remain fully separate (see
// supabase/migrations/031_early_access_signups.sql).

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
 * 9 contiguous digits ("123456789"). Anything else is rejected outright.
 * Accepted ZIP+4 forms are normalized down to the first 5 digits.
 */
export function normalizeZip(raw: string | null | undefined): string | null {
  const trimmed = (raw ?? "").trim();
  if (ZIP5_RE.test(trimmed)) return trimmed;
  if (ZIP_PLUS4_RE.test(trimmed)) return trimmed.slice(0, 5);
  if (ZIP9_RE.test(trimmed)) return trimmed.slice(0, 5);
  return null;
}

export const EARLY_ACCESS_ROLES = ["CLIENT", "CONTRACTOR", "PROPERTY_MANAGER"] as const;
export type EarlyAccessRole = (typeof EARLY_ACCESS_ROLES)[number];

export function normalizeEarlyAccessRole(raw: string | null | undefined): EarlyAccessRole | null {
  const value = (raw ?? "").trim().toUpperCase();
  return (EARLY_ACCESS_ROLES as readonly string[]).includes(value) ? (value as EarlyAccessRole) : null;
}

const MAX_TRADE_LENGTH = 100;
const MAX_UTM_LENGTH = 200;

/**
 * Trims, caps at maxLength, and normalizes blank to null. Never rejects —
 * contractor_trade and the UTM fields are optional/low-stakes, so an
 * overlong value is silently truncated rather than blocking a genuine
 * submission over a malformed marketing link or a verbose trade entry.
 * The DB CHECK constraints (migration 031) are the hard backstop in case
 * this normalization is ever bypassed.
 */
function normalizeOptionalText(raw: string | null | undefined, maxLength: number): string | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

export function normalizeContractorTrade(raw: string | null | undefined): string | null {
  return normalizeOptionalText(raw, MAX_TRADE_LENGTH);
}

export function normalizeUtm(raw: string | null | undefined): string | null {
  return normalizeOptionalText(raw, MAX_UTM_LENGTH);
}
