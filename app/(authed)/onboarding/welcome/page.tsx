import Link from "next/link";

export default async function WelcomePage() {
  return (
    <main className="bg-bg-page mx-auto max-w-prose p-12 text-center">
      <p className="text-text-tertiary mb-3 font-mono text-xs tracking-[0.18em] uppercase">
        02 / Welcome
      </p>
      <h1 className="text-text-primary font-serif text-4xl">
        You&apos;re <em className="text-text-accent">in</em>.
      </h1>
      <p className="text-text-secondary mt-4 text-base">
        Your 14-day trial has started. We&apos;ll email you 3 days before it ends.
      </p>
      <Link
        href="/dashboard"
        className="bg-bg-strong text-text-on-strong mt-8 inline-flex h-10 items-center rounded-md px-5 text-sm font-medium"
      >
        Go to dashboard
      </Link>
    </main>
  );
}
