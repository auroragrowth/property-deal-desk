import type {
  NormalisedProperty,
  PropertyFeedAdapter,
  RawListing,
} from "./_interface";

// Manual-paste adapter — week 3 implementation.
//
// Fetches a Rightmove / Zoopla / Purplebricks listing URL once, parses
// JSON-LD + Open Graph metadata, returns a NormalisedProperty.
//
// Per the kickoff (section 3 override), this is the only feed adapter
// shipping in v1 dev. PropertyData (propertydata.ts) remains a stub.

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const UK_POSTCODE_RE =
  /\b([A-PR-UWYZ](?:[0-9][A-HJKPSTUW]?|[A-HK-Y][0-9](?:[0-9]|[ABEHMNPRV-Y])?)\s?[0-9][ABD-HJLNP-UW-Z]{2})\b/i;

type RawPaste = { url: string; html: string };

export const manualPasteAdapter: PropertyFeedAdapter = {
  source: "manual",

  async fetchOne(url: string): Promise<RawListing> {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-GB,en;q=0.9",
      },
      cache: "no-store",
      redirect: "follow",
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    const html = await res.text();
    return { url, html } satisfies RawPaste;
  },

  normalise(raw: RawListing): NormalisedProperty {
    const { url, html } = raw as RawPaste;
    const jsonLd = extractJsonLd(html);
    const og = extractOpenGraph(html);

    const postcode = pickPostcode(jsonLd) ?? scanPostcode(html) ?? "";
    const address =
      pickAddress(jsonLd) ??
      pickAddressFromText(html, og, postcode) ??
      "Unknown address";
    const price = pickPricePence(jsonLd, og, html) ?? 0;
    const bedrooms =
      pickBedrooms(jsonLd) ?? pickBedroomsFromText(html, og) ?? 0;
    const propertyType = pickType(jsonLd) ?? pickTypeFromText(html, og);
    const imageUrl = pickImage(jsonLd, og);
    const sourceListingId = extractListingId(url) ?? url;
    const estimatedMonthlyRent = estimateRentPence(price, bedrooms);

    return {
      source: "manual",
      source_listing_id: sourceListingId,
      source_url: url,
      address_line_1: address,
      postcode: normalise(postcode),
      city: null,
      county: null,
      latitude: null,
      longitude: null,
      property_type: propertyType,
      bedrooms,
      bathrooms: null,
      floor_area_m2: null,
      tenure: "unknown",
      epc_rating: null,
      listing_price: price,
      listing_status: "active",
      listed_at: new Date(),
      image_url: imageUrl,
      estimated_monthly_rent: estimatedMonthlyRent,
      raw_payload: { jsonLd, og, portal: pickPortal(url) },
    };
  },
};

function pickPortal(url: string): string {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("rightmove.co.uk")) return "rightmove";
    if (host.includes("zoopla.co.uk")) return "zoopla";
    if (host.includes("purplebricks.co.uk")) return "purplebricks";
  } catch {
    // ignore
  }
  return "unknown";
}

function extractListingId(url: string): string | null {
  const m = url.match(/\/(\d{6,})/);
  return m?.[1] ?? null;
}

function extractJsonLd(html: string): unknown[] {
  const out: unknown[] = [];
  const re =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(m[1].trim()) as unknown;
      if (Array.isArray(parsed)) out.push(...parsed);
      else out.push(parsed);
    } catch {
      // ignore malformed JSON-LD blocks
    }
  }
  return out;
}

function extractOpenGraph(html: string): Record<string, string> {
  const tags: Record<string, string> = {};
  const re =
    /<meta\s+(?:property|name)=["']([^"']+)["']\s+content=["']([^"']*)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (!(m[1] in tags)) tags[m[1]] = m[2];
  }
  return tags;
}

function getRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function pickAddress(jsonLd: unknown[]): string | null {
  for (const item of jsonLd) {
    const obj = getRecord(item);
    if (!obj) continue;
    const addr = obj.address;
    if (typeof addr === "string") return addr;
    const a = getRecord(addr);
    if (a) {
      const street = typeof a.streetAddress === "string" ? a.streetAddress : "";
      const locality =
        typeof a.addressLocality === "string" ? a.addressLocality : "";
      const joined = [street, locality].filter(Boolean).join(", ");
      if (joined) return joined;
    }
    if (typeof obj.name === "string") return obj.name;
  }
  return null;
}

function pickPostcode(jsonLd: unknown[]): string | null {
  for (const item of jsonLd) {
    const obj = getRecord(item);
    if (!obj) continue;
    const a = getRecord(obj.address);
    if (a && typeof a.postalCode === "string" && a.postalCode.trim()) {
      return a.postalCode;
    }
    const m = UK_POSTCODE_RE.exec(JSON.stringify(obj));
    if (m) return m[1];
  }
  return null;
}

function scanPostcode(html: string): string | null {
  const m = UK_POSTCODE_RE.exec(html);
  return m?.[1] ?? null;
}

function pickPricePence(
  jsonLd: unknown[],
  og: Record<string, string>,
  html: string,
): number | null {
  // 1. JSON-LD offers
  for (const item of jsonLd) {
    const obj = getRecord(item);
    if (!obj) continue;
    const offers = getRecord(obj.offers ?? obj.Offers);
    if (offers) {
      const p = offers.price;
      if (typeof p === "number") return Math.round(p * 100);
      if (typeof p === "string") {
        const n = parseFloat(p);
        if (!isNaN(n)) return Math.round(n * 100);
      }
    }
    if (typeof obj.price === "number") return Math.round(obj.price * 100);
  }

  // 2. Open Graph price
  const ogPrice = og["og:price:amount"] ?? og["product:price:amount"];
  if (ogPrice) {
    const n = parseFloat(ogPrice);
    if (!isNaN(n)) return Math.round(n * 100);
  }

  // 3. Page <title> — Rightmove/Zoopla typically embed "...£250,000..."
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    const t = poundToPence(titleMatch[1]);
    if (t) return t;
  }

  // 4. og:title (same pattern)
  if (og["og:title"]) {
    const t = poundToPence(og["og:title"]);
    if (t) return t;
  }

  // 5. og:description
  if (og["og:description"]) {
    const t = poundToPence(og["og:description"]);
    if (t) return t;
  }

  // 6. h1 contents
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match) {
    const t = poundToPence(h1Match[1]);
    if (t) return t;
  }

  // 7. First plausible £-prefixed number in the body (>= £1,000)
  const bodyMatch = html.match(/£\s?(\d{1,3}(?:,\d{3})+|\d{4,})(?:\.\d+)?/);
  if (bodyMatch) {
    const n = parseFloat(bodyMatch[1].replace(/,/g, ""));
    if (!isNaN(n) && n >= 1000) return Math.round(n * 100);
  }

  return null;
}

function poundToPence(text: string): number | null {
  const m = text.match(/£\s?(\d{1,3}(?:,\d{3})+|\d{4,})(?:\.\d+)?/);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/,/g, ""));
  if (isNaN(n) || n < 1000) return null;
  return Math.round(n * 100);
}

function pickBedrooms(jsonLd: unknown[]): number | null {
  for (const item of jsonLd) {
    const obj = getRecord(item);
    if (!obj) continue;
    if (typeof obj.numberOfBedrooms === "number") return obj.numberOfBedrooms;
    if (typeof obj.numberOfRooms === "number") return obj.numberOfRooms;
  }
  return null;
}

// Rule-of-thumb monthly rent in pence based on UK BTL gross-yield benchmarks.
// Smaller properties tend to higher yields, larger to lower. Wrong-but-useful;
// replaces with PropertyData rents when that integration ships.
function estimateRentPence(
  pricePence: number,
  bedrooms: number,
): number | null {
  if (pricePence <= 0) return null;
  const beds = Number.isFinite(bedrooms) ? bedrooms : 0;
  const yieldRate = beds <= 2 ? 0.066 : beds <= 4 ? 0.058 : 0.05;
  return Math.round((pricePence * yieldRate) / 12);
}

function pickImage(
  jsonLd: unknown[],
  og: Record<string, string>,
): string | null {
  for (const item of jsonLd) {
    const obj = getRecord(item);
    if (!obj) continue;
    const img = obj.image;
    if (typeof img === "string") return img;
    if (Array.isArray(img) && typeof img[0] === "string") return img[0];
    const imgObj = getRecord(img);
    if (imgObj && typeof imgObj.url === "string") return imgObj.url;
  }
  const ogImg =
    og["og:image:secure_url"] ?? og["og:image"] ?? og["twitter:image"];
  return ogImg ?? null;
}

function pickType(
  jsonLd: unknown[],
): NormalisedProperty["property_type"] | null {
  for (const item of jsonLd) {
    const obj = getRecord(item);
    if (!obj) continue;
    const type = String(obj["@type"] ?? "").toLowerCase();
    if (type.includes("apartment") || type.includes("flat")) return "flat";
    if (type.includes("terrace")) return "terrace";
    if (type.includes("detached")) return "detached";
    if (type.includes("house") || type.includes("residence")) return "semi";
  }
  return null;
}

function pickBedroomsFromText(
  html: string,
  og: Record<string, string>,
): number | null {
  const candidates = [og["og:title"], og["og:description"], extractTitle(html)];
  for (const text of candidates) {
    if (!text) continue;
    const m = text.match(/(\d+)\s*(?:bed(?:room)?s?)\b/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!isNaN(n) && n > 0 && n < 20) return n;
    }
  }
  return null;
}

function pickTypeFromText(
  html: string,
  og: Record<string, string>,
): NormalisedProperty["property_type"] {
  const candidates = [og["og:title"], og["og:description"], extractTitle(html)];
  const text = candidates.filter(Boolean).join(" ").toLowerCase();
  // Order matters — "semi-detached" must beat "detached"
  if (/semi[\s-]?detached/.test(text)) return "semi";
  if (/\bdetached\b/.test(text)) return "detached";
  if (/\bterrac/.test(text)) return "terrace";
  if (/\bflat\b|\bapartment\b|\bmaisonette\b/.test(text)) return "flat";
  if (/\bbungalow\b/.test(text)) return "semi";
  return "other";
}

function pickAddressFromText(
  html: string,
  og: Record<string, string>,
  postcode: string,
): string | null {
  // Rightmove's og:description sometimes contains the address before the
  // postcode. Try to extract the chunk just before the postcode.
  const desc = og["og:description"] ?? "";
  if (postcode && desc) {
    const i = desc.toUpperCase().indexOf(postcode.replace(/\s+/g, ""));
    if (i > 10) {
      const before = desc.slice(0, i).trim();
      const cleaned = before.replace(/[,\s]+$/, "").trim();
      if (cleaned.length >= 5 && cleaned.length <= 120) return cleaned;
    }
  }
  // Fall back to <h1> if it doesn't look like the generic boilerplate.
  const h1 = extractTag(html, "h1");
  if (h1 && !/rightmove|zoopla|purplebricks/i.test(h1) && h1.length <= 200) {
    return h1;
  }
  return null;
}

function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? stripTags(m[1]).trim() : "";
}

function extractTag(html: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = html.match(re);
  return m ? stripTags(m[1]).trim() : "";
}

function stripTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalise(pc: string): string {
  return pc.replace(/\s+/g, "").toUpperCase();
}
