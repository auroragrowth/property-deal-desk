import { PLANS } from "@/features/billing/plans";
import { CheckoutButton } from "@/features/billing/checkout-button";

export default function OnboardingPlanPage() {
  const plans = Object.values(PLANS);
  return (
    <main className="bg-bg-page mx-auto max-w-marketing p-8">
      <header className="mb-10 text-center">
        <p className="text-text-tertiary mb-3 font-mono text-xs tracking-[0.18em] uppercase">
          02 / Pricing
        </p>
        <h1 className="text-text-primary font-serif text-4xl">
          Pick a <em className="text-text-accent">plan</em>.
        </h1>
        <p className="text-text-secondary mt-3 text-base">
          14-day free trial. Card captured. Cancel anytime.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan, i) => (
          <article
            key={plan.lookupKey}
            className={[
              "rounded-lg p-6",
              i === 1
                ? "bg-bg-strong text-text-on-strong border-0"
                : "bg-bg-surface border-border text-text-primary border-[0.5px]",
            ].join(" ")}
          >
            <h2 className="font-serif text-2xl">{plan.name}</h2>
            <p
              className={
                i === 1
                  ? "mt-1 text-sm opacity-70"
                  : "text-text-secondary mt-1 text-sm"
              }
            >
              {plan.description}
            </p>
            <div className="mt-5 flex items-baseline gap-1">
              <span className="font-serif text-4xl">
                £{(plan.pricePence / 100).toFixed(0)}
              </span>
              <span
                className={
                  i === 1 ? "text-sm opacity-70" : "text-text-tertiary text-sm"
                }
              >
                /month
              </span>
            </div>
            <ul className="mt-6 space-y-2 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span aria-hidden className="opacity-60">
                    ▸
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <CheckoutButton
              lookupKey={plan.lookupKey}
              className="mt-7"
            />
          </article>
        ))}
      </div>
      <p className="text-text-tertiary mt-8 text-center text-sm">
        Plan changes via the Customer Portal after your first sign-up. VAT
        added at checkout for UK customers (week 12).
      </p>
    </main>
  );
}
