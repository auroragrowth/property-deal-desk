// Postcode lookup with two providers:
//
// 1. ideal-postcodes.co.uk — paid, requires IDEAL_POSTCODES_KEY. Richer
//    PAF-backed data; preferred when the key is set.
// 2. postcodes.io — free, no key. Used as a fallback in dev or when the
//    paid provider errors / lacks coverage.

type PostcodeResult = {
  postcode: string;
  latitude: number;
  longitude: number;
  admin_district?: string;
  region?: string;
};

const POSTCODES_IO = "https://api.postcodes.io/postcodes";
const IDEAL = "https://api.ideal-postcodes.co.uk/v1/postcodes";

export async function lookupPostcode(
  postcode: string,
): Promise<PostcodeResult | null> {
  const norm = normalisePostcode(postcode);
  if (!norm) return null;

  const key = process.env.IDEAL_POSTCODES_KEY;
  if (key) {
    const r = await fromIdealPostcodes(norm, key);
    if (r) return r;
    // Fall through to postcodes.io if the paid provider returned nothing
    // (could be an out-of-PAF postcode, key issue, or transient network).
  }
  return fromPostcodesIo(norm);
}

async function fromIdealPostcodes(
  norm: string,
  key: string,
): Promise<PostcodeResult | null> {
  try {
    const res = await fetch(
      `${IDEAL}/${encodeURIComponent(norm)}?api_key=${encodeURIComponent(key)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      result?: Array<{
        postcode?: string;
        latitude?: number;
        longitude?: number;
        admin_district?: string;
        district?: string;
        county?: string;
        country?: string;
      }>;
    };
    const row = data.result?.[0];
    if (
      !row ||
      typeof row.latitude !== "number" ||
      typeof row.longitude !== "number"
    ) {
      return null;
    }
    return {
      postcode: row.postcode ?? norm,
      latitude: row.latitude,
      longitude: row.longitude,
      admin_district: row.admin_district ?? row.district,
      region: row.county ?? row.country,
    };
  } catch {
    return null;
  }
}

async function fromPostcodesIo(norm: string): Promise<PostcodeResult | null> {
  try {
    const res = await fetch(`${POSTCODES_IO}/${encodeURIComponent(norm)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: PostcodeResult };
    return data.result ?? null;
  } catch {
    return null;
  }
}

export function normalisePostcode(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}
