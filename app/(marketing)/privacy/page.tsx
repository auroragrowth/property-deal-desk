import Link from "next/link";

export const metadata = { title: "Privacy Policy · DealDesk" };

export default function PrivacyPage() {
  return (
    <main id="main" className="bg-bg-page mx-auto max-w-prose p-8">
      <p className="text-text-tertiary mb-2 font-mono text-xs tracking-[0.18em] uppercase">
        Legal / Privacy
      </p>
      <h1 className="text-text-primary mb-6 font-serif text-3xl">
        Privacy Policy
      </h1>
      <p className="text-text-secondary mb-4 text-sm">
        Last updated: 30 April 2026.
      </p>

      <section className="text-text-primary space-y-4 text-sm leading-relaxed">
        <p>
          DealDesk is a UK-based service. We&apos;re registered with the ICO
          and treat the GDPR/UK GDPR as the floor, not the ceiling.
        </p>

        <h2 className="text-text-primary mt-6 font-serif text-xl">
          What we collect
        </h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>Account data via Clerk: email, name, sign-in metadata.</li>
          <li>
            Billing data via Stripe: card last-4, billing address, invoice
            history. We never see or store full card numbers.
          </li>
          <li>
            Product data: properties you paste, watchlist entries, saved
            filters, and analysis runs you trigger.
          </li>
          <li>
            Operational data: errors (Sentry), product analytics events
            (PostHog, EU cloud), server logs.
          </li>
        </ul>

        <h2 className="text-text-primary mt-6 font-serif text-xl">
          Where it lives
        </h2>
        <p>
          Application data is stored in Supabase Postgres (London, eu-west-2).
          Stripe processes payments under their own terms. Clerk handles
          authentication. PostHog is on the EU cloud. Resend sends transactional
          email.
        </p>

        <h2 className="text-text-primary mt-6 font-serif text-xl">
          Cookies
        </h2>
        <p>
          Strictly necessary cookies (sign-in, session). Analytics cookies via
          PostHog after you click &ldquo;Accept&rdquo; on the cookie banner.
          You can clear them any time via your browser.
        </p>

        <h2 className="text-text-primary mt-6 font-serif text-xl">
          Your rights
        </h2>
        <p>
          You can request access to, correction of, or deletion of your data
          by emailing{" "}
          <a
            href="mailto:hello@dealdesk.com"
            className="text-text-accent underline underline-offset-2"
          >
            hello@dealdesk.com
          </a>
          . We respond within 30 days.
        </p>

        <h2 className="text-text-primary mt-6 font-serif text-xl">
          Changes
        </h2>
        <p>
          Material changes are notified by email. Continued use after
          notification means you accept the new policy.
        </p>
      </section>

      <p className="text-text-tertiary mt-10 text-sm">
        See also our{" "}
        <Link
          href="/terms"
          className="text-text-accent underline underline-offset-2"
        >
          terms of service
        </Link>
        .
      </p>
    </main>
  );
}
