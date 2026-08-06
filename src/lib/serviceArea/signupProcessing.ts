// Plain module (no "use server") — deliberately NOT exported as a Server
// Action. Next.js only turns a function into a client-invokable RPC when it
// is exported from a file marked "use server"; this module has no such
// directive, so nothing here can be called directly from the browser no
// matter what a caller supplies. It is imported only by the trusted signup
// Server Actions in src/app/signup/actions.ts and
// src/app/signup/contractor/actions.ts.

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { classifySignupMetadata } from "./classify";
import { normalizeEmail, normalizeZip, normalizeIntendedRole } from "./normalize";
import { insertWaitlistRow } from "./insertWaitlistRow";
import { logServiceAreaError } from "./log";

// ============================================================================
// Service-area processing for a just-created auth user
// ============================================================================

type ServiceAreaOutcome =
  | { status: "invalid_metadata" }
  | { status: "in_area"; profileUpdated: boolean }
  | { status: "out_of_area"; zip: string; profileUpdated: boolean; waitlisted: boolean };

/**
 * Takes the User object returned directly by this same server-side
 * auth.signUp() call — never a client-supplied id. There is no "supply an
 * arbitrary UUID" surface here: the only identity this function ever acts
 * on is whichever account Supabase itself just created in the same request.
 *
 * The profiles update and the waitlist insert are attempted independently —
 * a failed profiles write must never suppress lead capture, and vice versa.
 */
async function processServiceAreaForNewUser(authUser: {
  id: string;
  email: string | null;
  user_metadata: Record<string, unknown> | null;
}): Promise<ServiceAreaOutcome> {
  const classification = classifySignupMetadata({
    email: authUser.email,
    rawZip: authUser.user_metadata?.service_area_zip as string | undefined,
    rawRole: authUser.user_metadata?.signup_role as string | undefined,
  });

  if (!classification.ok) {
    // Should not normally happen — performTrustedSignup validates the ZIP
    // before ever calling auth.signUp() — but auth.users.email could in
    // principle be null (e.g. a future phone-based signup path), so this
    // stays as a defensive fallback rather than an assumed-impossible case.
    logServiceAreaError("processServiceAreaForNewUser:invalidMetadata", { userId: authUser.id, zip: null });
    return { status: "invalid_metadata" };
  }

  const { email, zip, role, inArea } = classification;
  const status = inArea ? "IN_AREA" : "OUT_OF_AREA";

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({ service_area_zip: zip, service_area_status: status })
    .eq("id", authUser.id);

  const profileUpdated = !profileError;
  if (profileError) {
    logServiceAreaError("processServiceAreaForNewUser:profileUpdate", {
      userId: authUser.id,
      zip,
      code: profileError.code,
      message: profileError.message,
    });
  }

  if (inArea) {
    return { status: "in_area", profileUpdated };
  }

  const intendedRole = normalizeIntendedRole(role);
  const insertResult = await insertWaitlistRow({
    email,
    zip,
    intended_role: intendedRole,
    source: "SIGNUP_BLOCKED",
    userId: authUser.id,
  });

  return { status: "out_of_area", zip, profileUpdated, waitlisted: insertResult.ok };
}

// ============================================================================
// Trusted signup orchestration
// ============================================================================

export type SignupResult =
  | { status: "auth_failed"; message: string }
  | { status: "no_auth_user" }
  | { status: "invalid_metadata"; hasSession: boolean }
  | { status: "in_area"; profileUpdated: boolean; hasSession: boolean }
  | { status: "out_of_area"; zip: string; profileUpdated: boolean; waitlisted: boolean; hasSession: boolean };

/**
 * The only place auth.signUp() is called for either signup page. Runs
 * entirely server-side: validates and normalizes input, creates the auth
 * user via the cookie-aware server client (so an immediate session, if
 * returned, is written into the response cookies correctly), then processes
 * service-area status/waitlist enrollment for that exact returned user in
 * the same request — never a client-supplied id.
 *
 * The password is used only for the auth.signUp() call itself — never
 * logged, never echoed back in the result, never written into metadata.
 */
export async function performTrustedSignup(params: {
  email: string;
  password: string;
  zip: string;
  role: "CLIENT" | "CONTRACTOR";
  displayName: string;
  extraMetadata?: Record<string, unknown>;
}): Promise<SignupResult> {
  const email = normalizeEmail(params.email);
  if (!email || !email.includes("@")) {
    return { status: "auth_failed", message: "Enter a valid email address." };
  }

  if (!params.password || params.password.length < 8) {
    return { status: "auth_failed", message: "Password must be at least 8 characters." };
  }

  const zip = normalizeZip(params.zip);
  if (!zip) {
    return { status: "auth_failed", message: "Enter a valid ZIP code — either 5 digits (12345) or ZIP+4 (12345-6789)." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password: params.password,
    options: {
      data: {
        display_name: params.displayName || (params.role === "CONTRACTOR" ? "Contractor" : "Client"),
        signup_role: params.role,
        service_area_zip: zip,
        ...params.extraMetadata,
      },
    },
  });

  if (error) {
    // Supabase auth errors are already end-user-safe messages (e.g. "User
    // already registered") — passing .message through is not the same as
    // exposing a raw error object/stack, which is what's actually prohibited.
    return { status: "auth_failed", message: error.message };
  }

  if (!data.user) {
    return { status: "no_auth_user" };
  }

  const hasSession = !!data.session;

  const outcome = await processServiceAreaForNewUser({
    id: data.user.id,
    email: data.user.email ?? null,
    user_metadata: (data.user.user_metadata as Record<string, unknown> | null) ?? null,
  });

  if (outcome.status === "invalid_metadata") {
    return { status: "invalid_metadata", hasSession };
  }
  if (outcome.status === "in_area") {
    return { status: "in_area", profileUpdated: outcome.profileUpdated, hasSession };
  }
  return {
    status: "out_of_area",
    zip: outcome.zip,
    profileUpdated: outcome.profileUpdated,
    waitlisted: outcome.waitlisted,
    hasSession,
  };
}
