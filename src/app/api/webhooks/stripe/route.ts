import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

function getPeriodEnd(sub: any): string {
  const raw =
    sub.current_period_end ??
    sub.items?.data?.[0]?.current_period_end ??
    null;

  if (raw && !isNaN(Number(raw))) {
    return new Date(Number(raw) * 1000).toISOString();
  }

  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
}

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

        if (!contractorId || !subscriptionId) {
          console.log("Missing contractorId or subscriptionId — skipping");
          break;
        }

        const sub = await stripe.subscriptions.retrieve(subscriptionId) as any;
        console.log("SUB OBJECT:", JSON.stringify(sub, null, 2));

        const item = sub.items?.data?.[0];
        const intervalRaw = item?.price?.recurring?.interval ?? "month";
        const intervalMap: Record<string, string> = {
          month: "MONTHLY",
          quarter: "QUARTERLY",
          year: "YEARLY",
        };
        const planInterval = intervalMap[intervalRaw] ?? "MONTHLY";
        const priceCents = item?.price?.unit_amount ?? 0;
        const currency = (sub.currency ?? "usd").toUpperCase();
        const periodStart = sub.current_period_start
          ? new Date(sub.current_period_start * 1000).toISOString()
          : new Date().toISOString();
        const periodEnd = getPeriodEnd(sub);

        const { error: upsertError } = await supabaseAdmin
          .from("contractor_subscriptions")
          .upsert(
            {
              contractor_id: contractorId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              plan_type: planType,
              plan_interval: planInterval,
              price_cents: priceCents,
              currency: currency,
              status: "ACTIVE",
              current_period_start: periodStart,
              current_period_end: periodEnd,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "contractor_id" }
          );

        if (upsertError) {
          console.error("Supabase upsert error:", JSON.stringify(upsertError));
          throw new Error(`Supabase upsert failed: ${upsertError.message}`);
        }

        console.log(`Subscription activated for contractor ${contractorId}`);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as any;
        const customerId = sub.customer;

        const { data: existing } = await supabaseAdmin
          .from("contractor_subscriptions")
          .select("contractor_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (!existing?.contractor_id) break;

        await supabaseAdmin
          .from("contractor_subscriptions")
          .update({
            status: sub.status.toUpperCase(),
            current_period_end: getPeriodEnd(sub),
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
            status: "CANCELED",
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
            status: "PAST_DUE",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        console.log(`Payment failed for customer ${customerId}`);
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}