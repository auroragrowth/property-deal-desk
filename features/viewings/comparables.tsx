import {
  fetchAskingPrices,
  fetchLocalRents,
  fetchPricePerSqf,
  fetchSoldPrices,
  PropertyDataConfigError,
} from "@/features/properties/adapters/propertydata";

const fmtGbp = (n: number | undefined) =>
  n == null
    ? "—"
    : `£${Math.round(n).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;

// PropertyData /rents returns £/week. UK BTL convention is monthly.
const WEEK_TO_MONTH = 52 / 12;
const weeklyToMonthly = (n: number | undefined) =>
  n == null ? undefined : n * WEEK_TO_MONTH;

const fmtPct = (n: number | undefined, digits = 1) =>
  n == null ? "—" : `${(n * 100).toFixed(digits)}%`;

// Server component — fetches the four PropertyData area metrics in
// parallel (all cached 7 days at the adapter layer) and renders a
// snapshot panel: avg sold £, avg sold £/sqft, avg asking £, avg
// long-let rent £/mo + a derived gross yield estimate.
export async function Comparables({
  postcode,
  bedrooms,
}: {
  postcode: string | null;
  bedrooms: number | null;
}) {
  if (!postcode) return null;

  const beds = bedrooms ?? undefined;

  const [soldRes, rentRes, askingRes, sqfRes] = await Promise.allSettled([
    fetchSoldPrices({ postcode, bedrooms: beds }),
    fetchLocalRents({ postcode, bedrooms: beds }),
    fetchAskingPrices({ postcode, bedrooms: beds }),
    fetchPricePerSqf({ postcode }),
  ]);

  const errOf = (r: PromiseSettledResult<unknown>): string | null =>
    r.status === "rejected"
      ? r.reason instanceof PropertyDataConfigError
        ? r.reason.message
        : (r.reason as Error).message
      : null;

  const sold = soldRes.status === "fulfilled" ? soldRes.value.data : undefined;
  const rent = rentRes.status === "fulfilled" ? rentRes.value.data : undefined;
  const asking =
    askingRes.status === "fulfilled" ? askingRes.value.data : undefined;
  const sqf = sqfRes.status === "fulfilled" ? sqfRes.value.data : undefined;

  const errs = {
    sold: errOf(soldRes),
    rent: errOf(rentRes),
    asking: errOf(askingRes),
    sqf: errOf(sqfRes),
  };

  // Derived: gross yield estimate = avg monthly rent × 12 / avg asking
  const weekly = rent?.long_let?.average ?? rent?.average;
  const monthlyRent = weeklyToMonthly(weekly);
  const askingAvg = asking?.average;
  const gyEst =
    monthlyRent && askingAvg ? (monthlyRent * 12) / askingAvg : undefined;

  const anyData = sold || rent || asking || sqf;
  const anyErr = errs.sold || errs.rent || errs.asking || errs.sqf;
  if (!anyData && !anyErr) return null;

  return (
    <section
      aria-labelledby="viewing-comps"
      className="border-border bg-bg-surface space-y-4 rounded-lg border-[0.5px] p-4"
    >
      <header className="flex items-baseline justify-between gap-2">
        <h2
          id="viewing-comps"
          className="text-text-primary font-serif text-lg"
        >
          Local market data
        </h2>
        <span className="text-text-tertiary font-mono text-[10px] tracking-wide uppercase">
          {postcode}
          {bedrooms ? ` · ${bedrooms} bed` : ""}
        </span>
      </header>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric
          label="Avg sold price"
          value={fmtGbp(sold?.average)}
          hint={sold?.points_analysed ? `${sold.points_analysed} sales` : ""}
        />
        <Metric
          label="Avg sold £/sqft"
          value={fmtGbp(sqf?.average)}
          hint={sqf?.points_analysed ? `${sqf.points_analysed} sales` : ""}
        />
        <Metric
          label={`Avg ${bedrooms ?? "—"}-bed asking`}
          value={fmtGbp(askingAvg)}
          hint={
            asking?.points_analysed
              ? `${asking.points_analysed} listings`
              : ""
          }
        />
        <Metric
          label={`Avg ${bedrooms ?? "—"}-bed rent`}
          value={monthlyRent ? `${fmtGbp(monthlyRent)}/mo` : "—"}
          hint={
            weekly
              ? `${fmtGbp(weekly)}/wk · ${
                  rent?.points_analysed ?? 0
                } listings`
              : ""
          }
        />
        <Metric
          label="Est gross yield"
          value={fmtPct(gyEst)}
          hint="avg rent × 12 / avg ask"
        />
      </dl>

      {(errs.sold || errs.rent || errs.asking || errs.sqf) && (
        <details className="text-text-tertiary text-[11px]">
          <summary className="cursor-pointer">PropertyData errors</summary>
          <ul className="mt-2 space-y-1 pl-4">
            {errs.sold && (
              <li>
                <code>/sold-prices</code>: {errs.sold}
              </li>
            )}
            {errs.rent && (
              <li>
                <code>/rents</code>: {errs.rent}
              </li>
            )}
            {errs.asking && (
              <li>
                <code>/prices</code>: {errs.asking}
              </li>
            )}
            {errs.sqf && (
              <li>
                <code>/prices-per-sqf</code>: {errs.sqf}
              </li>
            )}
          </ul>
        </details>
      )}

      <p className="text-text-tertiary text-[10px]">
        Cached for 7 days per postcode + beds. Refresh on Sunday-ish.
      </p>
    </section>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <dt className="text-text-tertiary font-mono text-[10px] tracking-wide uppercase">
        {label}
      </dt>
      <dd className="text-text-primary mt-1 font-serif text-xl">{value}</dd>
      {hint && <dd className="text-text-tertiary text-[11px]">{hint}</dd>}
    </div>
  );
}
