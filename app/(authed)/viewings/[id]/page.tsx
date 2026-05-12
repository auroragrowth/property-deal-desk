import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUserIdOrNull } from "@/lib/auth/server";
import {
  getViewing,
  signPhotoUrls,
} from "@/features/viewings/queries";
import { Comparables } from "@/features/viewings/comparables";

// Photos are served via short-lived signed URLs — never cache the
// rendered page, or stale URLs would 404 after expiry.
export const dynamic = "force-dynamic";

const fmtPrice = (pence: number | null) =>
  pence == null ? "—" : `£${(pence / 100).toLocaleString("en-GB")}`;

const fmtDate = (d: Date | null) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const fmtPostcode = (pc: string | null) => {
  if (!pc) return "";
  const u = pc.replace(/\s+/g, "").toUpperCase();
  if (u.length <= 4) return u;
  return `${u.slice(0, u.length - 3)} ${u.slice(-3)}`;
};

export default async function ViewingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getUserIdOrNull();
  if (!userId) redirect("/sign-in");
  const { id } = await params;

  const viewing = await getViewing(userId, id);
  if (!viewing) notFound();

  const allPaths = viewing.rooms.flatMap((r) =>
    r.photos.map((p) => p.storagePath),
  );
  const signed = await signPhotoUrls(allPaths);

  return (
    <main id="main" className="bg-bg-page max-w-app mx-auto space-y-6 p-6 sm:p-8">
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-accent font-mono text-xs tracking-[0.18em] uppercase">
            Viewing · {fmtDate(viewing.visitedAt)}
          </p>
          <h1 className="text-text-primary mt-1 font-serif text-3xl">
            {viewing.propertyAddress ?? "Untitled viewing"}
          </h1>
          {viewing.propertyPostcode && (
            <p className="text-text-tertiary mt-1 font-mono text-xs tracking-wide">
              {fmtPostcode(viewing.propertyPostcode)} ·{" "}
              {fmtPrice(viewing.propertyPricePence)} asking
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/viewings/${viewing.id}/edit`}
            className="border-border-strong text-text-primary hover:bg-bg-surface-2 inline-flex h-10 items-center rounded-md border-[0.5px] bg-transparent px-3 text-xs font-medium"
          >
            Edit
          </Link>
          {viewing.propertyUrl && (
            <a
              href={viewing.propertyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-bg-strong text-text-on-strong inline-flex h-10 items-center rounded-md px-3 text-xs font-medium"
            >
              Open listing
            </a>
          )}
        </div>
      </header>

      <Comparables
        postcode={viewing.propertyPostcode}
        bedrooms={null}
      />

      {viewing.overallNotes && (
        <section
          aria-labelledby="overall"
          className="border-border bg-bg-surface space-y-2 rounded-lg border-[0.5px] p-5"
        >
          <h2 id="overall" className="text-text-primary font-serif text-xl">
            Overall impressions
          </h2>
          <p className="text-text-secondary whitespace-pre-wrap text-sm leading-relaxed">
            {viewing.overallNotes}
          </p>
        </section>
      )}

      {viewing.rooms.length === 0 ? (
        <p className="text-text-tertiary text-sm">
          No rooms recorded.{" "}
          <Link
            href={`/viewings/${viewing.id}/edit`}
            className="text-text-accent underline underline-offset-2"
          >
            Add some
          </Link>
          .
        </p>
      ) : (
        <section className="space-y-6">
          <h2 className="text-text-primary font-serif text-xl">Rooms</h2>
          {viewing.rooms.map((r) => (
            <article
              key={r.id}
              className="border-border bg-bg-surface space-y-3 rounded-lg border-[0.5px] p-5"
            >
              <header className="flex items-baseline justify-between gap-3">
                <h3 className="text-text-primary font-serif text-lg">
                  {r.name}
                </h3>
                {r.photos.length > 0 && (
                  <span className="text-text-tertiary font-mono text-[10px] tracking-wide">
                    {r.photos.length} photo{r.photos.length === 1 ? "" : "s"}
                  </span>
                )}
              </header>

              {r.notes && (
                <p className="text-text-secondary whitespace-pre-wrap text-sm leading-relaxed">
                  {r.notes}
                </p>
              )}

              {r.photos.length > 0 && (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {r.photos.map((p) => {
                    const url = signed[p.storagePath];
                    if (!url) return null;
                    return (
                      <li key={p.id}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={r.name}
                            className="border-border aspect-square w-full rounded-md border-[0.5px] object-cover"
                            loading="lazy"
                          />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
