import Link from "next/link";

export const metadata = { title: "Terms of Service · DealDesk" };

export default function TermsPage() {
  return (
    <main id="main" className="bg-bg-page mx-auto max-w-prose p-8">
      <p className="text-text-tertiary mb-2 font-mono text-xs tracking-[0.18em] uppercase">
        Legal / Terms
      </p>
      <h1 className="text-text-primary mb-6 font-serif text-3xl">
        Terms of Service
      </h1>
      <p className="text-text-secondary mb-4 text-sm">
        Last updated: 30 April 2026.
      </p>

      <section className="text-text-primary space-y-4 text-sm leading-relaxed">
        <p>
          DealDesk (&ldquo;we&rdquo;, &ldquo;us&rdquo;) provides a software
          service for UK property investors. By creating an account, you agree
          to these terms.
        </p>

        <h2 className="text-text-primary mt-6 font-serif text-xl">
          1. The service
        </h2>
        <p>
          DealDesk lets you ingest property listings, run buy-to-let analyses,
          and save properties for review. Outputs are estimates based on the
          assumptions you provide. They are not financial, legal, or tax
          advice. Always check with a qualified professional before
          transacting.
        </p>

        <h2 className="text-text-primary mt-6 font-serif text-xl">
          2. Subscriptions
        </h2>
        <p>
          We offer a 14-day free trial. Your card is captured at sign-up and
          charged when the trial ends, unless you cancel. You can cancel any
          time via Settings &rarr; Manage billing. Cancellation takes effect at
          the end of the current period; the workspace becomes read-only at
          that point.
        </p>

        <h2 className="text-text-primary mt-6 font-serif text-xl">
          3. Acceptable use
        </h2>
        <p>
          Don&apos;t scrape the service, automate large-scale ingestion, or
          attempt to access data belonging to other users. We may suspend
          accounts that breach this section.
        </p>

        <h2 className="text-text-primary mt-6 font-serif text-xl">
          4. Liability
        </h2>
        <p>
          To the maximum extent permitted by law, our liability is limited to
          the fees you have paid us in the 12 months prior to the claim. We
          are not liable for investment losses, opportunity cost, or
          consequential damages arising from your use of the service.
        </p>

        <h2 className="text-text-primary mt-6 font-serif text-xl">
          5. Changes
        </h2>
        <p>
          We may update these terms. Material changes will be notified by
          email. Continued use after notification means you accept the new
          terms.
        </p>

        <h2 className="text-text-primary mt-6 font-serif text-xl">
          6. Contact
        </h2>
        <p>
          Questions: hello@dealdesk.com. Registered in the United Kingdom.
        </p>
      </section>

      <p className="text-text-tertiary mt-10 text-sm">
        See also our{" "}
        <Link
          href="/privacy"
          className="text-text-accent underline underline-offset-2"
        >
          privacy policy
        </Link>
        .
      </p>
    </main>
  );
}
