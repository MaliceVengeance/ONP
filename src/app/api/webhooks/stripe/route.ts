import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const contractorId = session.metadata?.contractor_id;
        const planType = session.metadata?.plan_type;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        if (!contractorId || !subscriptionId) break;

        // Get subscription details from Stripe
        const sub = await stripe.subscriptions.retrieve(subscriptionId);

        await supabaseAdmin
          .from("contractor_subscriptions")
          .upsert({
            contractor_id: contractorId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan_type: planType,
            status: "active",
            current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "contractor_id",
          });

        console.log(`Subscription activated for contractor ${contractorId}`);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as any;
        const customerId = sub.customer;

        // Find contractor by customer ID
        const { data: existing } = await supabaseAdmin
          .from("contractor_subscriptions")
          .select("contractor_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (!existing?.contractor_id) break;

        await supabaseAdmin
          .from("contractor_subscriptions")
          .update({
            status: sub.status,
            current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        console.log(`Subscription updated for customer ${customerId}`);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as any;
        const customerId = sub.customer;

        await supabaseAdmin
          .from("contractor_subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        console.log(`Subscription canceled for customer ${customerId}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        const customerId = invoice.customer;

        await supabaseAdmin
          .from("contractor_subscriptions")
          .update({
            status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        console.log(`Payment failed for customer ${customerId}`);
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}