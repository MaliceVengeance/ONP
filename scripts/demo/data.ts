// ============================================================================
// Demo dataset — TOOLING-VALIDATION PLACEHOLDER ONLY.
// ============================================================================
//
// This is deliberately minimal (1 client, 2 contractors, 1 project, 2 bids)
// so the seed/reset/reveal/award framework can be built and tested end to
// end. It is NOT the reviewed demonstration scenario for the actual
// recording — every name, amount, and piece of copy below is an obvious
// placeholder and must be replaced once the real dataset is provided.
//
// No account password lives in this file — see DEMO_ACCOUNT_PASSWORD in
// .env.demo.local (never committed). Only deterministic, fixed, fictional
// email addresses live here, so repeated seed/reset runs always reuse the
// same underlying accounts.
// ============================================================================

const DEMO_EMAIL_DOMAIN = "onp-demo.test"; // IANA-reserved, non-resolvable TLD

export const DEMO_CLIENT = {
  email: `client.demo@${DEMO_EMAIL_DOMAIN}`,
  displayName: "PLACEHOLDER Demo Client",
  companyName: null as string | null,
  serviceAreaZip: "79901",
};

export type DemoContractorFixture = {
  email: string;
  displayName: string;
  businessName: string;
  categories: string[];
  city: string;
  state: string;
  serviceAreaZip: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string; // ISO date
  coiProvider: string;
  coiPolicyNumber: string;
  coiExpiry: string; // ISO date
  coiAmount: number;
  directoryVerified: boolean;
};

export const DEMO_CONTRACTORS: DemoContractorFixture[] = [
  {
    email: `contractor.demo.one@${DEMO_EMAIL_DOMAIN}`,
    displayName: "PLACEHOLDER Contractor One",
    businessName: "PLACEHOLDER Construction Co (tooling fixture)",
    categories: ["ROOFING"],
    city: "El Paso",
    state: "TX",
    serviceAreaZip: "79901",
    phone: "555-010-0001",
    licenseNumber: "DEMO-LIC-0001",
    licenseExpiry: "2030-01-01",
    coiProvider: "PLACEHOLDER Insurance Co",
    coiPolicyNumber: "DEMO-COI-0001",
    coiExpiry: "2030-01-01",
    coiAmount: 1_000_000,
    directoryVerified: true,
  },
  {
    email: `contractor.demo.two@${DEMO_EMAIL_DOMAIN}`,
    displayName: "PLACEHOLDER Contractor Two",
    businessName: "PLACEHOLDER Renovations LLC (tooling fixture)",
    categories: ["GENERAL_CONSTRUCTION"],
    city: "El Paso",
    state: "TX",
    serviceAreaZip: "79901",
    phone: "555-020-0002",
    licenseNumber: "DEMO-LIC-0002",
    licenseExpiry: "2030-01-01",
    coiProvider: "PLACEHOLDER Insurance Co",
    coiPolicyNumber: "DEMO-COI-0002",
    coiExpiry: "2030-01-01",
    coiAmount: 1_000_000,
    directoryVerified: true,
  },
];

export const DEMO_PROJECT = {
  title: "PLACEHOLDER Demo Project — tooling fixture, not for recording",
  category: "GENERAL_CONSTRUCTION",
  description:
    "Placeholder project description used only to validate the demo seeding tooling. Replace with the reviewed demonstration scenario before recording.",
  city: "El Paso",
  state: "TX",
  zipCode: "79901",
  minOpenDays: 5,
  maxOpenDays: 10,
};

export type DemoRfiFixture = {
  catalogCode: string;
  question: string;
  answer: string | null; // null => left open/unanswered
  askedByContractorEmail: string;
};

export const DEMO_RFIS: DemoRfiFixture[] = [
  {
    catalogCode: "SCOPE_CLARIFICATION",
    question: "Placeholder RFI question (answered) for tooling validation.",
    answer: "Placeholder RFI answer for tooling validation.",
    askedByContractorEmail: DEMO_CONTRACTORS[0].email,
  },
  {
    catalogCode: "SITE_ACCESS",
    question: "Placeholder RFI question (still open) for tooling validation.",
    answer: null,
    askedByContractorEmail: DEMO_CONTRACTORS[1].email,
  },
];

export type DemoBidLineItemFixture = {
  description: string;
  quantity: number;
  unitPriceCents: number;
};

export type DemoBidFixture = {
  contractorEmail: string;
  amountCents: number;
  durationDays: number;
  notes: string;
  inclusions: string[];
  exclusions: string[];
  warrantyTerms: string;
  lineItems: DemoBidLineItemFixture[];
};

export const DEMO_BIDS: DemoBidFixture[] = [
  {
    contractorEmail: DEMO_CONTRACTORS[0].email,
    amountCents: 1_250_000,
    durationDays: 14,
    notes: "Placeholder bid notes for tooling validation.",
    inclusions: ["Placeholder inclusion item"],
    exclusions: ["Placeholder exclusion item"],
    warrantyTerms: "Placeholder 1-year warranty text.",
    lineItems: [
      { description: "Placeholder line item 1", quantity: 1, unitPriceCents: 1_000_000 },
      { description: "Placeholder line item 2", quantity: 1, unitPriceCents: 250_000 },
    ],
  },
  {
    contractorEmail: DEMO_CONTRACTORS[1].email,
    amountCents: 1_400_000,
    durationDays: 21,
    notes: "Placeholder bid notes for tooling validation.",
    inclusions: ["Placeholder inclusion item"],
    exclusions: ["Placeholder exclusion item"],
    warrantyTerms: "Placeholder 2-year warranty text.",
    lineItems: [{ description: "Placeholder line item 1", quantity: 1, unitPriceCents: 1_400_000 }],
  },
];

// Which contractor email demo:award should award, when run.
export const DEMO_AWARD_WINNER_EMAIL = DEMO_CONTRACTORS[0].email;
