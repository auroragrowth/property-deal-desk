// Plan registry — Stripe lookup_keys are the single source of truth.
// Per brief §05 / kickoff engineering rules: never hardcode price IDs anywhere.
// `node scripts/setup-stripe-products.mjs` creates Stripe products/prices with
// these lookup_keys; checkout looks them up at runtime.

export type PlanLookupKey =
  | "starter_monthly"
  | "pro_monthly"
  | "elite_monthly";

export type PlanDefinition = {
  lookupKey: PlanLookupKey;
  name: string;
  description: string;
  pricePence: number;
  features: string[];
};

export const PLANS: Record<PlanLookupKey, PlanDefinition> = {
  starter_monthly: {
    lookupKey: "starter_monthly",
    name: "Starter",
    description: "For investors getting started.",
    pricePence: 4900,
    features: [
      "Up to 25 watchlist items",
      "10 saved deals",
      "BTL analyzer",
      "Email support",
    ],
  },
  pro_monthly: {
    lookupKey: "pro_monthly",
    name: "Pro",
    description: "For serious portfolio builders.",
    pricePence: 9900,
    features: [
      "200 watchlist items",
      "Unlimited saved deals",
      "BTL analyzer",
      "Saved filters",
      "Priority email support",
    ],
  },
  elite_monthly: {
    lookupKey: "elite_monthly",
    name: "Elite",
    description: "For professionals.",
    pricePence: 14900,
    features: [
      "Unlimited watchlist & deals",
      "BTL analyzer",
      "Future engines (BRRR, HMO, SA — v2.x)",
      "Direct support",
    ],
  },
};

export function isPlanLookupKey(value: unknown): value is PlanLookupKey {
  return (
    value === "starter_monthly" ||
    value === "pro_monthly" ||
    value === "elite_monthly"
  );
}

export function planFromLookupKey(
  lookupKey: string | null | undefined,
): "free" | "starter" | "pro" | "elite" {
  switch (lookupKey) {
    case "starter_monthly":
      return "starter";
    case "pro_monthly":
      return "pro";
    case "elite_monthly":
      return "elite";
    default:
      return "free";
  }
}
