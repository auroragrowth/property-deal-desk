import Link from "next/link";
import {
  BrowserFrame,
  DealVerdictMock,
  MarketScannerMock,
  WatchlistRowsMock,
} from "@/features/marketing/mockups";

export default function MarketingPage() {
  return (
    <main id="main">
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="text-text-tertiary mb-4 font-mono text-xs tracking-[0.18em] uppercase">
              Buy-to-let, on a single screen
            </p>
            <h1 className="text-text-primary font-serif text-5xl leading-tight md:text-6xl">
              Property deals,{" "}
              <em className="text-text-accent">worth a second look</em>.
            </h1>
            <p className="text-text-secondary mt-5 max-w-xl text-lg">
              Find, analyse, and track UK buy-to-let deals on a single screen
              — with a verdict you can defend at the bank.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/sign-up"
                className="bg-accent text-accent-on hover:bg-accent-hover focus-visible:ring-accent-soft inline-flex h-12 items-center rounded-md px-6 text-sm font-medium focus-visible:ring-[3px] focus-visible:outline-none"
              >
                Start 14-day free trial
              </Link>
              <Link
                href="#how"
                className="border-border-strong text-text-primary hover:bg-bg-surface-2 inline-flex h-12 items-center rounded-md border-[0.5px] bg-transparent px-5 text-sm font-medium"
              >
                See how it works
              </Link>
            </div>
            <p className="text-text-tertiary mt-5 text-xs">
              Card captured at checkout, not now. Cancel anytime.
            </p>
          </div>

          <div className="lg:pl-6">
            <BrowserFrame url="dealdesk.com/deal/12-brookfield">
              <DealVerdictMock />
            </BrowserFrame>
          </div>
        </div>
      </section>

      {/* ─── Problem ──────────────────────────────────────────── */}
      <section className="border-border border-y-[0.5px] py-16">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <p className="text-text-tertiary mb-3 font-mono text-xs tracking-[0.18em] uppercase">
            The hard truth
          </p>
          <h2 className="text-text-primary font-serif text-3xl md:text-4xl">
            Most BTL deals don&apos;t pencil out.
          </h2>
          <p className="text-text-secondary mt-5 text-lg leading-relaxed">
            You&apos;ve scrolled Rightmove until your eyes hurt. Plugged
            numbers into a spreadsheet that crashes. Booked viewings on
            properties that were never going to cashflow. The good deals
            move in days — your maths takes longer than that.
          </p>
        </div>
      </section>

      {/* ─── How it works ────────────────────────────────────── */}
      <section id="how" className="py-20">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-text-tertiary mb-3 font-mono text-xs tracking-[0.18em] uppercase">
              How DealDesk works
            </p>
            <h2 className="text-text-primary font-serif text-3xl md:text-4xl">
              Paste. Analyse.{" "}
              <em className="text-text-accent">Decide.</em>
            </h2>
            <p className="text-text-secondary mt-4 text-lg">
              Three steps from listing to verdict. No spreadsheets.
            </p>
          </div>

          <ol className="mt-14 grid gap-10 md:grid-cols-3">
            <li>
              <p className="text-accent font-mono text-xs tracking-[0.18em] uppercase">
                Step 1
              </p>
              <h3 className="text-text-primary mt-2 font-serif text-2xl">
                Paste a listing
              </h3>
              <p className="text-text-secondary mt-3 text-sm leading-relaxed">
                Drop a Rightmove, Zoopla or Purplebricks URL. Or scan the
                live UK market through our PropertyData feed (Pro plan).
                The property lands in your feed in seconds.
              </p>
            </li>
            <li>
              <p className="text-accent font-mono text-xs tracking-[0.18em] uppercase">
                Step 2
              </p>
              <h3 className="text-text-primary mt-2 font-serif text-2xl">
                Click analyse
              </h3>
              <p className="text-text-secondary mt-3 text-sm leading-relaxed">
                Deterministic BTL maths runs against your assumptions:
                mortgage, stamp duty, ROI, cashflow, gross yield. Plus a{" "}
                <strong>+2% rate stress test</strong> on every deal.
              </p>
            </li>
            <li>
              <p className="text-accent font-mono text-xs tracking-[0.18em] uppercase">
                Step 3
              </p>
              <h3 className="text-text-primary mt-2 font-serif text-2xl">
                Read the verdict
              </h3>
              <p className="text-text-secondary mt-3 text-sm leading-relaxed">
                Pass / Marginal / Fail in plain English. Reasons listed,
                not buried. Edit assumptions inline, re-run, watch the
                verdict flip — every run preserved.
              </p>
            </li>
          </ol>
        </div>
      </section>

      {/* ─── Mock: Market Scanner ────────────────────────────── */}
      <section className="bg-bg-surface border-border border-y-[0.5px] py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <BrowserFrame url="dealdesk.com/market">
              <MarketScannerMock />
            </BrowserFrame>
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-text-tertiary mb-3 font-mono text-xs tracking-[0.18em] uppercase">
              Live market scanner
            </p>
            <h2 className="text-text-primary font-serif text-3xl md:text-4xl">
              The whole UK market,{" "}
              <em className="text-text-accent">in one search</em>.
            </h2>
            <p className="text-text-secondary mt-5 text-base leading-relaxed">
              Pick a postcode and a radius. We scan the live market via
              PropertyData — 75,000 active listings, filtered against
              proven investor strategies (BMV, repossessions, back on
              market, motivated sellers).
            </p>
            <ul className="text-text-primary mt-6 space-y-2 text-sm">
              <li className="flex gap-2">
                <span aria-hidden className="text-accent">
                  ▸
                </span>
                <span>39 pre-built sourcing strategies</span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden className="text-accent">
                  ▸
                </span>
                <span>Save to watchlist with one click</span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden className="text-accent">
                  ▸
                </span>
                <span>Live data, refreshed daily</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ─── Mock: Watchlist ─────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-2">
          <div>
            <p className="text-text-tertiary mb-3 font-mono text-xs tracking-[0.18em] uppercase">
              Watchlist + verdicts
            </p>
            <h2 className="text-text-primary font-serif text-3xl md:text-4xl">
              Track only what{" "}
              <em className="text-text-accent">passes</em>.
            </h2>
            <p className="text-text-secondary mt-5 text-base leading-relaxed">
              Saved properties show their latest verdict at a glance.
              Filter to passes only when you&apos;re ready to make calls.
              Edit assumptions inline — every run is preserved as
              append-only history, so you can show your working.
            </p>
            <ul className="text-text-primary mt-6 space-y-2 text-sm">
              <li className="flex gap-2">
                <span aria-hidden className="text-accent">
                  ▸
                </span>
                <span>Pass / Marginal / Fail at a glance</span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden className="text-accent">
                  ▸
                </span>
                <span>Sort by date, price, postcode</span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden className="text-accent">
                  ▸
                </span>
                <span>Append-only audit trail (defend at the bank)</span>
              </li>
            </ul>
          </div>
          <div>
            <BrowserFrame url="dealdesk.com/watchlist">
              <WatchlistRowsMock />
            </BrowserFrame>
          </div>
        </div>
      </section>

      {/* ─── Features grid ───────────────────────────────────── */}
      <section className="bg-bg-surface border-border border-y-[0.5px] py-20">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-text-tertiary mb-3 font-mono text-xs tracking-[0.18em] uppercase">
              What&apos;s in the box
            </p>
            <h2 className="text-text-primary font-serif text-3xl md:text-4xl">
              Built for{" "}
              <em className="text-text-accent">working investors</em>.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                t: "Deterministic engine",
                d: "Same inputs, same outputs. Defend any verdict.",
              },
              {
                t: "+2% rate stress",
                d: "Built-in stress test on every analysis.",
              },
              {
                t: "Stamp duty + ROI + yield",
                d: "Accurate UK stamp duty bands. Cash-on-cash ROI. Gross + net yield.",
              },
              {
                t: "Append-only history",
                d: "Every re-run preserved. No silent overwrites.",
              },
              {
                t: "Mobile-ready",
                d: "Works at 360px. View deals on the train, save on the platform.",
              },
              {
                t: "Your data, in London",
                d: "Hosted in Supabase eu-west-2. UK-resident. ICO-registered.",
              },
            ].map((f) => (
              <div
                key={f.t}
                className="border-border bg-bg-page rounded-lg border-[0.5px] p-6"
              >
                <h3 className="text-text-primary font-serif text-lg">
                  {f.t}
                </h3>
                <p className="text-text-secondary mt-2 text-sm leading-relaxed">
                  {f.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing teaser ──────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <p className="text-text-tertiary mb-3 font-mono text-xs tracking-[0.18em] uppercase">
            Pricing
          </p>
          <h2 className="text-text-primary font-serif text-3xl md:text-4xl">
            From <em className="text-text-accent">£29</em> a month.
          </h2>
          <p className="text-text-secondary mt-4 text-lg">
            Three tiers. 14-day trial. Cancel any time from the customer
            portal — no email, no friction.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/sign-up"
              className="bg-accent text-accent-on hover:bg-accent-hover inline-flex h-12 items-center rounded-md px-6 text-sm font-medium"
            >
              Start free trial
            </Link>
            <Link
              href="/onboarding/plan"
              className="border-border-strong text-text-primary hover:bg-bg-surface-2 inline-flex h-12 items-center rounded-md border-[0.5px] bg-transparent px-5 text-sm font-medium"
            >
              Compare plans
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────────── */}
      <section className="bg-bg-surface border-border border-y-[0.5px] py-20">
        <div className="mx-auto max-w-3xl px-5">
          <p className="text-text-tertiary mb-3 text-center font-mono text-xs tracking-[0.18em] uppercase">
            FAQ
          </p>
          <h2 className="text-text-primary mb-10 text-center font-serif text-3xl">
            Quick answers.
          </h2>
          <dl className="divide-border divide-y border-y-[0.5px] border-border">
            {[
              {
                q: "Which sources work?",
                a: "Rightmove, Zoopla and Purplebricks via paste. PropertyData live feed (Pro plan and above) for the whole UK market scanner.",
              },
              {
                q: "Is this financial advice?",
                a: "No. DealDesk runs your assumptions through a deterministic model. Verdicts are estimates — always check with a qualified professional before transacting.",
              },
              {
                q: "Can I cancel?",
                a: "Yes, any time from Settings → Manage billing. Cancellation takes effect at the end of the period, then your workspace becomes read-only.",
              },
              {
                q: "Where's my data stored?",
                a: "Supabase Postgres, London region (eu-west-2). UK-resident, ICO-registered. Stripe processes payments under their own terms.",
              },
              {
                q: "Why a 14-day trial?",
                a: "Long enough to paste 5–10 properties, run a few analyses, decide if the maths matches your gut. Card captured at checkout, not now.",
              },
            ].map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="text-text-primary flex cursor-pointer items-baseline justify-between text-base font-medium">
                  <span>{f.q}</span>
                  <span
                    aria-hidden
                    className="text-text-tertiary text-2xl leading-none transition group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="text-text-secondary mt-3 text-sm leading-relaxed">
                  {f.a}
                </p>
              </details>
            ))}
          </dl>
        </div>
      </section>

      {/* ─── Final CTA ───────────────────────────────────────── */}
      <section className="py-24">
        <div className="bg-bg-strong text-text-on-strong mx-auto flex max-w-5xl flex-col items-center gap-6 rounded-2xl px-6 py-14 text-center">
          <p className="font-mono text-xs tracking-[0.18em] uppercase opacity-70">
            Ready when you are
          </p>
          <h2 className="font-serif text-3xl md:text-4xl">
            Find your next deal{" "}
            <em className="text-accent">this week</em>.
          </h2>
          <p className="max-w-xl opacity-80">
            14-day trial. Card captured at checkout, not now. Cancel
            anytime from the portal.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link
              href="/sign-up"
              className="bg-accent text-accent-on hover:bg-accent-hover inline-flex h-12 items-center rounded-md px-6 text-sm font-medium"
            >
              Start free trial
            </Link>
            <Link
              href="/sign-in"
              className="text-text-on-strong hover:bg-white/10 inline-flex h-12 items-center rounded-md border border-white/20 bg-transparent px-5 text-sm font-medium"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
