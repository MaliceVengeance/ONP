"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { stripe, PRICES, TERM_PRICES, type SubscriptionTerm } from "@/lib/stripe";

export async function createCheckoutSession(planType: "standard" | "veteran", formData: FormData) {
  const { supabase, user } = await requireRole(["CONTRACTOR", "ADMIN"]);

  // Security check — verify veteran status server-side. This gate covers every
  // veteran-tier price (monthly and all three term options below), since it's
  // keyed on planType rather than the specific price chosen — a longer-term
  // veteran price can't be purchased without verification any more than the
  // monthly one could.
  const { data: profile } = await supabase
    .from("contractor_profiles")
    .select("veteran_verified, business_name")
    .eq("contractor_id", user.id)
    .maybeSingle();

  if (planType === "veteran" && !profile?.veteran_verified) {
    throw new Error("Veteran plan requires verified veteran status.");
  }

  const termRaw = String(formData.get("term") ?? "monthly");
  const term: SubscriptionTerm = termRaw === "3" || termRaw === "6" || termRaw === "12" ? termRaw : "monthly";

  const priceId = term === "monthly" ? PRICES[planType] : TERM_PRICES[planType][term];

  // Optional coupon code
  const couponCodeRaw = String(formData.get("coupon_code") ?? "").trim().toUpperCase();
  let stripeCouponId: string | null = null;

  if (couponCodeRaw) {
    const { supabaseAdmin } = await import("@/lib/supabase/admin");
    const { data: couponRow } = await supabaseAdmin
      .from("coupon_codes")
      .select("stripe_coupon_id, is_active")
      .eq("code", couponCodeRaw)
      .maybeSingle();

    if (!couponRow) throw new Error(`Coupon code "${couponCodeRaw}" is not valid.`);
    if (!couponRow.is_active) throw new Error(`Coupon code "${couponCodeRaw}" is no longer active.`);
    stripeCouponId = couponRow.stripe_coupon_id;
  }

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
    ...(stripeCouponId ? { discounts: [{ coupon: stripeCouponId }] } : {}),
    success_url: `https://www.ournextproject.us/dashboard/contractor?welcome=1`,
    cancel_url: `https://www.ournextproject.us/dashboard/contractor/subscribe?canceled=1`,
    metadata: {
      contractor_id: user.id,
      plan_type: planType,
      term,
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

  // Cancel at period end — contractor keeps access through the already-paid
  // period, auto-renewal simply turns off. If a term (3/6/12mo) commitment is
  // still in its committed phase, that phase is billed as ONE upfront charge
  // covering the whole term, managed by a Subscription Schedule rather than
  // plain cancel_at_period_end — cancelling there means removing the
  // already-scheduled phase 2 (the post-term monthly auto-renewal) and letting
  // the current, already-paid phase run out on its own, not truncating access
  // early. Once a term's committed phase completes, Stripe releases the
  // subscription from its schedule automatically (schedule field goes null),
  // at which point it's a plain monthly subscription and the normal
  // cancel_at_period_end path below applies.
  const currentSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);

  if (currentSub.schedule) {
    const scheduleId = typeof currentSub.schedule === "string" ? currentSub.schedule : currentSub.schedule.id;
    const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId);
    const currentPhase = schedule.phases.find(
      (p) => p.start_date <= Math.floor(Date.now() / 1000) && (!p.end_date || p.end_date > Math.floor(Date.now() / 1000))
    ) ?? schedule.phases[0];

    await stripe.subscriptionSchedules.update(scheduleId, {
      end_behavior: "cancel",
      phases: [
        {
          items: currentPhase.items.map((i) => ({ price: typeof i.price === "string" ? i.price : i.price.id, quantity: i.quantity })),
          start_date: currentPhase.start_date,
          end_date: currentPhase.end_date ?? undefined,
        },
      ],
    });
  } else {
    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: true,
    });
  }

  // Mark as pending cancellation — keep ACTIVE so bidding still works
  // Stripe webhook will flip to CANCELED when it actually expires
  await supabase
    .from("contractor_subscriptions")
    .update({
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq("contractor_id", user.id);

  redirect("/dashboard/contractor/subscribe?canceled_sub=1");
}