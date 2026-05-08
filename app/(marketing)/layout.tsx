import Link from "next/link";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-bg-page text-text-primary min-h-screen">
      <header className="border-border bg-bg-page/80 sticky top-0 z-20 border-b-[0.5px] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-5">
          <Link href="/" className="font-serif text-[22px] leading-none">
            <span>Deal</span>
            <span className="text-accent italic">Desk</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/sign-in"
              className="text-text-secondary hover:text-text-primary inline-flex h-10 items-center px-3 text-sm"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="bg-bg-strong text-text-on-strong hover:opacity-90 inline-flex h-10 items-center rounded-md px-4 text-sm font-medium"
            >
              Start trial
            </Link>
          </nav>
        </div>
      </header>

      {children}

      <footer className="border-border mt-24 border-t-[0.5px]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-5 py-10 sm:flex-row">
          <div className="text-center sm:text-left">
            <p className="font-serif text-lg">
              <span>Deal</span>
              <span className="text-accent italic">Desk</span>
            </p>
            <p className="text-text-tertiary mt-1 text-xs">
              UK property investor SaaS · Made in Peterborough
            </p>
          </div>
          <div className="flex gap-5 text-sm">
            <Link
              href="/terms"
              className="text-text-secondary hover:text-text-primary underline-offset-2 hover:underline"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-text-secondary hover:text-text-primary underline-offset-2 hover:underline"
            >
              Privacy
            </Link>
            <a
              href="mailto:hello@dealdesk.com"
              className="text-text-secondary hover:text-text-primary underline-offset-2 hover:underline"
            >
              hello@dealdesk.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
