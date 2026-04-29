import { Suspense } from "react";
import { PasteForm } from "@/features/properties/paste-form";
import { DashboardFilters } from "@/features/properties/dashboard-filters";
import {
  searchProperties,
  type PropertyFilter,
} from "@/features/properties/queries";

const formatPrice = (pence: number | null) =>
  pence === null ? "—" : `£${(pence / 100).toLocaleString("en-GB")}`;

const formatPostcode = (pc: string) => {
  if (pc.length <= 4) return pc;
  return `${pc.slice(0, pc.length - 3)} ${pc.slice(-3)}`;
};

const portalLabel = (host: string) => {
  if (host.includes("rightmove")) return "Rightmove";
  if (host.includes("zoopla")) return "Zoopla";
  if (host.includes("purplebricks")) return "Purplebricks";
  return "View listing";
};

const toInt = (v: string | undefined): number | undefined => {
  if (v === undefined || v === "") return undefined;
  const n = parseInt(v, 10);
  return isNaN(n) ? undefined : n;
};

const toPence = (v: string | undefined): number | undefined => {
  const n = toInt(v);
  return n === undefined ? undefined : n * 100;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const types = Array.isArray(sp.type)
    ? sp.type
    : sp.type
      ? [sp.type]
      : [];

  const filter: PropertyFilter = {
    postcodeArea: typeof sp.postcode === "string" ? sp.postcode : undefined,
    priceMinPence: toPence(typeof sp.priceMin === "string" ? sp.priceMin : undefined),
    priceMaxPence: toPence(typeof sp.priceMax === "string" ? sp.priceMax : undefined),
    bedroomsMin: toInt(typeof sp.bedsMin === "string" ? sp.bedsMin : undefined),
    bedroomsMax: toInt(typeof sp.bedsMax === "string" ? sp.bedsMax : undefined),
    propertyTypes: types.length > 0 ? types : undefined,
    status: sp.status === "all" ? "all" : "active",
  };

  const recent = await searchProperties(filter);

  return (
    <main className="bg-bg-page max-w-app mx-auto p-8">
      <header className="mb-8">
        <p className="text-accent mb-2 font-mono text-xs tracking-[0.18em] uppercase">
          03 / Dashboard
        </p>
        <h1 className="text-text-primary font-serif text-4xl">
          Your <em className="text-text-accent">feed</em>.
        </h1>
        <p className="text-text-secondary mt-2 text-sm">
          Paste a listing URL to add a property, or filter the feed below.
        </p>
      </header>

      <div className="space-y-4">
        <PasteForm />
        <Suspense
          fallback={
            <div className="bg-bg-surface border-border h-32 rounded-lg border-[0.5px]" />
          }
        >
          <DashboardFilters />
        </Suspense>
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-text-primary font-serif text-2xl">
            {recent.length === 1
              ? "1 property"
              : `${recent.length} properties`}
          </h2>
        </div>
        {recent.length === 0 ? (
          <div className="border-border bg-bg-surface rounded-lg border-[0.5px] p-8 text-center">
            <p className="text-text-secondary text-sm">
              No properties match. Try clearing filters, or paste a listing URL
              above to add one.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {recent.map((p) => {
              let portalHost = "";
              try {
                portalHost = p.sourceUrl
                  ? new URL(p.sourceUrl).hostname.toLowerCase()
                  : "";
              } catch {
                portalHost = "";
              }
              return (
                <li
                  key={p.id}
                  className="bg-bg-surface border-border flex flex-col overflow-hidden rounded-lg border-[0.5px]"
                >
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt={p.addressLine1}
                      className="aspect-[4/3] w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="bg-bg-surface-2 aspect-[4/3] w-full" />
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-text-primary text-sm leading-snug font-medium">
                        {p.addressLine1}
                      </h3>
                      <span className="text-text-tertiary font-mono text-[11px] tracking-wide whitespace-nowrap">
                        {formatPostcode(p.postcode)}
                      </span>
                    </div>
                    <p className="text-text-primary mt-3 font-serif text-2xl">
                      {formatPrice(p.listingPrice)}
                    </p>
                    <p className="text-text-tertiary mt-1 text-xs capitalize">
                      {p.bedrooms ?? "—"} bed · {p.propertyType ?? "—"}
                    </p>
                    {p.sourceUrl && (
                      <a
                        href={p.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent mt-auto pt-4 text-xs font-medium underline underline-offset-2"
                      >
                        View on {portalLabel(portalHost)} ↗
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
