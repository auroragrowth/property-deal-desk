import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { properties, propertyListings, watchlist } from "@/lib/db/schema";

export type WatchlistSort = "added" | "priceAsc" | "priceDesc" | "postcode";

export type WatchlistItem = {
  id: string;
  propertyId: string;
  note: string | null;
  addedAt: Date | null;
  addressLine1: string;
  postcode: string;
  bedrooms: number | null;
  propertyType: string | null;
  listingPrice: number | null;
  imageUrl: string | null;
  sourceUrl: string | null;
};

export async function listWatchlist(
  userId: string,
  sort: WatchlistSort = "added",
): Promise<WatchlistItem[]> {
  const orderBy =
    sort === "priceAsc"
      ? asc(properties.listingPrice)
      : sort === "priceDesc"
        ? desc(properties.listingPrice)
        : sort === "postcode"
          ? asc(properties.postcode)
          : desc(watchlist.addedAt);

  const rows = await db
    .select({
      id: watchlist.id,
      propertyId: watchlist.propertyId,
      note: watchlist.note,
      addedAt: watchlist.addedAt,
      addressLine1: properties.addressLine1,
      postcode: properties.postcode,
      bedrooms: properties.bedrooms,
      propertyType: properties.propertyType,
      listingPrice: properties.listingPrice,
      imageUrl: properties.imageUrl,
      sourceUrl: propertyListings.sourceUrl,
    })
    .from(watchlist)
    .innerJoin(properties, eq(properties.id, watchlist.propertyId))
    .leftJoin(propertyListings, eq(propertyListings.propertyId, properties.id))
    .where(eq(watchlist.userId, userId))
    .orderBy(orderBy);

  // Left-join can emit duplicates if a property has multiple listings.
  const seen = new Set<string>();
  return rows.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

export async function watchlistCount(userId: string): Promise<number> {
  const res = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(watchlist)
    .where(eq(watchlist.userId, userId));
  return res[0]?.count ?? 0;
}

// Map of propertyId → watchlist row id, for the dashboard's "+ Save / Remove" toggle.
export async function watchlistMap(
  userId: string,
): Promise<Map<string, string>> {
  const rows = await db
    .select({ id: watchlist.id, propertyId: watchlist.propertyId })
    .from(watchlist)
    .where(eq(watchlist.userId, userId));
  return new Map(rows.map((r) => [r.propertyId, r.id]));
}

export async function watchlistItemForUser(
  userId: string,
  watchlistId: string,
) {
  return db.query.watchlist.findFirst({
    where: and(eq(watchlist.id, watchlistId), eq(watchlist.userId, userId)),
  });
}
