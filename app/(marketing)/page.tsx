import Link from "next/link";

export default function MarketingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-5xl font-light tracking-tight">DealDesk</h1>
      <p className="max-w-xl text-center text-lg text-neutral-600">
        Find, analyse, and track UK buy-to-let deals.
      </p>
      <div className="flex gap-3">
        <Link
          href="/sign-up"
          className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white"
        >
          Sign up
        </Link>
        <Link
          href="/sign-in"
          className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-medium"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
