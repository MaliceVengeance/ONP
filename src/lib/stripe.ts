import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

export const PRICES = {
  standard: process.env.STRIPE_STANDARD_PRICE_ID!,
  veteran: process.env.STRIPE_VETERAN_PRICE_ID!,
  emergency: process.env.STRIPE_EMERGENCY_PRICE_ID!,
};

/**
 * Term-based prepay prices. Each bills once for the full committed term
 * (e.g. the 6-month price bills once every 6 months, for the full 6-month
 * total) via a Subscription Schedule phase, then transitions to the plain
 * monthly PRICES.standard/veteran price for ongoing auto-renewal at the
 * standard rate — not a re-commitment to the same term.
 */
export const TERM_PRICES: Record<"standard" | "veteran", Record<"3" | "6" | "12", string>> = {
  standard: {
    "3": process.env.STRIPE_STANDARD_3MO_PRICE_ID!,
    "6": process.env.STRIPE_STANDARD_6MO_PRICE_ID!,
    "12": process.env.STRIPE_STANDARD_12MO_PRICE_ID!,
  },
  veteran: {
    "3": process.env.STRIPE_VETERAN_3MO_PRICE_ID!,
    "6": process.env.STRIPE_VETERAN_6MO_PRICE_ID!,
    "12": process.env.STRIPE_VETERAN_12MO_PRICE_ID!,
  },
};

export type SubscriptionTerm = "monthly" | "3" | "6" | "12";

/** Fixed amount for emergency bid requests, in cents */
export const EMERGENCY_FEE_CENTS = 1000; // $10.00