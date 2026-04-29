import { and, desc, eq, gte, ilike, inArray, lte, type SQL } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { properties, propertyListings } from "@/lib/db/schema";

export type PropertyFilter = {
  postcodeArea?: string; // free-form, prefix-matched against normalised postcode
  priceMinPence?: number;
  priceMaxPence?: number;
  bedroomsMin?: number;
  bedroomsMax?: number;
  propertyTypes?: string[];
  status?: "active" | "all";
  page?: number;
  pageSize?: number;
};

export type PropertyResult = {
  id: string;
  addressLine1: string;
  postcode: string;
  bedrooms: number | null;
  propertyType: string | null;
  listingPrice: number | null;
  imageUrl: string | null;
  createdAt: Date | null;
  sourceUrl: string | null;
};

export async function searchProperties(
  filter: PropertyFilter,
): Promise<PropertyResult[]> {
  const pageSize = filter.pageSize ?? 20;
  const page = filter.page ?? 0;

  const where: SQL[] = [];

  // Default to active-only unless explicitly asked for all.
  if (filter.status !== "all") {
    where.push(eq(properties.listingStatus, "active"));
  }

  if (filter.postcodeArea) {
    const norm = filter.postcodeArea.replace(/\s+/g, "").toUpperCase();
    if (norm) where.push(ilike(properties.postcode, `${norm}%`));
  }
  if (filter.priceMinPence !== undefined) {
    where.push(gte(properties.listingPrice, filter.priceMinPence));
  }
  if (filter.priceMaxPence !== undefined) {
    where.push(lte(properties.listingPrice, filter.priceMaxPence));
  }
  if (filter.bedroomsMin !== undefined) {
    where.push(gte(properties.bedrooms, filter.bedroomsMin));
  }
  if (filter.bedroomsMax !== undefined) {
    where.push(lte(properties.bedrooms, filter.bedroomsMax));
  }
  if (filter.propertyTypes && filter.propertyTypes.length > 0) {
    where.push(inArray(properties.propertyType, filter.propertyTypes));
  }

  // Fetch a few extra rows because the left-join may emit duplicates we'll
  // collapse in JS.
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
    .where(where.length > 0 ? and(...where) : undefined)
    .orderBy(desc(properties.createdAt))
    .limit(pageSize * 2)
    .offset(page * pageSize);

  const seen = new Set<string>();
  const out: PropertyResult[] = [];
  for (const r of rows) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    out.push(r);
    if (out.length >= pageSize) break;
  }
  return out;
}
