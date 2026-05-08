import { NextRequest, NextResponse } from "next/server";
import { getUserIdOrNull } from "@/lib/auth/server";
import { manualPasteAdapter } from "@/features/properties/adapters/manual-paste";
import { lookupPostcode } from "@/features/properties/postcodes";

const SUPPORTED_HOSTS = /(rightmove|zoopla|purplebricks)\.co\.uk$/i;

// Parse a listing URL for the viewings flow.
//
// Unlike /api/properties/paste, this does NOT write to the
// `properties` table — it just returns the extracted metadata so the
// mobile capture page can preview it. Saving the property is deferred
// to the viewing-save step (or the existing paste flow if the user
// wants the property in their dashboard feed).

export async function POST(req: NextRequest) {
  const userId = await getUserIdOrNull();
  if (!userId)
    return NextResponse.json(
      { error: { code: "auth", message: "Unauthorized" } },
      { status: 401 },
    );

  const body = (await req.json().catch(() => ({}))) as { url?: unknown };
  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!url)
    return NextResponse.json(
      { error: { code: "validation", message: "URL is required" } },
      { status: 400 },
    );

  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return NextResponse.json(
      { error: { code: "validation", message: "Invalid URL" } },
      { status: 400 },
    );
  }
  if (!SUPPORTED_HOSTS.test(host))
    return NextResponse.json(
      {
        error: {
          code: "validation",
          message: "Use a Rightmove, Zoopla, or Purplebricks URL.",
        },
      },
      { status: 400 },
    );

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

  if (normalised.postcode) {
    const pc = await lookupPostcode(normalised.postcode);
    if (pc) {
      normalised.postcode = pc.postcode.replace(/\s+/g, "").toUpperCase();
      normalised.latitude = pc.latitude;
      normalised.longitude = pc.longitude;
    }
  }

  return NextResponse.json({
    address: normalised.address_line_1,
    postcode: normalised.postcode,
    pricePence: normalised.listing_price,
    bedrooms: normalised.bedrooms,
    propertyType: normalised.property_type,
    imageUrl: normalised.image_url,
    sourceUrl: normalised.source_url,
  });
}
