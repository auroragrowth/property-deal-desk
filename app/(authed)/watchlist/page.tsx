import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getEntitlements } from "@/lib/entitlements";
import {
  listWatchlist,
  type WatchlistSort,
} from "@/features/watchlist/queries";
import { RemoveButton } from "@/features/watchlist/remove-button";
import { AnalyseButton } from "@/features/deals/analyse-button";

const formatPrice = (pence: number | null) =>
  pence === null ? "—" : `£${(pence / 100).toLocaleString("en-GB")}`;

const formatPostcode = (pc: string) => {
  if (pc.length <= 4) return pc;
  return `${pc.slice(0, pc.length - 3)} ${pc.slice(-3)}`;
};

const formatAdded = (d: Date | null) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
};

const portalLabel = (host: string) => {
  if (host.includes("rightmove")) return "Rightmove";
  if (host.includes("zoopla")) return "Zoopla";
  if (host.includes("purplebricks")) return "Purplebricks";
  return "View listing";
};

const SORTS: { value: WatchlistSort; label: string }[] = [
  { value: "added", label: "Date added" },
  { value: "priceDesc", label: "Price ↓" },
  { value: "priceAsc", label: "Price ↑" },
  { value: "postcode", label: "Postcode" },
];

export default async function WatchlistPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const sp = await searchParams;
  const sort: WatchlistSort = SORTS.some((s) => s.value === sp.sort)
    ? (sp.sort as WatchlistSort)
    : "added";

  const [items, ent] = await Promise.all([
    listWatchlist(userId, sort),
    getEntitlements(userId),
  ]);

  const limit = ent.maxWatchlistItems;
  const limitLabel =
    limit === Number.POSITIVE_INFINITY ? "unlimited" : String(limit);

  return (
    <main className="bg-bg-page max-w-app mx-auto p-8">
      <header className="mb-8 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="text-accent mb-2 font-mono text-xs tracking-[0.18em] uppercase">
            04 / Watchlist
          </p>
          <h1 className="text-text-primary font-serif text-4xl">
            Properties to <em className="text-text-accent">revisit</em>.
          </h1>
        </div>
        <p className="text-text-tertiary font-mono text-xs tracking-wide">
          {items.length} / {limitLabel}{" "}
          {ent.trial ? <span className="text-accent">· trial</span> : null}
        </p>
      </header>

      <nav className="mb-6 flex flex-wrap gap-2">
        {SORTS.map((s) => {
          const active = sort === s.value;
          return (
            <Link
              key={s.value}
              href={s.value === "added" ? "/watchlist" : `/watchlist?sort=${s.value}`}
              className={[
                "h-9 rounded-md border-[0.5px] px-3 text-xs font-medium leading-9",
                active
                  ? "bg-bg-strong text-text-on-strong border-transparent"
                  : "border-border-strong text-text-primary bg-transparent",
              ].join(" ")}
            >
              {s.label}
            </Link>
          );
        })}
      </nav>

      {items.length === 0 ? (
        <div className="border-border bg-bg-surface rounded-lg border-[0.5px] p-8 text-center">
          <p className="text-text-secondary text-sm">
            Nothing on your watchlist yet.
          </p>
          <Link
            href="/dashboard"
            className="text-accent mt-2 inline-block text-sm font-medium underline underline-offset-2"
          >
            Browse the feed →
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            let host = "";
            try {
              host = item.sourceUrl
                ? new URL(item.sourceUrl).hostname.toLowerCase()
                : "";
            } catch {
              host = "";
            }
            return (
              <li
                key={item.id}
                className="bg-bg-surface border-border flex flex-col overflow-hidden rounded-lg border-[0.5px]"
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={item.addressLine1}
                    className="aspect-[4/3] w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="bg-bg-surface-2 aspect-[4/3] w-full" />
                )}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-text-primary text-sm leading-snug font-medium">
                      {item.addressLine1}
                    </h3>
                    <span className="text-text-tertiary font-mono text-[11px] tracking-wide whitespace-nowrap">
                      {formatPostcode(item.postcode)}
                    </span>
                  </div>
                  <p className="text-text-primary mt-3 font-serif text-2xl">
                    {formatPrice(item.listingPrice)}
                  </p>
                  <p className="text-text-tertiary mt-1 text-xs capitalize">
                    {item.bedrooms ?? "—"} bed · {item.propertyType ?? "—"} ·
                    added {formatAdded(item.addedAt)}
                  </p>
                  <div className="mt-auto flex flex-col gap-3 pt-4">
                    <AnalyseButton propertyId={item.propertyId} />
                    <div className="flex items-end justify-between gap-3">
                      {item.sourceUrl ? (
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent text-xs font-medium underline underline-offset-2"
                        >
                          View on {portalLabel(host)} ↗
                        </a>
                      ) : (
                        <span />
                      )}
                      <RemoveButton id={item.id} />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-text-tertiary mt-8 text-xs">
        BTL analysis uses default assumptions (25% deposit, 5.49% rate, 25-year
        repayment, £200/mo target cashflow). Inline editing ships in week 10.
      </p>
    </main>
  );
}
