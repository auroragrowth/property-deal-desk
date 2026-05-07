import { getUserIdOrNull } from "@/lib/auth/server";
import { NextRequest, NextResponse } from "next/server";
import { manualPasteAdapter } from "@/features/properties/adapters/manual-paste";
import { lookupPostcode } from "@/features/properties/postcodes";
import { upsertProperty } from "@/features/properties/upsert";
import { emit } from "@/lib/events";
import { track } from "@/lib/analytics/server";
import { logAudit } from "@/lib/audit";

const SUPPORTED_HOSTS = /(rightmove|zoopla|purplebricks)\.co\.uk$/i;

export async function POST(req: NextRequest) {
  const userId = await getUserIdOrNull();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "auth", message: "Unauthorized" } },
      { status: 401 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { url?: unknown };
  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!url) {
    return NextResponse.json(
      { error: { code: "validation", message: "URL is required" } },
      { status: 400 },
    );
  }

  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return NextResponse.json(
      { error: { code: "validation", message: "Invalid URL" } },
      { status: 400 },
    );
  }
  if (!SUPPORTED_HOSTS.test(host)) {
    return NextResponse.json(
      {
        error: {
          code: "validation",
          message:
            "Only Rightmove, Zoopla, or Purplebricks URLs are supported in v1.",
        },
      },
      { status: 400 },
    );
  }

  let raw;
  try {
    raw = await manualPasteAdapter.fetchOne!(url);
  } catch (e) {
    return NextResponse.json(
      {
        error: {
          code: "fetch",
          message: `Could not fetch the listing: ${(e as Error).message}`,
        },
      },
      { status: 502 },
    );
  }

  let normalised;
  try {
    normalised = manualPasteAdapter.normalise(raw);
  } catch (e) {
    return NextResponse.json(
      {
        error: {
          code: "parse",
          message: `Could not parse the listing: ${(e as Error).message}`,
        },
      },
      { status: 422 },
    );
  }

  if (!normalised.postcode) {
    return NextResponse.json(
      {
        error: {
          code: "parse",
          message: "Could not find a UK postcode in that listing.",
        },
      },
      { status: 422 },
    );
  }
  if (!normalised.listing_price) {
    return NextResponse.json(
      {
        error: {
          code: "parse",
          message: "Could not find a price in that listing.",
        },
      },
      { status: 422 },
    );
  }

  // Canonicalise the postcode against postcodes.io and attach lat/long.
  const pc = await lookupPostcode(normalised.postcode);
  if (pc) {
    normalised.postcode = pc.postcode.replace(/\s+/g, "").toUpperCase();
    normalised.latitude = pc.latitude;
    normalised.longitude = pc.longitude;
  }

  const property = await upsertProperty(normalised);
  await emit("property.ingested", { source: normalised.source, count: 1 });
  await track(userId, "property_pasted", {
    source: normalised.source,
    propertyId: property.id,
  });
  await logAudit({
    actorUserId: userId,
    action: "create",
    entity: "property",
    entityId: property.id,
    after: { source: normalised.source, postcode: property.postcode },
  });

  return NextResponse.json({
    property: {
      id: property.id,
      addressLine1: property.addressLine1,
      postcode: property.postcode,
      listingPrice: property.listingPrice,
    },
  });
}
