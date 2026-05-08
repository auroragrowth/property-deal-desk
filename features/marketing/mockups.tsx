// Inline UI mockups for the marketing landing page.
// Server-rendered, design-token-driven, no placeholder images.

export function BrowserFrame({
  children,
  url,
}: {
  children: React.ReactNode;
  url: string;
}) {
  return (
    <div className="border-border-strong bg-bg-page rounded-xl border-[0.5px] shadow-2xl">
      <div className="border-border bg-bg-surface flex items-center gap-2 rounded-t-xl border-b-[0.5px] px-4 py-3">
        <div className="flex gap-1.5">
          <span className="bg-fail-border h-2.5 w-2.5 rounded-full" />
          <span className="bg-marginal-border h-2.5 w-2.5 rounded-full" />
          <span className="bg-pass-border h-2.5 w-2.5 rounded-full" />
        </div>
        <div className="border-border bg-bg-page text-text-tertiary mx-auto max-w-md flex-1 truncate rounded-md border-[0.5px] px-3 py-1 font-mono text-[10px]">
          {url}
        </div>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}

export function DealVerdictMock() {
  return (
    <div className="border-border bg-bg-surface rounded-lg border-[0.5px] p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-text-tertiary font-mono text-[10px] tracking-[0.18em] uppercase">
          Verdict
        </p>
        <span className="bg-pass-bg text-pass-fg border-pass-border rounded-full border-[0.5px] px-3 py-0.5 text-xs font-medium">
          PASS
        </span>
      </div>
      <h3 className="text-text-primary mt-3 font-serif text-2xl">
        12 Brookfield Road, PE1 2AB
      </h3>
      <p className="text-text-secondary mt-1 text-sm">
        2-bed terrace · £165,000 asking
      </p>

      <dl className="mt-5 grid grid-cols-3 gap-4">
        <div>
          <dt className="text-text-tertiary font-mono text-[10px] tracking-wide uppercase">
            Cashflow
          </dt>
          <dd className="text-text-primary mt-1 font-serif text-lg">£287</dd>
          <dd className="text-text-tertiary text-[11px]">/mo</dd>
        </div>
        <div>
          <dt className="text-text-tertiary font-mono text-[10px] tracking-wide uppercase">
            ROI
          </dt>
          <dd className="text-text-primary mt-1 font-serif text-lg">9.4%</dd>
          <dd className="text-text-tertiary text-[11px]">cash-on-cash</dd>
        </div>
        <div>
          <dt className="text-text-tertiary font-mono text-[10px] tracking-wide uppercase">
            Yield
          </dt>
          <dd className="text-text-primary mt-1 font-serif text-lg">6.5%</dd>
          <dd className="text-text-tertiary text-[11px]">gross</dd>
        </div>
      </dl>

      <div className="border-border mt-5 border-t-[0.5px] pt-4">
        <p className="text-text-tertiary font-mono text-[10px] tracking-wide uppercase">
          +2% rate stress
        </p>
        <p className="text-text-primary mt-1 text-sm">
          Cashflow holds at <span className="font-medium">£62/mo</span>{" "}
          <span className="text-text-tertiary">— still positive.</span>
        </p>
      </div>

      <ul className="mt-4 space-y-1 text-sm">
        <li className="text-pass-fg flex gap-2">
          <span aria-hidden>▸</span>
          <span>Cashflow above your £200/mo threshold</span>
        </li>
        <li className="text-pass-fg flex gap-2">
          <span aria-hidden>▸</span>
          <span>ROI above your 8% threshold</span>
        </li>
        <li className="text-pass-fg flex gap-2">
          <span aria-hidden>▸</span>
          <span>Survives +2% stress</span>
        </li>
      </ul>
    </div>
  );
}

export function MarketScannerMock() {
  const items = [
    { addr: "Westgate, PE1", beds: 3, price: "£189k", days: 4 },
    { addr: "Park Road, PE2", beds: 2, price: "£142k", days: 9 },
    { addr: "Hawthorne Ave, PE3", beds: 3, price: "£215k", days: 1 },
  ];
  return (
    <div className="border-border bg-bg-surface rounded-lg border-[0.5px] p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-text-primary font-serif text-xl">
          PE1 · 5 mile radius
        </h3>
        <span className="text-text-tertiary font-mono text-[10px] tracking-wide">
          74 LIVE LISTINGS
        </span>
      </div>
      <ul className="divide-border divide-y">
        {items.map((it) => (
          <li
            key={it.addr}
            className="flex items-center justify-between gap-3 py-3"
          >
            <div className="flex-1">
              <p className="text-text-primary text-sm font-medium">
                {it.addr}
              </p>
              <p className="text-text-tertiary text-xs">
                {it.beds} bed · {it.days}d on market
              </p>
            </div>
            <p className="text-text-primary font-serif text-base">
              {it.price}
            </p>
            <span className="text-accent border-accent/40 rounded-full border-[0.5px] px-2 py-0.5 font-mono text-[10px] tracking-wide">
              SAVE
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WatchlistRowsMock() {
  const rows = [
    { addr: "12 Brookfield Rd", verdict: "PASS", price: "£165k" },
    { addr: "8 Mill Lane", verdict: "MARGINAL", price: "£198k" },
    { addr: "21 Avenue Rd", verdict: "FAIL", price: "£245k" },
  ];
  const palette = {
    PASS: "bg-pass-bg text-pass-fg border-pass-border",
    MARGINAL: "bg-marginal-bg text-marginal-fg border-marginal-border",
    FAIL: "bg-fail-bg text-fail-fg border-fail-border",
  } as const;
  return (
    <div className="border-border bg-bg-surface overflow-hidden rounded-lg border-[0.5px]">
      <div className="border-border bg-bg-surface-2 border-b-[0.5px] px-4 py-3">
        <p className="text-text-tertiary font-mono text-[10px] tracking-[0.18em] uppercase">
          Watchlist · 3 of 25
        </p>
      </div>
      <ul className="divide-border divide-y">
        {rows.map((r) => (
          <li key={r.addr} className="flex items-center gap-3 px-4 py-3">
            <span
              className={`rounded-full border-[0.5px] px-2 py-0.5 font-mono text-[9px] tracking-wide ${
                palette[r.verdict as keyof typeof palette]
              }`}
            >
              {r.verdict}
            </span>
            <span className="text-text-primary flex-1 text-sm">{r.addr}</span>
            <span className="text-text-tertiary font-serif text-sm">
              {r.price}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
