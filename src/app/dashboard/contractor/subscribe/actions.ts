"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { stripe, PRICES } from "@/lib/stripe";

export async function createCheckoutSession(planType: "standard" | "veteran") {
  const { supabase, user } = await requireRole(["CONTRACTOR", "ADMIN"]);

  // Security check — verify veteran status server-side
  const { data: profile } = await supabase
    .from("contractor_profiles")
    .select("veteran_verified, business_name")
    .eq("contractor_id", user.id)
    .maybeSingle();

  if (planType === "veteran" && !profile?.veteran_verified) {
    throw new Error("Veteran plan requires verified veteran status.");
  }

  const priceId = planType === "veteran" ? PRICES.veteran : PRICES.standard;

  // Get or create Stripe customer
  const { data: existingSub } = await supabase
    .from("contractor_subscriptions")
    .select("stripe_customer_id")
    .eq("contractor_id", user.id)
    .maybeSingle();

  let customerId = existingSub?.stripe_customer_id;

  if (!customerId) {
    const { data: authUser } = await supabase.auth.getUser();
    const customer = await stripe.customers.create({
      email: authUser.user?.email,
      name: profile?.business_name ?? undefined,
      metadata: {
        contractor_id: user.id,
        plan_type: planType,
      },
    });
    customerId = customer.id;
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `https://www.ournextproject.us/dashboard/contractor?welcome=1`,
    cancel_url: `https://www.ournextproject.us/dashboard/contractor/subscribe?canceled=1`,
    metadata: {
      contractor_id: user.id,
      plan_type: planType,
    },
  });

  if (!session.url) throw new Error("Failed to create checkout session.");

  redirect(session.url);
}

export async function cancelSubscription() {
  const { supabase, user } = await requireRole(["CONTRACTOR", "ADMIN"]);

  // Get the subscription record
  const { data: sub } = await supabase
    .from("contractor_subscriptions")
    .select("stripe_subscription_id, status")
    .eq("contractor_id", user.id)
    .maybeSingle();

  if (!sub?.stripe_subscription_id) {
    throw new Error("No active subscription found.");
  }

  if (sub.status !== "ACTIVE" && sub.status !== "TRIALING") {
    throw new Error("Subscription is not active.");
  }

  // Cancel at period end in Stripe — contractor keeps access until renewal date
  await stripe.subscriptions.update(sub.stripe_subscription_id, {
    cancel_at_period_end: true,
  });

  // Update Supabase to reflect pending cancellation
  await supabase
    .from("contractor_subscriptions")
    .update({
      status: "CANCELED",
      updated_at: new Date().toISOString(),
    })
    .eq("contractor_id", user.id);

  redirect("/dashboard/contractor/subscribe?canceled_sub=1");
}