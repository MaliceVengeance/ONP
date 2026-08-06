import type { SignupResult } from "./signupProcessing";

/** The subset of SignupResult where an auth user was actually created. */
type CreatedUserResult = Extract<SignupResult, { hasSession: boolean }>;

/**
 * Message shown when signup requires email confirmation (no session yet),
 * so there's no dashboard to route to — the form itself has to explain what
 * happened with service-area processing, which now always runs regardless
 * of whether a session came back.
 */
export function emailConfirmationMessage(result: CreatedUserResult): string {
  const base = "Check your email to confirm your account, then log in.";
  switch (result.status) {
    case "in_area":
      return base;
    case "out_of_area":
      return result.waitlisted
        ? `${base} Your ZIP (${result.zip}) is outside our current service area, so we've also added you to our expansion waitlist.`
        : `${base} Your ZIP (${result.zip}) is outside our current service area — we ran into a problem adding you to the expansion waitlist, but you can join it anytime from the login page.`;
    case "invalid_metadata":
      return `${base} We couldn't verify your service area right now — you can complete that from your dashboard after confirming your email.`;
  }
}

/** Where to send the browser once a session exists (immediate-session signup, no email confirmation required). */
export function routeForSignupResult(result: CreatedUserResult, role: "CLIENT" | "CONTRACTOR"): string {
  switch (result.status) {
    case "in_area":
      return "/dashboard";
    case "out_of_area":
      return `/signup/out-of-area?zip=${encodeURIComponent(result.zip)}&waitlist=${result.waitlisted ? "joined" : "failed"}&role=${role}`;
    case "invalid_metadata":
      return `/signup/out-of-area?waitlist=unknown&role=${role}`;
  }
}
