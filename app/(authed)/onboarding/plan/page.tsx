import { PLANS } from "@/features/billing/plans";
import { CheckoutButton } from "@/features/billing/checkout-button";

export default function OnboardingPlanPage() {
  const plans = Object.values(PLANS);
  return (
    <main className="bg-bg-page max-w-marketing mx-auto p-8">
      <header className="mb-10 text-center">
        <p className="text-accent mb-3 font-mono text-xs tracking-[0.18em] uppercase">
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
        {plans.map((plan, i) => {
          const recommended = i === 1; // middle plan = Pro
          return (
            <article
              key={plan.lookupKey}
              className={[
                "bg-bg-surface text-text-primary rounded-lg p-6",
                recommended
                  ? "border-accent border-2"
                  : "border-border-strong border-[0.5px]",
              ].join(" ")}
            >
              <div className="flex items-baseline justify-between">
                <h2 className="font-serif text-2xl">{plan.name}</h2>
                {recommended && (
                  <span className="text-accent font-mono text-[10px] tracking-[0.18em] uppercase">
                    Recommended
                  </span>
                )}
              </div>
              <p className="text-text-secondary mt-1 text-sm">
                {plan.description}
              </p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-text-primary font-serif text-4xl">
                  £{(plan.pricePence / 100).toFixed(0)}
                </span>
                <span className="text-text-tertiary text-sm">/month</span>
              </div>
              <ul className="text-text-primary mt-6 space-y-2 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span aria-hidden className="text-accent">
                      ▸
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <CheckoutButton
                lookupKey={plan.lookupKey}
                variant={recommended ? "accent" : "primary"}
                className="mt-7"
              />
            </article>
          );
        })}
      </div>

      <p className="text-text-tertiary mt-8 text-center text-sm">
        Plan changes via the Customer Portal after sign-up. UK VAT added at
        checkout (week 12).
      </p>
    </main>
  );
}
