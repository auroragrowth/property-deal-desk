export type NormalisedProperty = {
  source: string;
  source_listing_id: string;
  source_url: string;
  address_line_1: string;
  postcode: string;
  city: string | null;
  county: string | null;
  latitude: number | null;
  longitude: number | null;
  property_type: "flat" | "terrace" | "semi" | "detached" | "other";
  bedrooms: number;
  bathrooms: number | null;
  floor_area_m2: number | null;
  tenure: "freehold" | "leasehold" | "unknown";
  epc_rating: string | null;
  listing_price: number;
  listing_status: "active" | "under_offer" | "sstc" | "withdrawn";
  listed_at: Date;
  raw_payload: unknown;
};

export type RawListing = unknown;

export interface PropertyFeedAdapter {
  source: string;
  fetchBatch?(since: Date): Promise<RawListing[]>;
  fetchOne?(url: string): Promise<RawListing>;
  normalise(raw: RawListing): NormalisedProperty;
}
