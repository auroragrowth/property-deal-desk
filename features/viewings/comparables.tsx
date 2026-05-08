import {
  fetchLocalRents,
  fetchSoldPrices,
  PropertyDataConfigError,
} from "@/features/properties/adapters/propertydata";

const fmtGbp = (n: number | undefined) =>
  n == null
    ? "—"
    : `£${Math.round(n).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;

// Server component — fetches /sold-prices and /rents in parallel and
// renders a small comparables panel beside the viewing's URL preview.
export async function Comparables({
  postcode,
  bedrooms,
}: {
  postcode: string | null;
  bedrooms: number | null;
}) {
  if (!postcode) return null;

  const [soldRes, rentRes] = await Promise.allSettled([
    fetchSoldPrices({ postcode, bedrooms: bedrooms ?? undefined }),
    fetchLocalRents({ postcode, bedrooms: bedrooms ?? undefined }),
  ]);

  const soldErr =
    soldRes.status === "rejected"
      ? soldRes.reason instanceof PropertyDataConfigError
        ? soldRes.reason.message
        : (soldRes.reason as Error).message
      : null;
  const rentErr =
    rentRes.status === "rejected"
      ? rentRes.reason instanceof PropertyDataConfigError
        ? rentRes.reason.message
        : (rentRes.reason as Error).message
      : null;

  const sold = soldRes.status === "fulfilled" ? soldRes.value.data : undefined;
  const rent = rentRes.status === "fulfilled" ? rentRes.value.data : undefined;

  if (!sold && !rent && !soldErr && !rentErr) return null;

  return (
    <section
      aria-labelledby="viewing-comps"
      className="border-border bg-bg-surface space-y-3 rounded-lg border-[0.5px] p-4"
    >
      <h2
        id="viewing-comps"
        className="text-text-primary font-serif text-lg"
      >
        Comparables
        <span className="text-text-tertiary ml-2 font-mono text-[10px] tracking-wide uppercase">
          {postcode}
          {bedrooms ? ` · ${bedrooms} bed` : ""}
        </span>
      </h2>

      <dl className="grid grid-cols-2 gap-3">
        <div>
          <dt className="text-text-tertiary font-mono text-[10px] tracking-wide uppercase">
            Avg sold price
          </dt>
          <dd className="text-text-primary mt-1 font-serif text-xl">
            {fmtGbp(sold?.average)}
          </dd>
          <dd className="text-text-tertiary text-[11px]">
            {sold?.points_analysed
              ? `${sold.points_analysed} sales analysed`
              : soldErr
                ? "—"
                : ""}
          </dd>
        </div>
        <div>
          <dt className="text-text-tertiary font-mono text-[10px] tracking-wide uppercase">
            Avg long-let rent
          </dt>
          <dd className="text-text-primary mt-1 font-serif text-xl">
            {rent?.long_let?.average
              ? `${fmtGbp(rent.long_let.average)}/mo`
              : rent?.average
                ? `${fmtGbp(rent.average)}/mo`
                : "—"}
          </dd>
          <dd className="text-text-tertiary text-[11px]">
            {rent?.points_analysed
              ? `${rent.points_analysed} listings analysed`
              : rentErr
                ? "—"
                : ""}
          </dd>
        </div>
      </dl>

      {(soldErr || rentErr) && (
        <p className="text-text-tertiary text-[11px]">
          {soldErr ? `Sold prices: ${soldErr}. ` : ""}
          {rentErr ? `Rents: ${rentErr}.` : ""}
        </p>
      )}
    </section>
  );
}
