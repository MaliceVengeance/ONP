import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

export const PRICES = {
  standard: process.env.STRIPE_STANDARD_PRICE_ID!,
  veteran: process.env.STRIPE_VETERAN_PRICE_ID!,
};