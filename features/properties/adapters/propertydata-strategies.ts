// All 39 PropertyData sourcing strategies, in a useful order.
// Slugs are the values for the /sourced-properties `list` param.

export type Strategy = {
  slug: string;
  label: string;
  group:
    | "deal-flow"
    | "yield"
    | "value-add"
    | "distress"
    | "physical"
    | "location";
};

export const STRATEGIES: Strategy[] = [
  // Deal flow / motivated sellers
  { slug: "back-on-market", label: "Back on market", group: "deal-flow" },
  { slug: "reduced-properties", label: "Reduced", group: "deal-flow" },
  { slug: "slow-to-sell-properties", label: "Slow to sell", group: "deal-flow" },
  { slug: "quick-sale-properties", label: "Quick sale", group: "deal-flow" },
  { slug: "properties-with-no-chain", label: "No chain", group: "deal-flow" },
  { slug: "auction-properties", label: "Auction", group: "deal-flow" },

  // Yield + tenant
  { slug: "high-yield-properties", label: "High yield", group: "yield" },
  { slug: "high-rental-demand", label: "High rental demand", group: "yield" },
  { slug: "tenanted-properties-for-sale", label: "Tenanted (for sale)", group: "yield" },
  { slug: "hmo-licenced-properties", label: "HMO licensed", group: "yield" },
  { slug: "holiday-let-properties", label: "Holiday let", group: "yield" },

  // Value-add / refurb
  { slug: "unmodernised-properties", label: "Unmodernised", group: "value-add" },
  { slug: "poor-epc-score", label: "Poor EPC", group: "value-add" },
  { slug: "suitable-for-splitting", label: "Suitable for splitting", group: "value-add" },
  { slug: "two-to-three-bed-conversions", label: "2→3-bed conversion", group: "value-add" },
  { slug: "one-to-two-bed-conversions", label: "1→2-bed conversion", group: "value-add" },
  { slug: "properties-with-an-annexe", label: "With annexe", group: "value-add" },
  { slug: "properties-with-planning-granted", label: "Planning granted", group: "value-add" },

  // Distress / discount
  { slug: "repossessed-properties", label: "Repossessed", group: "distress" },
  { slug: "cash-buyers-only-properties", label: "Cash buyers only", group: "distress" },
  { slug: "derelict-properties", label: "Derelict", group: "distress" },
  { slug: "short-lease-properties", label: "Short lease", group: "distress" },
  { slug: "cheap-per-square-foot", label: "Cheap £/sqft", group: "distress" },

  // Physical attributes
  { slug: "large-properties", label: "Large", group: "physical" },
  { slug: "investment-portfolios", label: "Portfolio", group: "physical" },
  { slug: "unbroken-freeholds", label: "Unbroken freehold", group: "physical" },
  { slug: "mixed-use", label: "Mixed-use", group: "physical" },
  { slug: "land-plots-for-sale", label: "Land plots", group: "physical" },
  { slug: "bungalows-for-sale", label: "Bungalow", group: "physical" },
  { slug: "georgian-houses", label: "Georgian", group: "physical" },
  { slug: "new-build-properties", label: "New build", group: "physical" },
  { slug: "properties-on-a-corner-plot", label: "Corner plot", group: "physical" },

  // Location plays
  { slug: "properties-with-good-views", label: "Good views", group: "location" },
  { slug: "near-green-space", label: "Near green space", group: "location" },
  { slug: "properties-near-a-university", label: "Near university", group: "location" },
  { slug: "walking-distance-to-town-centre", label: "Walking to town", group: "location" },
  { slug: "near-large-development", label: "Near development", group: "location" },
  { slug: "properties-near-great-school", label: "Near great school", group: "location" },
  { slug: "high-population-growth", label: "High population growth", group: "location" },
];

export const STRATEGY_BY_SLUG: Record<string, Strategy> = Object.fromEntries(
  STRATEGIES.map((s) => [s.slug, s]),
);

export const GROUP_LABELS: Record<Strategy["group"], string> = {
  "deal-flow": "Deal flow",
  yield: "Yield & tenant",
  "value-add": "Value-add / refurb",
  distress: "Distress / discount",
  physical: "Physical",
  location: "Location",
};

// Sensible defaults for first-time / empty searches.
export const DEFAULT_STRATEGIES = [
  "high-yield-properties",
  "back-on-market",
];
