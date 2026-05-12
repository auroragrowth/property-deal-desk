// Per "Mastering The Numbers" — every number on this profile feeds
// directly into one of the canonical formulas (gross yield, net yield,
// gross/net ROCE, money-left-in, all-money-out offer, net cashflow).
export type AssumptionProfile = {
  // Mortgage shape — interest-only model.
  // mortgage_monthly = price × ltv × rate / 12
  deposit_pct: number; // canonical 0.25 (LTV = 0.75)
  rate_pct: number; // canonical 0.05
  // Agent / management — applied as % of rent over 12 months.
  mgmt_pct: number; // canonical 0.10
  // Voids + maintenance are applied to running costs (net cashflow),
  // NOT to "expenses" (net yield) — see the PDF Expenses vs Running
  // Costs slides.
  void_pct: number;
  maintenance_pct: number;
  insurance_pcm: number; // monthly premium, pence
  // Acquisition / refurb costs that feed money-left-in.
  refurb: number; // pence
  legal_fees: number; // pence
  auction_fee: number; // pence
  sourcing_fee: number; // pence
  // GDV — gross development value (post-refurb worth).
  // If unset, engine assumes GDV = purchase price (no refinance uplift).
  gdv_pence?: number;
  // Optional rent override (else property.estimated_monthly_rent).
  rent_pcm?: number;
};

export type CriteriaProfile = {
  min_cashflow: number;
  min_roi: number;
  max_cash_required: number;
};

export type EngineProperty = {
  id: string;
  listing_price: number;
  estimated_monthly_rent: number | null;
  postcode: string;
  bedrooms: number;
  property_type: string;
};

export type EngineRunResult = {
  engine_version: string;
  outputs: Record<string, unknown>;
  pass: boolean;
  pass_reasons: string[];
  fail_reasons: string[];
};

export interface StrategyEngine {
  id: string;
  version: string;
  run(
    property: EngineProperty,
    assumptions: AssumptionProfile,
    criteria: CriteriaProfile,
  ): EngineRunResult;
}
