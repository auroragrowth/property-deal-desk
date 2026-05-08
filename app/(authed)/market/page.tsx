import {
  searchSourcedProperties,
  PropertyDataConfigError,
  PropertyDataApiError,
  type PropertyDataItem,
} from "@/features/properties/adapters/propertydata";
import { SaveButton } from "@/features/market/save-button";

const formatPrice = (gbp: number) =>
  `£${gbp.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;

const formatPostcode = (pc: string) => {
  const u = pc.replace(/\s+/g, "").toUpperCase();
  if (u.length <= 4) return u;
  return `${u.slice(0, u.length - 3)} ${u.slice(-3)}`;
};

const toInt = (v: string | undefined): number | undefined => {
  if (!v) return undefined;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
};

type SearchParams = Record<string, string | string[] | undefined>;

const STD_TYPES = [
  { value: "", label: "Any type" },
  { value: "flat", label: "Flat" },
  { value: "terrace_house", label: "Terrace" },
  { value: "semi_detached_house", label: "Semi-detached" },
  { value: "detached_house", label: "Detached" },
];

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const postcode =
    typeof sp.postcode === "string" ? sp.postcode.trim() : "";
  const radius = toInt(typeof sp.radius === "string" ? sp.radius : undefined);
  const maxAge = toInt(typeof sp.maxAge === "string" ? sp.maxAge : undefined);
  const standardisedType =
    typeof sp.type === "string" ? sp.type : "";
  const excludeSstc = sp.excludeSstc === "1" ? 1 : 0;
  const results = toInt(typeof sp.results === "string" ? sp.results : undefined);

  let items: PropertyDataItem[] = [];
  let configError: string | null = null;
  let apiError: string | null = null;

  if (postcode) {
    try {
      items = await searchSourcedProperties({
        postcode,
        radius,
        maxAge,
        standardisedType: standardisedType || undefined,
        excludeSstc,
        results,
      });
    } catch (err) {
      if (err instanceof PropertyDataConfigError) configError = err.message;
      else if (err instanceof PropertyDataApiError) apiError = err.message;
      else apiError = (err as Error).message;
    }
  }

  return (
    <main id="main" className="bg-bg-page max-w-app mx-auto p-8">
      <header className="mb-8">
        <p className="text-accent mb-2 font-mono text-xs tracking-[0.18em] uppercase">
          06 / Market scanner
        </p>
        <h1 className="text-text-primary font-serif text-4xl">
          The <em className="text-text-accent">live</em> UK market.
        </h1>
        <p className="text-text-secondary mt-2 text-sm">
          Live listings via PropertyData. Pick an area, filter, save what
          looks interesting.
        </p>
      </header>

      <form
        method="get"
        className="border-border bg-bg-surface mb-8 grid grid-cols-1 gap-3 rounded-lg border-[0.5px] p-5 sm:grid-cols-2 lg:grid-cols-6"
      >
        <label className="block sm:col-span-2">
          <span className="text-text-secondary mb-1 block text-xs">Postcode</span>
          <input
            type="text"
            name="postcode"
            defaultValue={postcode}
            placeholder="PE1 or PE1 2AB"
            required
            className="border-border bg-bg-page focus:ring-accent-soft h-11 w-full rounded-md border-[0.5px] px-3 text-sm uppercase focus:ring-[3px] focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-text-secondary mb-1 block text-xs">
            Radius (miles)
          </span>
          <input
            type="number"
            name="radius"
            min={1}
            max={200}
            defaultValue={radius ?? 5}
            className="border-border bg-bg-page focus:ring-accent-soft h-11 w-full rounded-md border-[0.5px] px-3 text-sm focus:ring-[3px] focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-text-secondary mb-1 block text-xs">
            Max age (days)
          </span>
          <input
            type="number"
            name="maxAge"
            min={1}
            defaultValue={maxAge ?? 30}
            className="border-border bg-bg-page focus:ring-accent-soft h-11 w-full rounded-md border-[0.5px] px-3 text-sm focus:ring-[3px] focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-text-secondary mb-1 block text-xs">Type</span>
          <select
            name="type"
            defaultValue={standardisedType}
            className="border-border bg-bg-page focus:ring-accent-soft h-11 w-full rounded-md border-[0.5px] px-3 text-sm focus:ring-[3px] focus:outline-none"
          >
            {STD_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-text-secondary mb-1 block text-xs">Results</span>
          <select
            name="results"
            defaultValue={results ?? 50}
            className="border-border bg-bg-page focus:ring-accent-soft h-11 w-full rounded-md border-[0.5px] px-3 text-sm focus:ring-[3px] focus:outline-none"
          >
            {[10, 25, 50, 100, 200].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="text-text-secondary flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-3">
          <input
            type="checkbox"
            name="excludeSstc"
            value="1"
            defaultChecked={excludeSstc === 1}
            className="h-4 w-4"
          />
          Hide SSTC (Sold Subject To Contract)
        </label>
        <div className="sm:col-span-2 lg:col-span-3 lg:col-start-4 lg:row-start-2">
          <button
            type="submit"
            className="bg-bg-strong text-text-on-strong h-11 w-full rounded-md px-4 text-sm font-medium"
          >
            Scan the market
          </button>
        </div>
      </form>

      {configError && (
        <div className="border-marginal-border bg-marginal-bg text-marginal-fg mb-6 rounded-md border-[0.5px] p-4 text-sm">
          <strong>Configuration:</strong> {configError}
        </div>
      )}
      {apiError && (
        <div className="border-fail-border bg-fail-bg text-fail-fg mb-6 rounded-md border-[0.5px] p-4 text-sm">
          <strong>PropertyData error:</strong> {apiError}
        </div>
      )}

      {!postcode && !configError && (
        <p className="text-text-tertiary text-sm">
          Enter a postcode above to start.
        </p>
      )}

      {postcode && !configError && !apiError && items.length === 0 && (
        <p className="text-text-secondary text-sm">
          No matches for that area + filters. Try widening the radius or
          increasing max age.
        </p>
      )}

      {items.length > 0 && (
        <>
          <p className="text-text-tertiary mb-4 font-mono text-xs tracking-wide">
            {items.length} {items.length === 1 ? "result" : "results"}
          </p>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <li
                key={p.id}
                className="bg-bg-surface border-border flex flex-col overflow-hidden rounded-lg border-[0.5px]"
              >
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image_url}
                    alt={p.address}
                    className="aspect-[4/3] w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="bg-bg-surface-2 aspect-[4/3] w-full" />
                )}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-text-primary text-sm leading-snug font-medium">
                      {p.address}
                    </h3>
                    <span className="text-text-tertiary font-mono text-[11px] tracking-wide whitespace-nowrap">
                      {formatPostcode(p.postcode)}
                    </span>
                  </div>
                  <p className="text-text-primary mt-3 font-serif text-2xl">
                    {formatPrice(p.price)}
                  </p>
                  <p className="text-text-secondary mt-1 text-xs">
                    {p.bedrooms} bed · {p.type} ·{" "}
                    {p.days_on_market != null
                      ? `${p.days_on_market}d on market`
                      : "live"}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                    <a
                      href={p.listing_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-text-accent text-xs underline underline-offset-2"
                    >
                      View listing
                    </a>
                    <SaveButton item={p} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
