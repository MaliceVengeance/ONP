"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  normalizeEmail,
  normalizeZip,
  normalizeIntendedRole,
  assertValidSource,
  type IntendedRole,
  type WaitlistSource,
} from "./normalize";
import { classifySignupMetadata, interpretWaitlistInsertError } from "./classify";

function logServiceAreaError(
  operation: string,
  details: { userId?: string | null; zip?: string | null; code?: string | null; message?: string | null }
) {
  const parts = [`operation=${operation}`];
  if (details.userId) parts.push(`userId=${details.userId}`);
  if (details.zip) parts.push(`zip=${details.zip}`);
  if (details.code) parts.push(`code=${details.code}`);
  if (details.message) parts.push(`message=${details.message}`);
  console.error(`[serviceArea] ${parts.join(" ")}`);
}

// ============================================================================
// Waitlist insert — race-safe dedup
// ============================================================================

/**
 * Attempts the insert directly and treats the unique-violation error code
 * (23505 — collision on the normalized (lower(trim(email)), zip,
 * intended_role) index from Migration 017) as a successful dedup, rather
 * than doing a separate SELECT-then-INSERT that would leave a race window.
 */
async function insertWaitlistRow(row: {
  email: string;
  zip: string;
  intended_role: IntendedRole;
  source: WaitlistSource;
  userId: string | null;
}): Promise<{ ok: true; deduped: boolean } | { ok: false }> {
  const { error } = await supabaseAdmin.from("service_area_waitlist").insert({
    email: row.email,
    zip: row.zip,
    intended_role: row.intended_role,
    source: row.source,
    user_id: row.userId,
  });

  const interpreted = interpretWaitlistInsertError(error);
  if (!interpreted.ok) {
    logServiceAreaError("insertWaitlistRow", {
      userId: row.userId,
      zip: row.zip,
      code: error?.code ?? null,
      message: error?.message ?? null,
    });
    return { ok: false };
  }
  return { ok: true, deduped: interpreted.deduped };
}

// ============================================================================
// processSignupServiceArea — authoritative, server-derived signup metadata
// ============================================================================

export type ProcessSignupServiceAreaResult =
  | { status: "user_not_found" }
  | { status: "invalid_metadata"; reason: "missing_email" | "missing_or_invalid_zip" }
  | { status: "in_area"; zip: string; profileUpdated: boolean }
  | { status: "out_of_area"; zip: string; profileUpdated: boolean; waitlisted: boolean };

/**
 * Called right after a successful signup (with or without an active
 * session — email confirmation may mean there isn't one yet) to set
 * service_area_status and, for out-of-area signups, enroll the account on
 * the waitlist.
 *
 * SECURITY: takes only userId. email, ZIP, and role are never accepted as
 * parameters — they're read back from the authoritative auth.users record
 * via supabaseAdmin.auth.admin.getUserById(), the same source
 * handle_new_user() itself reads from. A caller can target any userId, but
 * doing so only re-derives that user's own already-true state from their
 * own metadata — it cannot inject a different email/zip/role, and the
 * profiles update + waitlist insert are both idempotent, so reprocessing a
 * genuine user is harmless. This forecloses the "supply an arbitrary UUID
 * and pass in whatever email/zip/role you want" attack the previous
 * signature was vulnerable to.
 *
 * The profiles update and the waitlist insert are attempted independently —
 * a failed profiles write must never suppress lead capture, and vice versa.
 */
export async function processSignupServiceArea(userId: string): Promise<ProcessSignupServiceAreaResult> {
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);

  if (authError || !authData?.user) {
    if (authError) {
      logServiceAreaError("processSignupServiceArea:authLookup", {
        userId,
        code: (authError as any).code ?? null,
        message: authError.message,
      });
    }
    return { status: "user_not_found" };
  }

  const authUser = authData.user;
  const classification = classifySignupMetadata({
    email: authUser.email,
    rawZip: (authUser.user_metadata as Record<string, unknown> | null)?.service_area_zip as string | undefined,
    rawRole: (authUser.user_metadata as Record<string, unknown> | null)?.signup_role as string | undefined,
  });

  if (!classification.ok) {
    logServiceAreaError("processSignupServiceArea:invalidMetadata", { userId, zip: null });
    return { status: "invalid_metadata", reason: classification.reason };
  }

  const { email, zip, role, inArea } = classification;
  const status = inArea ? "IN_AREA" : "OUT_OF_AREA";

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({ service_area_zip: zip, service_area_status: status })
    .eq("id", userId);

  const profileUpdated = !profileError;
  if (profileError) {
    logServiceAreaError("processSignupServiceArea:profileUpdate", {
      userId,
      zip,
      code: profileError.code,
      message: profileError.message,
    });
  }

  if (inArea) {
    return { status: "in_area", zip, profileUpdated };
  }

  const intendedRole = normalizeIntendedRole(role);
  const insertResult = await insertWaitlistRow({
    email,
    zip,
    intended_role: intendedRole,
    source: "SIGNUP_BLOCKED",
    userId,
  });

  return { status: "out_of_area", zip, profileUpdated, waitlisted: insertResult.ok };
}

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
 * blocked form, and any other anonymous or authenticated manual entry point.
 * Duplicates are treated as success (the caller already got what they
 * wanted: a waitlist entry exists for this email/zip/role).
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
