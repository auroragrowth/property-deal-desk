import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/lib/db/client";
import { stripeEvents, subscriptions } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe/server";
import { planFromLookupKey } from "@/features/billing/plans";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: { code: "config", message: "STRIPE_WEBHOOK_SECRET not set" } },
      { status: 500 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: { code: "validation", message: "Missing stripe-signature" } },
      { status: 400 },
    );
  }

  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    return NextResponse.json(
      {
        error: {
          code: "validation",
          message: `Invalid signature: ${(err as Error).message}`,
        },
      },
      { status: 400 },
    );
  }

  // Idempotency — single insert; if it conflicts we've seen this event before.
  const inserted = await db
    .insert(stripeEvents)
    .values({ stripeEventId: event.id, type: event.type })
    .onConflictDoNothing({ target: stripeEvents.stripeEventId })
    .returning({ id: stripeEvents.stripeEventId });

  if (inserted.length === 0) {
    return NextResponse.json({ ok: true, deduped: true });
  }

  try {
    await handleStripeEvent(event);
  } catch (err) {
    console.error(`[stripe webhook] ${event.type} handler failed:`, err);
    return NextResponse.json(
      { error: { code: "handler", message: (err as Error).message } },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const subId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;
      if (!subId) break;
      const sub = await stripe.subscriptions.retrieve(subId);
      await upsertSubscription(sub, session.metadata?.clerk_user_id ?? undefined);
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await upsertSubscription(sub);
      break;
    }
    case "customer.subscription.trial_will_end": {
      // TODO(week-12): send "your trial ends in 3 days" via Resend.
      const sub = event.data.object as Stripe.Subscription;
      console.log(`[stripe] trial_will_end for subscription ${sub.id}`);
      break;
    }
    case "invoice.paid":
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId =
        typeof invoice.subscription === "string"
          ? invoice.subscription
          : invoice.subscription?.id;
      if (!subId) break;
      const sub = await stripe.subscriptions.retrieve(subId);
      await upsertSubscription(sub);
      // TODO(week-12): dunning email on payment_failed via Resend.
      break;
    }
    default:
      // Ignore other events.
      break;
  }
}

async function upsertSubscription(
  sub: Stripe.Subscription,
  clerkUserIdHint?: string,
) {
  const clerkUserId =
    clerkUserIdHint ?? (sub.metadata?.clerk_user_id as string | undefined);
  if (!clerkUserId) {
    console.warn(
      `[stripe] subscription ${sub.id} missing clerk_user_id metadata`,
    );
    return;
  }

  const item = sub.items.data[0];
  const lookupKey = item?.price?.lookup_key ?? null;
  const plan = planFromLookupKey(lookupKey);

  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  // current_period_end may be on the subscription (older API versions) or on
  // each subscription item (newer API versions). Check both.
  const periodEndSec =
    (item as { current_period_end?: number } | undefined)?.current_period_end ??
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    null;

  const values = {
    userId: clerkUserId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
    plan,
    status: sub.status,
    currentPeriodEnd: periodEndSec ? new Date(periodEndSec * 1000) : null,
    trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    updatedAt: new Date(),
  };

  await db
    .insert(subscriptions)
    .values(values)
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        stripeCustomerId: values.stripeCustomerId,
        stripeSubscriptionId: values.stripeSubscriptionId,
        plan: values.plan,
        status: values.status,
        currentPeriodEnd: values.currentPeriodEnd,
        trialEnd: values.trialEnd,
        cancelAtPeriodEnd: values.cancelAtPeriodEnd,
        updatedAt: values.updatedAt,
      },
    });
}
