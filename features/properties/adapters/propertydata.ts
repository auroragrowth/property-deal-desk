import "server-only";
import type { NormalisedProperty } from "./_interface";

// PropertyData /sourced-properties adapter.
//
// Live UK market scanner — calls PropertyData's licensed listings feed
// (https://propertydata.co.uk/api/documentation/sourced-properties).
// Each call costs 1 Residential credit per 10 results, so callers
// should be intentional about how often this runs.

const BASE_URL = "https://api.propertydata.co.uk";

export type PropertyDataSearch = {
  postcode?: string;
  // What3words alt to postcode.
  w3w?: string;
  // Lat,lng alt to postcode.
  location?: string;
  // Miles. Default 40, min 1, max 200.
  radius?: number;
  // PropertyData "standardised_type" comma-list (or prefix with ! to exclude).
  // e.g. "flat,terrace_house" or "!commercial"
  standardisedType?: string;
  // Only properties listed within N days.
  maxAge?: number;
  // 1 to exclude SSTC, 0 to include.
  excludeSstc?: 0 | 1;
  // 10..500. Default 10.
  results?: number;
  // Saved list ID from PropertyData dashboard. If absent, falls back to
  // PROPERTYDATA_LIST_ID env var.
  list?: string;
};

export type PropertyDataItem = {
  id: string;
  address: string;
  postcode: string;
  latitude: number;
  longitude: number;
  distance?: number;
  price: number;
  bedrooms: number;
  type: string;
  type_standardised: string;
  image_url: string | null;
  listing_url: string;
  days_on_market?: number;
  years_remaining?: number | null;
  highest_offer?: number | null;
  reduced_by?: number | null;
  months_on_market?: number | null;
};

type PropertyDataResponse = {
  data: PropertyDataItem[];
  count: number;
};

export class PropertyDataConfigError extends Error {}
export class PropertyDataApiError extends Error {
  constructor(
    msg: string,
    readonly status: number,
  ) {
    super(msg);
  }
}

// Per-result shape after merging across multiple strategy lists.
export type SourcedHit = PropertyDataItem & {
  matched_lists: string[];
};

export async function searchSourcedProperties(
  q: PropertyDataSearch,
): Promise<PropertyDataItem[]> {
  const apiKey = process.env.PROPERTYDATA_API_KEY;
  if (!apiKey) throw new PropertyDataConfigError("PROPERTYDATA_API_KEY not set");

  const list = q.list ?? process.env.PROPERTYDATA_LIST_ID;
  if (!list)
    throw new PropertyDataConfigError(
      "PROPERTYDATA_LIST_ID not set (or pass `list` explicitly).",
    );

  const params = new URLSearchParams({ key: apiKey, list });
  if (q.postcode) params.set("postcode", q.postcode);
  if (q.w3w) params.set("w3w", q.w3w);
  if (q.location) params.set("location", q.location);
  if (q.radius != null) params.set("radius", String(q.radius));
  if (q.standardisedType)
    params.set("standardised_type", q.standardisedType);
  if (q.maxAge != null) params.set("max_age", String(q.maxAge));
  if (q.excludeSstc != null) params.set("exclude_sstc", String(q.excludeSstc));
  if (q.results != null) params.set("results", String(q.results));

  if (!q.postcode && !q.w3w && !q.location)
    throw new PropertyDataConfigError(
      "Provide one of postcode / w3w / location.",
    );

  const url = `${BASE_URL}/sourced-properties?${params}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new PropertyDataApiError(
      `PropertyData ${res.status}: ${body.slice(0, 200)}`,
      res.status,
    );
  }

  const json = (await res.json()) as Partial<PropertyDataResponse>;
  return json.data ?? [];
}

// Fan out one /sourced-properties call per strategy, dedupe by id, and
// attach which strategies each property matched. Failures on one list
// are surfaced via the per-list error map — they don't kill the others.
//
// 1 PropertyData credit per 10 results per list. Be sparing.
export async function searchAcrossLists(
  lists: string[],
  q: Omit<PropertyDataSearch, "list">,
): Promise<{
  hits: SourcedHit[];
  errorsByList: Record<string, string>;
}> {
  const settled = await Promise.allSettled(
    lists.map(async (list) => ({
      list,
      items: await searchSourcedProperties({ ...q, list }),
    })),
  );

  const byId = new Map<string, SourcedHit>();
  const errorsByList: Record<string, string> = {};

  for (let i = 0; i < settled.length; i++) {
    const res = settled[i];
    const list = lists[i];
    if (res.status === "rejected") {
      const e = res.reason as Error;
      errorsByList[list] = e.message ?? String(e);
      continue;
    }
    for (const item of res.value.items) {
      const existing = byId.get(item.id);
      if (existing) {
        if (!existing.matched_lists.includes(list))
          existing.matched_lists.push(list);
      } else {
        byId.set(item.id, { ...item, matched_lists: [list] });
      }
    }
  }

  return { hits: Array.from(byId.values()), errorsByList };
}

// Map PropertyData's standardised type to our NormalisedProperty.property_type.
function mapType(standardised: string): NormalisedProperty["property_type"] {
  const s = standardised.toLowerCase();
  if (s.includes("flat") || s.includes("apartment")) return "flat";
  if (s.includes("terrace")) return "terrace";
  if (s.includes("semi")) return "semi";
  if (s.includes("detached")) return "detached";
  return "other";
}

const stripPostcode = (pc: string): string =>
  pc.replace(/\s+/g, "").toUpperCase();

export function toNormalised(item: PropertyDataItem): NormalisedProperty {
  return {
    source: "propertydata",
    source_listing_id: item.id,
    source_url: item.listing_url,
    address_line_1: item.address,
    postcode: stripPostcode(item.postcode),
    city: null,
    county: null,
    latitude: item.latitude ?? null,
    longitude: item.longitude ?? null,
    property_type: mapType(item.type_standardised),
    bedrooms: item.bedrooms ?? 0,
    bathrooms: null,
    floor_area_m2: null,
    tenure: "unknown",
    epc_rating: null,
    listing_price: Math.round((item.price ?? 0) * 100),
    listing_status: "active",
    listed_at: new Date(),
    image_url: item.image_url ?? null,
    estimated_monthly_rent: null,
    raw_payload: item,
  };
}
