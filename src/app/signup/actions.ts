"use server";

import { performTrustedSignup, type SignupResult } from "@/lib/serviceArea/signupProcessing";

export type { SignupResult };

/**
 * Trusted client signup. Extracts and forwards raw form fields to
 * performTrustedSignup, which does the real validation, the actual
 * auth.signUp() call, and the service-area/waitlist processing for the
 * exact user that call returns — all server-side, in one request.
 */
export async function signupClient(formData: FormData): Promise<SignupResult> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const zip = String(formData.get("zip") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();

  return performTrustedSignup({
    email,
    password,
    zip,
    role: "CLIENT",
    displayName,
  });
}
