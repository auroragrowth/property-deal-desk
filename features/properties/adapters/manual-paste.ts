import type {
  NormalisedProperty,
  PropertyFeedAdapter,
  RawListing,
} from "./_interface";

// Manual-paste adapter — week 1 stub.
//
// Per the kickoff (section 3 override), PropertyData integration is deferred.
// The manual-paste adapter is the only adapter that ships in v1 dev.
// Real implementation lands in week 3 once the properties table is wired.

export const manualPasteAdapter: PropertyFeedAdapter = {
  source: "manual",

  async fetchOne(url: string): Promise<RawListing> {
    // TODO(week-3): fetch the URL, parse the listing HTML/JSON-LD, return raw.
    throw new Error(`manual-paste: fetchOne not implemented (url=${url})`);
  },

  normalise(_raw: RawListing): NormalisedProperty {
    // TODO(week-3): map raw payload to NormalisedProperty.
    throw new Error("manual-paste: normalise not implemented");
  },
};
