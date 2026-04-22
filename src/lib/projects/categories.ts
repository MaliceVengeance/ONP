export const PROJECT_CATEGORIES = [
  "GENERAL_CONSTRUCTION",
  "ELECTRICAL",
  "PLUMBING",
  "HVAC",
  "ROOFING",
  "CONCRETE",
  "LANDSCAPING",
  "PAINTING",
  "FENCING",
  "FLOORING",
  "RENOVATION",
  "OTHER",
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];
