import { getUser } from "@/lib/auth/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { subscriptions } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe/server";
import { isPlanLookupKey } from "@/features/billing/plans";
import { track } from "@/lib/analytics/server";

export async function POST(req: NextRequest) {
  const user = await getUser();
  const userId = user?.id;
  if (!userId) {
    return NextResponse.json(
      { error: { code: "auth", message: "Unauthorized" } },
      { status: 401 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { lookupKey?: unknown };
  if (!isPlanLookupKey(body.lookupKey)) {
    return NextResponse.json(
      { error: { code: "validation", message: "Invalid plan" } },
      { status: 400 },
    );
  }
  const lookupKey = body.lookupKey;

  const prices = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });
  if (prices.data.length === 0) {
    return NextResponse.json(
      {
        error: {
          code: "config",
          message: `No active Stripe price for lookup_key=${lookupKey}. Run \`pnpm stripe:setup\`.`,
        },
      },
      { status: 500 },
    );
  }
  const price = prices.data[0];

  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  });

  let customerId: string;
  if (existing?.stripeCustomerId) {
    customerId = existing.stripeCustomerId;
  } else {
    const customer = await stripe.customers.create({
      metadata: { user_id: userId },
      ...(user?.email ? { email: user.email } : {}),
    });
    customerId = customer.id;
  }

  const origin = req.nextUrl.origin;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: price.id, quantity: 1 }],
    subscription_data: {
      trial_period_days: 14,
      metadata: { user_id: userId },
    },
    success_url: `${origin}/onboarding/welcome?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/onboarding/plan`,
    allow_promotion_codes: true,
    // TODO(week-12): enable automatic_tax once Stripe Tax is configured.
  });

  if (!session.url) {
    return NextResponse.json(
      { error: { code: "stripe", message: "Checkout session has no URL" } },
      { status: 500 },
    );
  }

  await track(userId, "checkout_started", { lookupKey });

  return NextResponse.json({ url: session.url });
}
