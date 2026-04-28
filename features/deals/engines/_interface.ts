export type AssumptionProfile = {
  deposit_pct: number;
  rate_pct: number;
  mgmt_pct: number;
  void_pct: number;
  refurb: number;
  legal_fees: number;
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
