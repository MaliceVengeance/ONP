"use server";

import { performTrustedSignup, type SignupResult } from "@/lib/serviceArea/signupProcessing";

export type { SignupResult };

/**
 * Trusted contractor signup. Same orchestration as the client path, plus
 * the contractor bid-disclaimer acknowledgment, which is validated
 * authoritatively here rather than trusting the client's own canSubmit gate.
 */
export async function signupContractor(formData: FormData): Promise<SignupResult> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const zip = String(formData.get("zip") ?? "");
  const businessName = String(formData.get("business_name") ?? "").trim();
  const termsAgreed = formData.get("terms_agreed") === "true";

  if (!businessName) {
    return { status: "auth_failed", message: "Business name is required." };
  }
  if (!termsAgreed) {
    return { status: "auth_failed", message: "You must agree to the Contractor Bid Acknowledgment and Bid Disclaimer." };
  }

  return performTrustedSignup({
    email,
    password,
    zip,
    role: "CONTRACTOR",
    displayName: businessName,
    extraMetadata: {
      bid_disclaimer_agreed: true,
      bid_disclaimer_version: "v1.0-2026-05-25",
    },
  });
}
