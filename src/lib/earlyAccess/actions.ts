"use server";

import {
  normalizeEmail,
  normalizeZip,
  normalizeEarlyAccessRole,
  normalizeContractorTrade,
  normalizeUtm,
  type EarlyAccessRole,
} from "./normalize";
import { insertEarlyAccessRow } from "./insertEarlyAccessRow";

export type EarlyAccessJoinResult =
  | { status: "ok" }
  | { status: "error"; reason: "validation"; message: string };

const MAX_EMAIL_LENGTH = 254; // RFC 5321

/**
 * Public Early Access join action.
 *
 * Abuse controls (v1): a honeypot field, strict server-side validation,
 * and the platform's existing request/body-size limits. No IP tracking,
 * no minimum-time-on-page rejection — a client-supplied timestamp is not
 * a security boundary and would risk discarding legitimate fast/autofilled
 * submissions. If real abuse is observed post-launch, the documented
 * upgrade path is a CAPTCHA/Turnstile challenge or a proper distributed
 * rate limiter — not implemented speculatively here.
 *
 * Honeypot-caught submissions and genuine duplicates both return the
 * identical { status: "ok" } shape as a fresh insert — the browser can
 * never distinguish "new," "duplicate," or "silently dropped bot" from
 * each other. Only a genuine input-validation failure is disclosed,
 * because that reveals nothing about any other user's data.
 */
export async function joinEarlyAccessList(formData: FormData): Promise<EarlyAccessJoinResult> {
  const honeypot = ((formData.get("website") as string | null) ?? "").trim();
  const isBot = honeypot.length > 0;

  const email = normalizeEmail(formData.get("email") as string | null);
  const zip = normalizeZip(formData.get("zip") as string | null);
  const role = normalizeEarlyAccessRole(formData.get("role") as string | null);
  const contractorTrade = normalizeContractorTrade(formData.get("contractor_trade") as string | null);
  const marketingConsent = (formData.get("marketing_consent") as string | null) === "true";
  const utmSource = normalizeUtm(formData.get("utm_source") as string | null);
  const utmMedium = normalizeUtm(formData.get("utm_medium") as string | null);
  const utmCampaign = normalizeUtm(formData.get("utm_campaign") as string | null);

  if (isBot) {
    // Never insert, never reveal detection — same success shape as a real
    // submission.
    return { status: "ok" };
  }

  if (!email || !email.includes("@") || email.length > MAX_EMAIL_LENGTH) {
    return { status: "error", reason: "validation", message: "Enter a valid email address." };
  }
  if (!zip) {
    return { status: "error", reason: "validation", message: "Enter a valid 5-digit ZIP code." };
  }
  if (!role) {
    return {
      status: "error",
      reason: "validation",
      message: "Select whether you're a homeowner, contractor, or property manager.",
    };
  }

  const insertResult = await insertEarlyAccessRow({
    email,
    zip,
    role: role as EarlyAccessRole,
    contractorTrade,
    marketingConsent,
    utmSource,
    utmMedium,
    utmCampaign,
  });

  if (!insertResult.ok) {
    return { status: "error", reason: "validation", message: "Something went wrong. Please try again." };
  }

  return { status: "ok" };
}
