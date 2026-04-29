import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { dealResults, deals, properties, propertyListings } from "@/lib/db/schema";

export type DealView = {
  dealId: string;
  strategy: string;
  property: {
    id: string;
    addressLine1: string;
    postcode: string;
    listingPrice: number | null;
    bedrooms: number | null;
    propertyType: string | null;
    imageUrl: string | null;
    sourceUrl: string | null;
  };
  result: {
    id: string;
    engineVersion: string;
    outputs: Record<string, unknown>;
    pass: boolean;
    passReasons: string[];
    failReasons: string[];
    calculatedAt: Date | null;
  } | null;
};

export async function getDealView(
  dealId: string,
  userId: string,
): Promise<DealView | null> {
  const deal = await db.query.deals.findFirst({
    where: and(eq(deals.id, dealId), eq(deals.userId, userId)),
  });
  if (!deal) return null;

  const property = await db.query.properties.findFirst({
    where: eq(properties.id, deal.propertyId),
  });
  if (!property) return null;

  const listing = await db.query.propertyListings.findFirst({
    where: eq(propertyListings.propertyId, deal.propertyId),
  });

  const latestResult = await db
    .select()
    .from(dealResults)
    .where(eq(dealResults.dealId, dealId))
    .orderBy(desc(dealResults.calculatedAt))
    .limit(1);
  const result = latestResult[0] ?? null;

  return {
    dealId: deal.id,
    strategy: deal.strategy ?? "btl",
    property: {
      id: property.id,
      addressLine1: property.addressLine1,
      postcode: property.postcode,
      listingPrice: property.listingPrice,
      bedrooms: property.bedrooms,
      propertyType: property.propertyType,
      imageUrl: property.imageUrl,
      sourceUrl: listing?.sourceUrl ?? null,
    },
    result: result
      ? {
          id: result.id,
          engineVersion: result.engineVersion,
          outputs: result.outputs as Record<string, unknown>,
          pass: result.pass,
          passReasons: result.passReasons,
          failReasons: result.failReasons,
          calculatedAt: result.calculatedAt,
        }
      : null,
  };
}
