import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { properties, propertyListings } from "@/lib/db/schema";
import type { NormalisedProperty } from "./adapters/_interface";

// Canonical upsert.
// 1. Find-or-create the row in `properties` keyed on (postcode, address_line_1).
// 2. Insert a per-source snapshot in `property_listings` (idempotent on
//    the (source, source_listing_id) unique index).
//
// Race window between the existence check and insert is acceptable for v1
// dev — the property_listings unique constraint is the safety net.

export async function upsertProperty(np: NormalisedProperty) {
  const existing = await db.query.properties.findFirst({
    where: and(
      eq(properties.postcode, np.postcode),
      eq(properties.addressLine1, np.address_line_1),
    ),
  });

  let propertyRow: typeof properties.$inferSelect;
  if (existing) {
    const [updated] = await db
      .update(properties)
      .set({
        listingPrice: np.listing_price,
        listingStatus: np.listing_status,
        bedrooms: np.bedrooms,
        bathrooms: np.bathrooms,
        propertyType: np.property_type,
        lastSeenAt: new Date(),
        ...(np.latitude !== null ? { latitude: np.latitude } : {}),
        ...(np.longitude !== null ? { longitude: np.longitude } : {}),
        ...(np.image_url ? { imageUrl: np.image_url } : {}),
        ...(np.estimated_monthly_rent !== null
          ? { estimatedMonthlyRent: np.estimated_monthly_rent }
          : {}),
      })
      .where(eq(properties.id, existing.id))
      .returning();
    propertyRow = updated;
  } else {
    const [inserted] = await db
      .insert(properties)
      .values({
        addressLine1: np.address_line_1,
        postcode: np.postcode,
        city: np.city,
        county: np.county,
        latitude: np.latitude,
        longitude: np.longitude,
        propertyType: np.property_type,
        bedrooms: np.bedrooms,
        bathrooms: np.bathrooms,
        floorAreaM2: np.floor_area_m2,
        tenure: np.tenure,
        epcRating: np.epc_rating,
        listingPrice: np.listing_price,
        listingStatus: np.listing_status,
        imageUrl: np.image_url,
        estimatedMonthlyRent: np.estimated_monthly_rent,
      })
      .returning();
    propertyRow = inserted;
  }

  await db
    .insert(propertyListings)
    .values({
      propertyId: propertyRow.id,
      source: np.source,
      sourceListingId: np.source_listing_id,
      sourceUrl: np.source_url,
      listedPrice: np.listing_price,
      status: np.listing_status,
      rawPayload: np.raw_payload as object,
    })
    .onConflictDoNothing();

  return propertyRow;
}
