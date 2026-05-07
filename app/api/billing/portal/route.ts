import { getUserIdOrNull } from "@/lib/auth/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { subscriptions } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe/server";

export async function POST(req: NextRequest) {
  const userId = await getUserIdOrNull();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "auth", message: "Unauthorized" } },
      { status: 401 },
    );
  }

  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  });
  if (!sub) {
    return NextResponse.json(
      { error: { code: "not_found", message: "No subscription found" } },
      { status: 404 },
    );
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${req.nextUrl.origin}/settings`,
  });

  return NextResponse.json({ url: portal.url });
}
