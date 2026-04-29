import Link from "next/link";

export default function MarketingPage() {
  return (
    <main className="bg-bg-page mx-auto flex min-h-screen max-w-marketing flex-col items-center justify-center gap-6 px-6 py-16">
      <p className="text-text-tertiary font-mono text-xs tracking-[0.18em] uppercase">
        01 / DealDesk
      </p>
      <h1 className="text-text-primary text-center font-serif text-5xl leading-tight md:text-6xl">
        Property deals,{" "}
        <em className="text-text-accent">worth a second look</em>.
      </h1>
      <p className="text-text-secondary max-w-xl text-center text-lg">
        Find, analyse, and track UK buy-to-let deals on a single screen — with
        a verdict you can defend.
      </p>
      <div className="mt-2 flex gap-3">
        <Link
          href="/sign-up"
          className="bg-accent text-accent-on hover:bg-accent-hover active:bg-accent-pressed inline-flex h-11 items-center rounded-md px-6 text-sm font-medium"
        >
          Start free trial
        </Link>
        <Link
          href="/sign-in"
          className="border-border-strong text-text-primary hover:bg-bg-surface-2 inline-flex h-11 items-center rounded-md border-[0.5px] px-5 text-sm font-medium"
        >
          Sign in
        </Link>
      </div>
      <p className="text-text-tertiary mt-4 text-xs">
        14-day trial. Card captured. Cancel anytime.
      </p>
    </main>
  );
}
