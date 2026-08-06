"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { isInServiceArea } from "./launchZips";

// ============================================================================
// Normalization helpers
// ============================================================================

function normalizeEmail(raw: string | null | undefined): string {
  return (raw ?? "").trim().toLowerCase();
}

/**
 * Strips non-digits and requires exactly 5 digits. ZIP+4 input (9 digits,
 * with or without the dash — the dash is stripped along with other
 * non-digits) is accepted by taking the first 5. Anything shorter than 5
 * digits is rejected rather than silently padded/truncated, since the DB
 * CHECK constraint requires exactly 5 digits and a short ZIP is more likely
 * a typo than a valid partial value.
 */
function normalizeZip(raw: string | null | undefined): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length === 5) return digits;
  if (digits.length > 5) return digits.slice(0, 5);
  return null;
}

const VALID_INTENDED_ROLES = ["CLIENT", "CONTRACTOR", "BOTH", "UNKNOWN"] as const;
type IntendedRole = (typeof VALID_INTENDED_ROLES)[number];

// Soft categorization data with a safe DB default — an invalid/missing value
// just falls back to UNKNOWN rather than rejecting the caller's request.
function normalizeIntendedRole(raw: string | null | undefined): IntendedRole {
  const value = (raw ?? "").trim().toUpperCase();
  return (VALID_INTENDED_ROLES as readonly string[]).includes(value) ? (value as IntendedRole) : "UNKNOWN";
}

const VALID_SOURCES = ["HOMEPAGE", "SIGNUP_BLOCKED", "PROJECT_POST_BLOCKED", "HISTORICAL_SIGNUP_BACKFILL"] as const;
type WaitlistSource = (typeof VALID_SOURCES)[number];

// source is always a hardcoded literal supplied by calling code, never raw
// user input — an invalid value here means a programming bug and should
// throw loudly rather than silently default.
function assertValidSource(source: string): asserts source is WaitlistSource {
  if (!(VALID_SOURCES as readonly string[]).includes(source)) {
    throw new Error(
      `Invalid waitlist source: "${source}". source must be a hardcoded literal supplied by the caller, not user input.`
    );
  }
}

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

  if (!error) return { ok: true, deduped: false };

  if (error.code === "23505") return { ok: true, deduped: true };

  logServiceAreaError("insertWaitlistRow", {
    userId: row.userId,
    zip: row.zip,
    code: error.code,
    message: error.message,
  });
  return { ok: false };
}

// ============================================================================
// processSignupServiceArea
// ============================================================================

export type ProcessSignupServiceAreaResult =
  | { status: "in_area"; zip: string }
  | { status: "out_of_area_waitlisted"; zip: string }
  | { status: "out_of_area_waitlist_failed"; zip: string }
  | { status: "profile_update_failed"; zip: string; inArea: boolean }
  | { status: "invalid_zip" };

/**
 * Called right after a successful signup to set service_area_status and,
 * for out-of-area signups, enroll the new account on the waitlist.
 *
 * If the profiles update fails, this returns immediately without attempting
 * the waitlist insert — a failing write to profiles likely indicates a
 * broader DB issue that would probably also fail the waitlist insert, so
 * there's no benefit to trying. `inArea` is still included on that result so
 * the calling signup page can route correctly (dashboard vs. out-of-area
 * page) without a second isInServiceArea() call.
 */
export async function processSignupServiceArea(
  userId: string,
  rawZip: string,
  rawEmail: string,
  role: "CLIENT" | "CONTRACTOR"
): Promise<ProcessSignupServiceAreaResult> {
  const zip = normalizeZip(rawZip);
  if (!zip) {
    logServiceAreaError("processSignupServiceArea:invalidZip", { userId, zip: rawZip });
    return { status: "invalid_zip" };
  }

  const inArea = isInServiceArea(zip);
  const status = inArea ? "IN_AREA" : "OUT_OF_AREA";

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({ service_area_zip: zip, service_area_status: status })
    .eq("id", userId);

  if (profileError) {
    logServiceAreaError("processSignupServiceArea:profileUpdate", {
      userId,
      zip,
      code: profileError.code,
      message: profileError.message,
    });
    return { status: "profile_update_failed", zip, inArea };
  }

  if (inArea) {
    return { status: "in_area", zip };
  }

  const email = normalizeEmail(rawEmail);
  const intendedRole = normalizeIntendedRole(role);

  const insertResult = await insertWaitlistRow({
    email,
    zip,
    intended_role: intendedRole,
    source: "SIGNUP_BLOCKED",
    userId,
  });

  if (!insertResult.ok) {
    return { status: "out_of_area_waitlist_failed", zip };
  }

  return { status: "out_of_area_waitlisted", zip };
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
