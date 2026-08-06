// Plain module (no "use server") — pure decision logic factored out of
// actions.ts so it's unit-testable without a live Supabase connection, and
// so it can't accidentally violate the Next.js constraint that every export
// of a "use server" file must be an async function.

import { isInServiceArea } from "./launchZips";
import { normalizeEmail, normalizeZip } from "./normalize";

/**
 * Given the raw fields pulled from the auth user object returned by the
 * server-side auth.signUp() call, decides whether the signup has valid,
 * usable metadata and — if so — whether it's in area. Never sees anything
 * client-supplied directly; the caller (processServiceAreaForNewUser in
 * signupProcessing.ts) only ever passes in fields already read back from
 * that authoritative auth response.
 */
export function classifySignupMetadata(authFields: {
  email: string | null | undefined;
  rawZip: string | null | undefined;
  rawRole: string | null | undefined;
}):
  | { ok: false; reason: "missing_email" | "missing_or_invalid_zip" }
  | { ok: true; email: string; zip: string; role: "CLIENT" | "CONTRACTOR"; inArea: boolean } {
  const email = normalizeEmail(authFields.email);
  if (!email || !email.includes("@")) {
    return { ok: false, reason: "missing_email" };
  }

  const zip = normalizeZip(authFields.rawZip);
  if (!zip) {
    return { ok: false, reason: "missing_or_invalid_zip" };
  }

  // signup_role is COALESCE'd to 'CLIENT' by handle_new_user() itself when
  // missing/invalid — mirror that same fallback here so this function's
  // notion of "role" never diverges from what actually landed in profiles.
  const role: "CLIENT" | "CONTRACTOR" = authFields.rawRole === "CONTRACTOR" ? "CONTRACTOR" : "CLIENT";

  return { ok: true, email, zip, role, inArea: isInServiceArea(zip) };
}

/**
 * Interprets a Postgres insert error against service_area_waitlist. Code
 * 23505 (unique-violation on the normalized email/zip/role index) means
 * "already on the waitlist" — treated as success, not failure.
 */
export function interpretWaitlistInsertError(
  error: { code?: string | null } | null
): { ok: boolean; deduped: boolean } {
  if (!error) return { ok: true, deduped: false };
  if (error.code === "23505") return { ok: true, deduped: true };
  return { ok: false, deduped: false };
}
