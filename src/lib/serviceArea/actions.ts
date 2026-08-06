"use server";

import { normalizeEmail, normalizeZip, normalizeIntendedRole, assertValidSource } from "./normalize";
import { insertWaitlistRow } from "./insertWaitlistRow";

// ============================================================================
// joinWaitlist
// ============================================================================

export type JoinWaitlistResult =
  | { status: "joined" }
  | { status: "already_joined" }
  | { status: "invalid_input"; message: string }
  | { status: "failed" };

/**
 * Public waitlist join — used by the login/homepage form, the project-post
 * blocked form, the out-of-area retry form, and any other anonymous or
 * authenticated manual entry point. Duplicates are treated as success (the
 * caller already got what they wanted: a waitlist entry exists for this
 * email/zip/role).
 *
 * Unlike signup, there is no privileged identity here to protect — this
 * only ever creates a standalone service_area_waitlist row (user_id null),
 * never touches profiles, so accepting client-supplied email/zip/role is
 * safe by construction. processSignupServiceArea (the privileged, identity-
 * bound counterpart) no longer exists as an exported action at all — see
 * src/lib/serviceArea/signupProcessing.ts, which is deliberately not a
 * "use server" module and is only ever called from the trusted signup
 * Server Actions in src/app/signup/actions.ts and
 * src/app/signup/contractor/actions.ts.
 */
export async function joinWaitlist(formData: FormData): Promise<JoinWaitlistResult> {
  const email = normalizeEmail(formData.get("email") as string | null);
  const zip = normalizeZip(formData.get("zip") as string | null);
  const intended_role = normalizeIntendedRole(formData.get("intended_role") as string | null);
  const sourceRaw = (formData.get("source") as string | null) ?? "HOMEPAGE";
  assertValidSource(sourceRaw);

  if (!email || !email.includes("@")) {
    return { status: "invalid_input", message: "Enter a valid email address." };
  }
  if (!zip) {
    return { status: "invalid_input", message: "Enter a valid 5-digit ZIP code." };
  }

  const insertResult = await insertWaitlistRow({
    email,
    zip,
    intended_role,
    source: sourceRaw,
    userId: null,
  });

  if (!insertResult.ok) {
    return { status: "failed" };
  }

  return insertResult.deduped ? { status: "already_joined" } : { status: "joined" };
}
