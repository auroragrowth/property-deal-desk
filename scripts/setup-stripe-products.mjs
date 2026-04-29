// Idempotent Stripe products + prices setup for v1 dev.
// Run with:
//   set -a && source .env.local && set +a && pnpm stripe:setup
//
// Will refuse to run with a live key. Safe to run repeatedly — it skips
// any plan whose lookup_key already has an active price.

import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY not set");
  process.exit(1);
}
if (!key.startsWith("sk_test_")) {
  console.error(
    `Refusing to run: STRIPE_SECRET_KEY does not look like a TEST key (starts with "${key.slice(0, 8)}").`,
  );
  console.error("Run this only against a Stripe test account.");
  process.exit(1);
}

const stripe = new Stripe(key, { apiVersion: "2024-12-18.acacia" });

const plans = [
  {
    lookupKey: "starter_monthly",
    name: "DealDesk Starter",
    description: "For investors getting started.",
    pence: 4900,
  },
  {
    lookupKey: "pro_monthly",
    name: "DealDesk Pro",
    description: "For serious portfolio builders.",
    pence: 9900,
  },
  {
    lookupKey: "elite_monthly",
    name: "DealDesk Elite",
    description: "For professionals.",
    pence: 14900,
  },
];

for (const p of plans) {
  const existing = await stripe.prices.list({
    lookup_keys: [p.lookupKey],
    active: true,
    limit: 1,
  });
  if (existing.data.length > 0) {
    console.log(`✓ ${p.lookupKey} already exists (price=${existing.data[0].id})`);
    continue;
  }

  const product = await stripe.products.create({
    name: p.name,
    description: p.description,
    metadata: { dealdesk_plan: p.lookupKey.replace("_monthly", "") },
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: p.pence,
    currency: "gbp",
    recurring: { interval: "month" },
    lookup_key: p.lookupKey,
    metadata: { dealdesk_plan: p.lookupKey.replace("_monthly", "") },
  });

  console.log(`+ ${p.lookupKey}: product=${product.id} price=${price.id}`);
}

console.log("done");
