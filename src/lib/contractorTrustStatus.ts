// Pure helpers for the contractor insurance/bond tri-state trust signals
// (migration 032). Mirrors the DB-level backfill/consistency logic for fast
// unit testing -- does not replace the real trigger/CHECK-constraint
// enforcement, which is the actual source of truth at write time.

export const INSURANCE_STATUSES = ["INSURED", "NOT_INSURED", "NOT_PROVIDED"] as const;
export type InsuranceStatus = (typeof INSURANCE_STATUSES)[number];

export const BOND_STATUSES = ["BONDED", "NOT_BONDED", "NOT_PROVIDED"] as const;
export type BondStatus = (typeof BOND_STATUSES)[number];

export function isInsuranceStatus(v: unknown): v is InsuranceStatus {
  return typeof v === "string" && (INSURANCE_STATUSES as readonly string[]).includes(v);
}

export function isBondStatus(v: unknown): v is BondStatus {
  return typeof v === "string" && (BOND_STATUSES as readonly string[]).includes(v);
}

export type StatusTone = "positive" | "negative" | "neutral";

export interface StatusDisplay {
  text: string;
  tone: StatusTone;
}

// Tone drives styling only (positive = green, negative = red, neutral =
// gray/amber-free) -- NOT_PROVIDED must never render with alarming red
// warning treatment, since it isn't a claim of anything.
export function insuranceStatusDisplay(status: InsuranceStatus): StatusDisplay {
  switch (status) {
    case "INSURED":
      return { text: "✅ Insured", tone: "positive" };
    case "NOT_INSURED":
      return { text: "Not insured", tone: "negative" };
    case "NOT_PROVIDED":
      return { text: "Insurance information not provided", tone: "neutral" };
  }
}

export function bondStatusDisplay(status: BondStatus): StatusDisplay {
  switch (status) {
    case "BONDED":
      return { text: "✅ Bonded", tone: "positive" };
    case "NOT_BONDED":
      return { text: "Not bonded", tone: "negative" };
    case "NOT_PROVIDED":
      return { text: "Bonding information not provided", tone: "neutral" };
  }
}

// Mirrors migration 032 section 2's backfill CASE exactly -- a named
// provider AND an expiry date together are treated as credible evidence of
// a real COI on file; anything less (e.g. only a coverage amount) is not
// treated as proof of insurance on its own.
export function deriveInsuranceStatusFromLegacy(input: {
  hasNoInsurance: boolean | null;
  coiProvider: string | null;
  coiExpiry: string | null;
}): InsuranceStatus {
  if (input.hasNoInsurance === true) return "NOT_INSURED";
  if (input.coiProvider && input.coiProvider.trim() !== "" && input.coiExpiry) return "INSURED";
  return "NOT_PROVIDED";
}

// Mirrors migration 032 section 5/6's cross-table consistency rule: a
// verified BOND credential and bond_status = NOT_BONDED can never both be
// true at once.
export function bondStatusConflictsWithVerifiedCredential(
  bondStatus: BondStatus,
  hasVerifiedBondCredential: boolean
): boolean {
  return bondStatus === "NOT_BONDED" && hasVerifiedBondCredential;
}
