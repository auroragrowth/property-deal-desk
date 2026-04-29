import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { properties, propertyListings } from "@/lib/db/schema";
import { PasteForm } from "@/features/properties/paste-form";

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

export default async function DashboardPage() {
  const rows = await db
    .select({
      id: properties.id,
      addressLine1: properties.addressLine1,
      postcode: properties.postcode,
      bedrooms: properties.bedrooms,
      propertyType: properties.propertyType,
      listingPrice: properties.listingPrice,
      imageUrl: properties.imageUrl,
      createdAt: properties.createdAt,
      sourceUrl: propertyListings.sourceUrl,
    })
    .from(properties)
    .leftJoin(propertyListings, eq(propertyListings.propertyId, properties.id))
    .orderBy(desc(properties.createdAt))
    .limit(40);

  // Collapse to one row per property (keep the first listing URL we see).
  const seen = new Set<string>();
  const recent = rows
    .filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    })
    .slice(0, 20);

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
          Paste a listing URL to add a property. Filters and saved searches land
          in week 5.
        </p>
      </header>

      <PasteForm />

      <section className="mt-10">
        <h2 className="text-text-primary mb-4 font-serif text-2xl">
          Recent properties
        </h2>
        {recent.length === 0 ? (
          <div className="border-border bg-bg-surface rounded-lg border-[0.5px] p-8 text-center">
            <p className="text-text-secondary text-sm">
              No properties yet. Paste a Rightmove, Zoopla, or Purplebricks URL
              above to get started.
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
