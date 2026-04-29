import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { propertyListings } from "@/lib/db/schema";
import { manualPasteAdapter } from "@/features/properties/adapters/manual-paste";
import { lookupPostcode } from "@/features/properties/postcodes";
import { upsertProperty } from "@/features/properties/upsert";
import { emit } from "@/lib/events";

// Vercel Cron hits this once a day per vercel.json. Validates against
// CRON_SECRET so anyone hitting the URL directly is rejected.
//
// Replays every manual-paste listing through the parser → upserts the
// canonical property row with fresh price / status / image / etc.
//
// Hobby plan: max 60 seconds. Realistically handles ~15-25 listings per
// run before timing out; chunk via offset/limit if we ever exceed that.

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: { code: "config", message: "CRON_SECRET not set" } },
      { status: 500 },
    );
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json(
      { error: { code: "auth", message: "Unauthorized" } },
      { status: 401 },
    );
  }

  const listings = await db
    .select({
      id: propertyListings.id,
      sourceUrl: propertyListings.sourceUrl,
    })
    .from(propertyListings)
    .where(eq(propertyListings.source, "manual"));

  const results = {
    total: listings.length,
    ok: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const listing of listings) {
    if (!listing.sourceUrl) continue;
    try {
      const raw = await manualPasteAdapter.fetchOne!(listing.sourceUrl);
      const np = manualPasteAdapter.normalise(raw);
      if (np.postcode) {
        const pc = await lookupPostcode(np.postcode);
        if (pc) {
          np.postcode = pc.postcode.replace(/\s+/g, "").toUpperCase();
          np.latitude = pc.latitude;
          np.longitude = pc.longitude;
        }
      }
      if (!np.postcode || !np.listing_price) {
        results.failed++;
        results.errors.push(`${listing.sourceUrl}: incomplete data`);
        continue;
      }
      await upsertProperty(np);
      results.ok++;
    } catch (e) {
      results.failed++;
      results.errors.push(`${listing.sourceUrl}: ${(e as Error).message}`);
    }
  }

  if (results.ok > 0) {
    await emit("property.ingested", {
      source: "manual_refresh",
      count: results.ok,
    });
  }

  return NextResponse.json(results);
}
