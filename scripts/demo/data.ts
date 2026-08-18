// ============================================================================
// Canonical ONP instructional-video demo dataset — FROZEN.
// ============================================================================
//
// This is the reviewed, final dataset for the demo recording: 1 client,
// 1 published project ("Backyard Patio Cover & Concrete Extension"), 4
// project-level RFIs, 6 contractors, 6 bids, awarded to Mission Ridge
// Construction. Do not invent alternate names, prices, warranties,
// schedules, financing terms, winner logic, RFIs, or scope beyond what is
// written here — see the implementation report for the schema/UI mapping
// decisions and gaps discovered while building this file.
//
// No account password lives in this file — see DEMO_ACCOUNT_PASSWORD in
// .env.demo.local (never committed). Only deterministic, fixed, fictional
// email addresses live here, so repeated seed/reset runs always reuse the
// same underlying accounts.
// ============================================================================

const DEMO_EMAIL_DOMAIN = "onp-demo.test"; // IANA-reserved, non-resolvable TLD
const DEMO_CREDENTIAL_EXPIRY = "2030-01-01"; // no expiry dates given in the canonical brief; uniform future date

export const DEMO_CLIENT = {
  email: `client.demo@${DEMO_EMAIL_DOMAIN}`,
  displayName: "Demo Client",
  companyName: null as string | null,
  serviceAreaZip: "79901",
};

export type DemoCredentialFixture = {
  credentialType: "STATE_LICENSE" | "CITY_REGISTRATION" | "TRADE_LICENSE" | "BOND";
  state?: string | null;
  city?: string | null;
  credentialNumber?: string | null;
  issuingAuthority?: string | null;
  trade?: string | null;
  expirationDate?: string | null; // ISO date
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
  directoryVerified: boolean;
  bbbUrl: string | null;
  veteranVerified: boolean;
  militaryBranch: string | null;
  description: string | null;
  // Simple "License #" surfaced on the bid list page + top of the bid
  // detail page (contractor_profiles.license_number/license_expiry) —
  // kept null for contractors whose trade doesn't require a TX general
  // license, per the canonical brief. See report: "not required" cannot
  // be displayed as a neutral statement anywhere in the current UI, only
  // as an absence of the negative has_no_license warning badge.
  primaryLicenseNumber: string | null;
  primaryLicenseExpiry: string | null;
  bonded: boolean; // whether to insert a BOND credential row (no amount/company given)
  credentials: DemoCredentialFixture[]; // detailed "Licenses, Registrations & Bonding" rows
};

export const DEMO_CONTRACTORS: DemoContractorFixture[] = [
  // C1 — Desert Crest Outdoor Construction — lowest visible base bid, meaningful cost uncertainty (electrical unresolved).
  {
    email: `contractor.demo.one@${DEMO_EMAIL_DOMAIN}`,
    displayName: "Desert Crest Outdoor Construction Rep",
    businessName: "Desert Crest Outdoor Construction",
    categories: ["GENERAL_CONSTRUCTION"],
    city: "El Paso",
    state: "TX",
    serviceAreaZip: "79901",
    phone: "555-010-0001",
    directoryVerified: true,
    bbbUrl: null,
    veteranVerified: false,
    militaryBranch: null,
    description: null,
    primaryLicenseNumber: null,
    primaryLicenseExpiry: null,
    bonded: false,
    credentials: [],
  },
  // C2 — Franklin Peak Remodeling — balanced/value bidder.
  {
    email: `contractor.demo.two@${DEMO_EMAIL_DOMAIN}`,
    displayName: "Franklin Peak Remodeling Rep",
    businessName: "Franklin Peak Remodeling",
    categories: ["GENERAL_CONSTRUCTION"],
    city: "El Paso",
    state: "TX",
    serviceAreaZip: "79901",
    phone: "555-010-0002",
    directoryVerified: true,
    bbbUrl: "https://example.com/bbb-profile/franklin-peak-remodeling-demo",
    veteranVerified: false,
    militaryBranch: null,
    description: null,
    primaryLicenseNumber: "ELP-CR-DEMO-0002",
    primaryLicenseExpiry: DEMO_CREDENTIAL_EXPIRY,
    bonded: true,
    credentials: [
      {
        credentialType: "CITY_REGISTRATION",
        state: "TX",
        city: "El Paso",
        credentialNumber: "ELP-CR-DEMO-0002",
        issuingAuthority: "City of El Paso Contractor Registration (demo credential)",
        expirationDate: DEMO_CREDENTIAL_EXPIRY,
      },
    ],
  },
  // C3 — Mesa Vista Exteriors — premium/full-service bidder + financing.
  {
    email: `contractor.demo.three@${DEMO_EMAIL_DOMAIN}`,
    displayName: "Mesa Vista Exteriors Rep",
    businessName: "Mesa Vista Exteriors",
    categories: ["GENERAL_CONSTRUCTION"],
    city: "El Paso",
    state: "TX",
    serviceAreaZip: "79901",
    phone: "555-010-0003",
    directoryVerified: true,
    bbbUrl: "https://example.com/bbb-profile/mesa-vista-exteriors-demo",
    veteranVerified: false,
    militaryBranch: null,
    description: null,
    primaryLicenseNumber: "ELP-CR-DEMO-0003",
    primaryLicenseExpiry: DEMO_CREDENTIAL_EXPIRY,
    bonded: true,
    credentials: [
      {
        credentialType: "CITY_REGISTRATION",
        state: "TX",
        city: "El Paso",
        credentialNumber: "ELP-CR-DEMO-0003",
        issuingAuthority: "City of El Paso Contractor Registration (demo credential)",
        expirationDate: DEMO_CREDENTIAL_EXPIRY,
      },
      {
        credentialType: "TRADE_LICENSE",
        state: "TX",
        credentialNumber: "TX-ELEC-DEMO-0003",
        issuingAuthority: "Texas Department of Licensing and Regulation (demo credential)",
        trade: "ELECTRICAL",
        expirationDate: DEMO_CREDENTIAL_EXPIRY,
      },
    ],
  },
  // C4 — Rio Grande Builders (Horizon City, TX) — fastest-start bidder.
  {
    email: `contractor.demo.four@${DEMO_EMAIL_DOMAIN}`,
    displayName: "Rio Grande Builders Rep",
    businessName: "Rio Grande Builders",
    categories: ["GENERAL_CONSTRUCTION"],
    city: "Horizon City",
    state: "TX",
    serviceAreaZip: "79928",
    phone: "555-010-0004",
    directoryVerified: true,
    bbbUrl: "https://example.com/bbb-profile/rio-grande-builders-demo",
    veteranVerified: false,
    militaryBranch: null,
    description: null,
    primaryLicenseNumber: null,
    primaryLicenseExpiry: null,
    bonded: false,
    credentials: [],
  },
  // C5 — Organ Mountain Construction (Las Cruces, NM) — regional bidder.
  {
    email: `contractor.demo.five@${DEMO_EMAIL_DOMAIN}`,
    displayName: "Organ Mountain Construction Rep",
    businessName: "Organ Mountain Construction",
    categories: ["GENERAL_CONSTRUCTION"],
    city: "Las Cruces",
    state: "NM",
    serviceAreaZip: "88001",
    phone: "555-010-0005",
    directoryVerified: true,
    bbbUrl: null,
    veteranVerified: false,
    militaryBranch: null,
    description: null,
    primaryLicenseNumber: "NM-DEMO-LIC-0005",
    primaryLicenseExpiry: DEMO_CREDENTIAL_EXPIRY,
    bonded: true,
    credentials: [
      {
        credentialType: "STATE_LICENSE",
        state: "NM",
        credentialNumber: "NM-DEMO-LIC-0005",
        issuingAuthority:
          "New Mexico Regulation & Licensing Department — DEMO CREDENTIAL (fictional, for instructional use only)",
        expirationDate: DEMO_CREDENTIAL_EXPIRY,
      },
    ],
  },
  // C6 — Mission Ridge Construction (El Paso, TX) — canonical winner.
  {
    email: `contractor.demo.six@${DEMO_EMAIL_DOMAIN}`,
    displayName: "Mission Ridge Construction Rep",
    businessName: "Mission Ridge Construction",
    categories: ["GENERAL_CONSTRUCTION"],
    city: "El Paso",
    state: "TX",
    serviceAreaZip: "79901",
    phone: "555-010-0006",
    directoryVerified: true,
    bbbUrl: "https://example.com/bbb-profile/mission-ridge-construction-demo",
    veteranVerified: true,
    militaryBranch: "United States Navy",
    description:
      "Mission Ridge Construction is a veteran-owned (U.S. Navy) contractor based in El Paso, TX, with a strong portfolio of completed outdoor living and patio-cover projects. Workmanship is backed by a five-year warranty.",
    primaryLicenseNumber: "ELP-CR-DEMO-0006",
    primaryLicenseExpiry: DEMO_CREDENTIAL_EXPIRY,
    bonded: true,
    credentials: [
      {
        credentialType: "CITY_REGISTRATION",
        state: "TX",
        city: "El Paso",
        credentialNumber: "ELP-CR-DEMO-0006",
        issuingAuthority: "City of El Paso Contractor Registration (demo credential)",
        expirationDate: DEMO_CREDENTIAL_EXPIRY,
      },
      {
        credentialType: "TRADE_LICENSE",
        state: "TX",
        credentialNumber: "TX-ELEC-DEMO-0006",
        issuingAuthority: "Texas Department of Licensing and Regulation (demo credential)",
        trade: "ELECTRICAL",
        expirationDate: DEMO_CREDENTIAL_EXPIRY,
      },
    ],
  },
];

export const DEMO_PROJECT = {
  title: "Backyard Patio Cover & Concrete Extension",
  category: "GENERAL_CONSTRUCTION",
  description:
    "Construct a new 16' x 24' covered patio (approximately 384 sq. ft.), including extension of the existing concrete patio; minimum 4-inch reinforced concrete with broom finish; a wood-framed patio cover on four structural support posts; architectural-shingle roofing intended to coordinate with the existing home; two ceiling-fan locations; two exterior weather-resistant GFCI receptacles; one exterior light location; paint/stain where included by the bidder; permitting/inspection coordination where included by the bidder; and debris removal and cleanup.",
  city: "El Paso",
  state: "TX",
  zipCode: "79901",
  minOpenDays: 5,
  maxOpenDays: 10,
  // "Client prefers construction to begin approximately 30-45 days after
  // award" — target_start_date takes a single date, so this is seeded as
  // today + 37 days (the midpoint); the full 30-45 day range is also
  // spelled out verbatim in the TIMELINE_CONSTRAINT pre-publish answer.
  targetStartDaysFromNow: 37,
};

// Standard pre-publish client Q&A answered at project creation — these are
// `rfis` rows with contractor_id = NULL, matched by rfi_catalog code, and
// rendered on the client's own project page as "PROJECT QUESTIONS" (the
// answers bidders saw when the project was published). This is the correct
// home for the canonical "Existing conditions," "Client-supplied items,"
// and "Schedule request" facts from section 1 of the brief.
export type DemoPrepublishAnswerFixture = {
  catalogCode: string;
  answer: string;
};

export const DEMO_PREPUBLISH_ANSWERS: DemoPrepublishAnswerFixture[] = [
  {
    catalogCode: "EXISTING_CONDITIONS",
    answer:
      "This is a single-story residence. The existing rear slab is approximately 10' x 12'. Backyard access is through a side gate (normal residential access). The electrical panel appears to have available capacity, subject to field verification. There are no known underground utilities in the proposed footprint. Irrigation may require minor relocation. These are project/client-provided conditions, not guarantees.",
  },
  {
    catalogCode: "GOALS",
    answer:
      "Construct a new 16' x 24' covered patio (approximately 384 sq. ft.), extending the existing concrete patio, to create a durable outdoor living space that coordinates with the existing home.",
  },
  {
    catalogCode: "MATERIAL_SPEC",
    answer:
      "Architectural-shingle roofing intended to coordinate with the existing home. Two ceiling fans and one decorative exterior light fixture will be supplied by the client; the contractor should include required wiring, rated boxes/support, switches, and installation unless specifically excluded in the bid.",
  },
  {
    catalogCode: "SITE_ACCESS",
    answer: "Normal residential backyard access through a side gate.",
  },
  {
    catalogCode: "TIMELINE_CONSTRAINT",
    answer: "Client prefers construction to begin approximately 30-45 days after award, subject to permitting and materials.",
  },
  {
    catalogCode: "MEASUREMENT_CLARIFICATION",
    answer:
      "New patio cover: 16' x 24' (approximately 384 sq. ft.). Existing rear slab is approximately 10' x 12' and will be extended.",
  },
  {
    catalogCode: "PLANS_BLUEPRINTS",
    answer:
      "No formal architectural plans have been prepared. Please include any required design or structural engineering as part of your proposal where applicable.",
  },
  {
    catalogCode: "MATERIALS_FINISHES",
    answer:
      "Minimum 4-inch reinforced concrete with a standard broom finish, including normal control joints/saw cuts. Architectural-shingle roofing to coordinate with the existing home. Paint/stain finish where included by the bidder.",
  },
];

// Canonical, contractor-initiated RFI threads (Section 2 of the brief).
// These are separate `rfis` rows from the pre-publish answers above, so
// each is attributed to a specific bidding contractor purely to satisfy the
// schema's contractor_id FK — no UI anywhere displays "asked by," so this
// attribution has zero visible effect and is not itself canonical content.
//
// Catalog code choice: `uq_rfi_dedupe` (migration 016/027) enforces at most
// one rfis row per (project, revision, catalog) UNLESS the catalog item is
// OTHER — real DB-level product behavior, confirmed empirically when the
// first seed attempt hit "duplicate key value violates unique constraint
// uq_rfi_dedupe". All 8 non-excluded catalog codes are already used by the
// pre-publish answers above, so RFI2 and RFI3 (whose best-fit codes,
// MATERIALS_FINISHES and MATERIAL_SPEC, are already taken) are mapped to
// the only remaining slots: PHOTO_REQUEST (once) and OTHER (exempt, so
// reusable alongside RFI4). This only changes the generic catalog *header*
// shown above each RFI — the exact canonical question and answer text
// itself is fully preserved and rendered accurately as the RFI's notes and
// response. See the implementation report for the full explanation.
export type DemoRfiFixture = {
  catalogCode: string;
  question: string;
  answer: string;
  askedByContractorEmail: string;
};

export const DEMO_RFIS: DemoRfiFixture[] = [
  {
    catalogCode: "SCOPE_CLARIFICATION",
    question:
      "Is the patio cover intended to attach to the existing house, or should bidders price it as a freestanding structure?",
    answer:
      "An attached patio cover is preferred if structurally feasible. If a contractor recommends a freestanding design or identifies a structural concern, please describe that recommendation and any pricing impact in the bid.",
    askedByContractorEmail: `contractor.demo.two@${DEMO_EMAIL_DOMAIN}`,
  },
  {
    catalogCode: "PHOTO_REQUEST",
    question: "What finish is requested for the new concrete slab?",
    answer: "Standard broom finish. Include normal control joints or saw cuts as appropriate for the proposed installation.",
    askedByContractorEmail: `contractor.demo.one@${DEMO_EMAIL_DOMAIN}`,
  },
  {
    catalogCode: "OTHER",
    question: "Are the ceiling fans and exterior light fixture supplied by the client or contractor?",
    answer:
      "The client will supply two ceiling fans and one decorative exterior light fixture. The contractor should include the required wiring, rated boxes/support, switches, receptacles and installation unless specifically excluded in the bid.",
    askedByContractorEmail: `contractor.demo.four@${DEMO_EMAIL_DOMAIN}`,
  },
  {
    catalogCode: "OTHER",
    question: "Is HOA approval or an HOA architectural-review submission required?",
    answer: "No HOA approval is required for this project.",
    askedByContractorEmail: `contractor.demo.six@${DEMO_EMAIL_DOMAIN}`,
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
  durationDays: number; // single integer required by schema; canonical range's lower bound
  startWindow: string; // free-text range, e.g. "4-6 weeks" — not rendered by the current bid detail page, see report
  notes: string; // rendered on both the bid list card and detail page — carries the bid note + schedule sentence
  warrantyTerms: string;
  depositTerms: string | null; // "Payment / Deposit Terms" section — also used for C3's financing disclosure
  scopeDisclaimers: string | null; // "Scope Disclaimers" section — carries exclusions + license-not-required notes
  inclusions: string[]; // stored for DB completeness; not rendered by the current bid detail page, see report
  exclusions: string[]; // stored for DB completeness; not rendered by the current bid detail page, see report
  lineItems: DemoBidLineItemFixture[];
};

export const DEMO_BIDS: DemoBidFixture[] = [
  // C1 — Desert Crest — $16,100 base + electrical TBD (excluded)
  {
    contractorEmail: `contractor.demo.one@${DEMO_EMAIL_DOMAIN}`,
    amountCents: 1_610_000,
    durationDays: 10,
    startWindow: "4-6 weeks",
    notes:
      "Electrical work for the two ceiling fans, two GFCI receptacles, and exterior light will be performed by a licensed electrical subcontractor. Electrical subcontractor pricing is not included in this bid and will be submitted separately for client approval. Estimated start: 4-6 weeks after award. Estimated duration: 10-12 working days.",
    warrantyTerms: "1-year workmanship warranty.",
    depositTerms: "Payment schedule: 20% / 40% / 30% / 10%.",
    scopeDisclaimers:
      "Texas does not require a general-contractor license for this trade; this bid is not missing a required credential. Excluded from this bid: permit fees; structural engineering if required; painting/staining; irrigation relocation; electrical-panel upgrades; unforeseen underground utilities.",
    inclusions: [],
    exclusions: [
      "Electrical work (performed by licensed subcontractor; priced separately)",
      "Permit fees",
      "Structural engineering if required",
      "Painting/staining",
      "Irrigation relocation",
      "Electrical-panel upgrades",
      "Unforeseen underground utilities",
    ],
    lineItems: [
      { description: "Site prep/layout", quantity: 1, unitPriceCents: 125_000 },
      { description: "Concrete", quantity: 1, unitPriceCents: 480_000 },
      { description: "Framing/posts/connectors", quantity: 1, unitPriceCents: 590_000 },
      { description: "Roofing", quantity: 1, unitPriceCents: 290_000 },
      { description: "Cleanup", quantity: 1, unitPriceCents: 125_000 },
    ],
  },
  // C2 — Franklin Peak — $21,350, balanced/value bidder
  {
    contractorEmail: `contractor.demo.two@${DEMO_EMAIL_DOMAIN}`,
    amountCents: 2_135_000,
    durationDays: 12,
    startWindow: "4-5 weeks",
    notes: "Estimated start: 4-5 weeks after award. Estimated duration: 12-14 working days.",
    warrantyTerms: "2-year workmanship warranty.",
    depositTerms: "Payment schedule: 15% / 35% / 30% / 15% / 5%.",
    scopeDisclaimers:
      "Included: permits, finish work, normal electrical scope, cleanup, a minor irrigation allowance, and a basic structural-engineering allowance if required. Excluded: major electrical-service upgrades, major underground utility relocation, concealed structural repairs, and upgrades outside the posted scope.",
    inclusions: [
      "Permits",
      "Finish work",
      "Normal electrical scope",
      "Cleanup",
      "Minor irrigation allowance",
      "Basic structural-engineering allowance if required",
    ],
    exclusions: [
      "Major electrical-service upgrades",
      "Major underground utility relocation",
      "Concealed structural repairs",
      "Upgrades outside posted scope",
    ],
    lineItems: [
      { description: "Site prep/layout", quantity: 1, unitPriceCents: 130_000 },
      { description: "Concrete", quantity: 1, unitPriceCents: 500_000 },
      { description: "Framing/posts/connectors", quantity: 1, unitPriceCents: 600_000 },
      { description: "Roofing", quantity: 1, unitPriceCents: 300_000 },
      { description: "Electrical", quantity: 1, unitPriceCents: 240_000 },
      { description: "Paint/stain", quantity: 1, unitPriceCents: 135_000 },
      { description: "Permit allowance/coordination", quantity: 1, unitPriceCents: 90_000 },
      { description: "Cleanup/haul-off", quantity: 1, unitPriceCents: 140_000 },
    ],
  },
  // C3 — Mesa Vista — $24,800, premium/full-service + financing
  {
    contractorEmail: `contractor.demo.three@${DEMO_EMAIL_DOMAIN}`,
    amountCents: 2_480_000,
    durationDays: 12,
    startWindow: "5-7 weeks",
    notes: "Estimated start: 5-7 weeks after award. Estimated duration: 12-15 working days.",
    warrantyTerms: "5-year workmanship warranty.",
    depositTerms:
      "Financing available through an independent third-party financing provider, subject to credit approval and lender terms.",
    scopeDisclaimers: null,
    inclusions: [],
    exclusions: [],
    lineItems: [
      { description: "Site prep/layout", quantity: 1, unitPriceCents: 145_000 },
      { description: "Upgraded reinforced concrete", quantity: 1, unitPriceCents: 540_000 },
      { description: "Premium framing/posts/connectors", quantity: 1, unitPriceCents: 720_000 },
      { description: "Upgraded roofing", quantity: 1, unitPriceCents: 360_000 },
      { description: "In-house electrical", quantity: 1, unitPriceCents: 280_000 },
      { description: "Paint/stain", quantity: 1, unitPriceCents: 150_000 },
      { description: "Permits/coordination", quantity: 1, unitPriceCents: 95_000 },
      { description: "Cleanup/haul-off", quantity: 1, unitPriceCents: 190_000 },
    ],
  },
  // C4 — Rio Grande Builders — $22,600, fastest-start bidder
  {
    contractorEmail: `contractor.demo.four@${DEMO_EMAIL_DOMAIN}`,
    amountCents: 2_260_000,
    durationDays: 10,
    startWindow: "1-2 weeks",
    notes: "Estimated start: 1-2 weeks after award. Estimated duration: 10-11 working days.",
    warrantyTerms: "3-year workmanship warranty.",
    depositTerms: null,
    scopeDisclaimers:
      "Texas does not require a general-contractor license for this trade; this bid is not missing a required credential.",
    inclusions: [],
    exclusions: [],
    lineItems: [
      { description: "Site prep/layout", quantity: 1, unitPriceCents: 135_000 },
      { description: "Concrete", quantity: 1, unitPriceCents: 520_000 },
      { description: "Framing/posts/connectors", quantity: 1, unitPriceCents: 625_000 },
      { description: "Roofing", quantity: 1, unitPriceCents: 315_000 },
      { description: "Electrical", quantity: 1, unitPriceCents: 250_000 },
      { description: "Paint/stain", quantity: 1, unitPriceCents: 145_000 },
      { description: "Permits", quantity: 1, unitPriceCents: 90_000 },
      { description: "Cleanup/haul-off", quantity: 1, unitPriceCents: 180_000 },
    ],
  },
  // C5 — Organ Mountain Construction — $23,400, Las Cruces/NM regional bidder
  {
    contractorEmail: `contractor.demo.five@${DEMO_EMAIL_DOMAIN}`,
    amountCents: 2_340_000,
    durationDays: 11,
    startWindow: "3-4 weeks",
    notes:
      "Our company is based in Las Cruces and regularly serves projects throughout the El Paso-Las Cruces region. Travel and normal project logistics are included in this proposal. No separate travel charge will be added for the stated scope. Estimated start: 3-4 weeks after award. Estimated duration: 11-13 working days.",
    warrantyTerms: "3-year workmanship warranty.",
    depositTerms: null,
    scopeDisclaimers: null,
    inclusions: [],
    exclusions: [],
    lineItems: [
      { description: "Site prep/layout", quantity: 1, unitPriceCents: 140_000 },
      { description: "Concrete", quantity: 1, unitPriceCents: 515_000 },
      { description: "Framing/posts/connectors", quantity: 1, unitPriceCents: 640_000 },
      { description: "Roofing", quantity: 1, unitPriceCents: 325_000 },
      { description: "Electrical", quantity: 1, unitPriceCents: 245_000 },
      { description: "Paint/stain", quantity: 1, unitPriceCents: 135_000 },
      { description: "Permits", quantity: 1, unitPriceCents: 95_000 },
      { description: "Travel/logistics", quantity: 1, unitPriceCents: 105_000 },
      { description: "Cleanup/haul-off", quantity: 1, unitPriceCents: 140_000 },
    ],
  },
  // C6 — Mission Ridge Construction — $23,950, canonical winner
  {
    contractorEmail: `contractor.demo.six@${DEMO_EMAIL_DOMAIN}`,
    amountCents: 2_395_000,
    durationDays: 12,
    startWindow: "3-4 weeks",
    notes:
      "Our proposal is based on the full posted scope and published project clarifications. We include permit coordination, finish work, cleanup, and a final punch-list walkthrough. Our workmanship is covered by a five-year warranty. Estimated start: 3-4 weeks after award. Estimated duration: 12-13 working days.",
    warrantyTerms: "5-year workmanship warranty.",
    depositTerms: null,
    scopeDisclaimers:
      "Texas does not require a general-contractor license for this trade; this reflects Texas licensing law and does not diminish Mission Ridge Construction's other earned credentials, insurance, and bonding shown above.",
    inclusions: [],
    exclusions: [],
    lineItems: [
      { description: "Site prep/layout", quantity: 1, unitPriceCents: 140_000 },
      { description: "Concrete", quantity: 1, unitPriceCents: 525_000 },
      { description: "Structural framing/posts", quantity: 1, unitPriceCents: 635_000 },
      { description: "Roofing", quantity: 1, unitPriceCents: 320_000 },
      { description: "Electrical", quantity: 1, unitPriceCents: 250_000 },
      { description: "Paint/stain", quantity: 1, unitPriceCents: 145_000 },
      { description: "Permits/coordination", quantity: 1, unitPriceCents: 95_000 },
      { description: "Cleanup/haul-off", quantity: 1, unitPriceCents: 150_000 },
      { description: "Final inspection/punch-list allowance", quantity: 1, unitPriceCents: 135_000 },
    ],
  },
];

// Which contractor email demo:award should award, when run.
export const DEMO_AWARD_WINNER_EMAIL = `contractor.demo.six@${DEMO_EMAIL_DOMAIN}`;
