import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { subscriptions } from "@/lib/db/schema";

export type Plan = "free" | "starter" | "pro" | "elite";

export type Entitlements = {
  plan: Plan;
  trial: boolean;
  maxSavedDeals: number;
  maxWatchlistItems: number;
  canUseBRRR: boolean;
  canCompare: boolean;
  canExportPack: boolean;
  canUseHMO: boolean;
  teamSeats: number;
};

const FREE: Entitlements = {
  plan: "free",
  trial: false,
  maxSavedDeals: 0,
  maxWatchlistItems: 0,
  canUseBRRR: false,
  canCompare: false,
  canExportPack: false,
  canUseHMO: false,
  teamSeats: 1,
};

const STARTER: Entitlements = {
  ...FREE,
  plan: "starter",
  maxSavedDeals: 10,
  maxWatchlistItems: 25,
};

const PRO: Entitlements = {
  ...FREE,
  plan: "pro",
  maxSavedDeals: Number.POSITIVE_INFINITY,
  maxWatchlistItems: 200,
};

const ELITE: Entitlements = {
  ...FREE,
  plan: "elite",
  maxSavedDeals: Number.POSITIVE_INFINITY,
  maxWatchlistItems: Number.POSITIVE_INFINITY,
};

// Stripe statuses where the subscription should still grant entitlements.
// `past_due` keeps access while Stripe retries (3 attempts); `unpaid` /
// `canceled` / `incomplete_expired` collapse to FREE per brief §05.
const GRANTING_STATUSES = new Set(["trialing", "active", "past_due"]);

function mapPlan(
  plan: string | null | undefined,
  trial: boolean,
): Entitlements {
  switch (plan) {
    case "starter":
      return { ...STARTER, trial };
    case "pro":
      return { ...PRO, trial };
    case "elite":
      return { ...ELITE, trial };
    default:
      return FREE;
  }
}

export async function getEntitlements(userId: string): Promise<Entitlements> {
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  });
  if (!sub || !GRANTING_STATUSES.has(sub.status)) return FREE;
  const trial = sub.status === "trialing";
  return mapPlan(sub.plan, trial);
}
