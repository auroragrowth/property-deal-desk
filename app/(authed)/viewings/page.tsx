import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserIdOrNull } from "@/lib/auth/server";
import { listViewings, signPhotoUrls } from "@/features/viewings/queries";

export const metadata = { title: "Viewings · DealDesk" };

// Thumbnails use signed URLs — re-render every visit so they stay fresh.
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

export default async function ViewingsListPage() {
  const userId = await getUserIdOrNull();
  if (!userId) redirect("/sign-in");

  const items = await listViewings(userId);
  const thumbPaths = items
    .map((i) => i.thumbnailPath)
    .filter((p): p is string => Boolean(p));
  const signed = await signPhotoUrls(thumbPaths);

  return (
    <main id="main" className="bg-bg-page max-w-app mx-auto p-6 sm:p-8">
      <header className="mb-8 flex items-baseline justify-between gap-3">
        <div>
          <p className="text-accent mb-2 font-mono text-xs tracking-[0.18em] uppercase">
            07 / Viewings
          </p>
          <h1 className="text-text-primary font-serif text-4xl">
            Properties you&apos;ve <em className="text-text-accent">walked</em>.
          </h1>
        </div>
        <Link
          href="/viewings/new"
          className="bg-accent text-accent-on hover:bg-accent-hover inline-flex h-12 items-center rounded-md px-5 text-sm font-medium"
        >
          + New viewing
        </Link>
      </header>

      {items.length === 0 ? (
        <p className="text-text-secondary mt-8 text-sm">
          No viewings yet. Tap{" "}
          <Link
            href="/viewings/new"
            className="text-text-accent underline underline-offset-2"
          >
            New viewing
          </Link>{" "}
          on your phone before you walk into the next property — paste the
          listing URL, capture a photo per room, save when you&apos;re back in
          the car.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((v) => {
            const thumb = v.thumbnailPath
              ? signed[v.thumbnailPath]
              : null;
            return (
              <li key={v.id}>
                <Link
                  href={`/viewings/${v.id}`}
                  className="bg-bg-surface border-border block overflow-hidden rounded-lg border-[0.5px]"
                >
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt={v.propertyAddress ?? "Viewing"}
                      className="aspect-[4/3] w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="bg-bg-surface-2 text-text-tertiary flex aspect-[4/3] w-full items-center justify-center text-xs">
                      No photos yet
                    </div>
                  )}
                  <div className="space-y-2 p-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-text-primary text-sm leading-snug font-medium">
                        {v.propertyAddress ?? "Untitled viewing"}
                      </h3>
                      <span className="text-text-tertiary font-mono text-[10px] tracking-wide whitespace-nowrap">
                        {fmtPostcode(v.propertyPostcode)}
                      </span>
                    </div>
                    <p className="text-text-primary font-serif text-lg">
                      {fmtPrice(v.propertyPricePence)}
                    </p>
                    <p className="text-text-tertiary text-[11px]">
                      {fmtDate(v.visitedAt)} · {v.roomsCount}{" "}
                      {v.roomsCount === 1 ? "room" : "rooms"} ·{" "}
                      {v.photosCount} photo{v.photosCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
