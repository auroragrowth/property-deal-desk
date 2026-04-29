import Stripe from "stripe";

// Allow module load without a real key so `next build` and route compilation
// don't crash before we've configured Stripe. Real API calls will surface a
// clear auth error from Stripe at runtime.
const secretKey =
  process.env.STRIPE_SECRET_KEY ||
  "sk_test_placeholder_set_STRIPE_SECRET_KEY_to_enable_billing";

// Pin to a known stable API version. Cast tells TypeScript this matches the
// SDK's expected literal even if the SDK was bumped to a newer version.
export const stripe = new Stripe(secretKey, {
  apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
});
