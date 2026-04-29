// postcodes.io lookup — free, no API key needed.
// Used at ingest time to attach lat/long to a property and to canonicalise
// the postcode string against the official record.

type PostcodeResult = {
  postcode: string;
  latitude: number;
  longitude: number;
  admin_district?: string;
  region?: string;
};

const ENDPOINT = "https://api.postcodes.io/postcodes";

export async function lookupPostcode(
  postcode: string,
): Promise<PostcodeResult | null> {
  const norm = normalisePostcode(postcode);
  if (!norm) return null;
  try {
    const res = await fetch(`${ENDPOINT}/${encodeURIComponent(norm)}`, {
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
