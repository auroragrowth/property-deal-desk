import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { subscriptions } from "@/lib/db/schema";
import { ManageBillingButton } from "@/features/billing/manage-billing-button";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  });

  return (
    <main id="main" className="bg-bg-page mx-auto max-w-prose p-8">
      <header className="mb-8">
        <p className="text-text-tertiary mb-2 font-mono text-xs tracking-[0.18em] uppercase">
          05 / Settings
        </p>
        <h1 className="text-text-primary font-serif text-3xl">Account</h1>
      </header>

      <section className="mb-10">
        <h2 className="text-text-secondary mb-3 text-xs font-medium tracking-wide uppercase">
          Profile
        </h2>
        <dl className="border-border bg-bg-surface divide-border divide-y rounded-lg border-[0.5px]">
          <div className="flex items-baseline justify-between p-4">
            <dt className="text-text-tertiary text-sm">Email</dt>
            <dd className="text-text-primary text-sm">
              {user?.emailAddresses[0]?.emailAddress ?? "—"}
            </dd>
          </div>
          <div className="flex items-baseline justify-between p-4">
            <dt className="text-text-tertiary text-sm">Name</dt>
            <dd className="text-text-primary text-sm">{user?.fullName ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="mb-10">
        <h2 className="text-text-secondary mb-3 text-xs font-medium tracking-wide uppercase">
          Billing
        </h2>
        {sub ? (
          <div className="border-border bg-bg-surface space-y-3 rounded-lg border-[0.5px] p-5">
            <div className="flex items-baseline justify-between">
              <span className="text-text-tertiary text-sm">Plan</span>
              <span className="text-text-primary text-sm capitalize">
                {sub.plan}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-text-tertiary text-sm">Status</span>
              <span className="text-text-primary text-sm">{sub.status}</span>
            </div>
            {sub.trialEnd && sub.status === "trialing" && (
              <div className="flex items-baseline justify-between">
                <span className="text-text-tertiary text-sm">Trial ends</span>
                <span className="text-text-primary text-sm">
                  {new Date(sub.trialEnd).toLocaleDateString("en-GB")}
                </span>
              </div>
            )}
            {sub.currentPeriodEnd && (
              <div className="flex items-baseline justify-between">
                <span className="text-text-tertiary text-sm">
                  {sub.cancelAtPeriodEnd ? "Cancels on" : "Renews on"}
                </span>
                <span className="text-text-primary text-sm">
                  {new Date(sub.currentPeriodEnd).toLocaleDateString("en-GB")}
                </span>
              </div>
            )}
            <div className="pt-2">
              <ManageBillingButton />
            </div>
          </div>
        ) : (
          <div className="border-border bg-bg-surface rounded-lg border-[0.5px] p-5">
            <p className="text-text-secondary text-sm">
              No active subscription.{" "}
              <Link
                href="/onboarding/plan"
                className="text-text-accent underline underline-offset-2"
              >
                Pick a plan
              </Link>
              .
            </p>
          </div>
        )}
      </section>

      <p className="text-text-tertiary text-sm">
        Email change, password change, 2FA toggle, and account deletion ship by
        week 12.
      </p>

      <footer className="border-border text-text-tertiary mt-12 flex gap-4 border-t-[0.5px] pt-6 text-xs">
        <Link
          href="/terms"
          className="hover:text-text-primary underline underline-offset-2"
        >
          Terms
        </Link>
        <Link
          href="/privacy"
          className="hover:text-text-primary underline underline-offset-2"
        >
          Privacy
        </Link>
      </footer>
    </main>
  );
}
