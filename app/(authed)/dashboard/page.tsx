import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PasteForm } from "@/features/properties/paste-form";
import { DashboardFilters } from "@/features/properties/dashboard-filters";
import {
  searchProperties,
  type PropertyFilter,
} from "@/features/properties/queries";
import { watchlistMap } from "@/features/watchlist/queries";
import { WatchlistButton } from "@/features/watchlist/watchlist-button";
import { listSavedFilters } from "@/features/properties/saved-filters-server";
import { SavedFilterChips } from "@/features/properties/saved-filter-chips";
import { getOnboardingProgress } from "@/features/onboarding/progress";
import { OnboardingChecklist } from "@/features/onboarding/checklist";

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
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
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

  const [recent, watched, savedFilters, onboarding] = await Promise.all([
    searchProperties(filter),
    watchlistMap(userId),
    listSavedFilters(userId),
    getOnboardingProgress(userId),
  ]);

  return (
    <main id="main" className="bg-bg-page max-w-app mx-auto p-8">
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
        <OnboardingChecklist {...onboarding} />
        <PasteForm />
        <Suspense
          fallback={
            <div className="bg-bg-surface border-border h-32 rounded-lg border-[0.5px]" />
          }
        >
          <DashboardFilters />
        </Suspense>
        {savedFilters.length > 0 && (
          <Suspense fallback={null}>
            <SavedFilterChips items={savedFilters} />
          </Suspense>
        )}
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
          <div className="border-border bg-bg-surface rounded-lg border-[0.5px] p-10 text-center">
            <p className="text-text-primary font-serif text-xl">
              Your radar is <em className="text-text-accent">clear</em>.
            </p>
            <p className="text-text-secondary mx-auto mt-2 max-w-sm text-sm">
              Paste a listing above to add your first property — or loosen the
              filters to see what&apos;s already there.
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
                    <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                      {p.sourceUrl ? (
                        <a
                          href={p.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent text-xs font-medium underline underline-offset-2"
                        >
                          View on {portalLabel(portalHost)} ↗
                        </a>
                      ) : (
                        <span />
                      )}
                      <WatchlistButton
                        propertyId={p.id}
                        watchlistItemId={watched.get(p.id) ?? null}
                      />
                    </div>
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
