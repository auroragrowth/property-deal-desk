import { describe, expect, it } from "vitest";
import { btlEngine } from "@/features/deals/engines/btl";
import type {
  AssumptionProfile,
  CriteriaProfile,
  EngineProperty,
} from "@/features/deals/engines/_interface";

const baseProperty: EngineProperty = {
  id: "test-property",
  listing_price: 200_000_00, // £200,000
  estimated_monthly_rent: 1_500_00, // £1,500/mo
  postcode: "PE11AA",
  bedrooms: 3,
  property_type: "semi",
};

const baseAssumptions: AssumptionProfile = {
  deposit_pct: 0.25,
  rate_pct: 0.0549,
  mgmt_pct: 0.1,
  void_pct: 0.05,
  refurb: 0,
  legal_fees: 200_000, // £2,000
};

const baseCriteria: CriteriaProfile = {
  min_cashflow: 20_000, // £200/mo
  min_roi: 0.08,
  max_cash_required: 5_000_000, // £50,000
};

describe("btlEngine", () => {
  it("is deterministic — same inputs always yield identical outputs (brief §13)", () => {
    const a = btlEngine.run(baseProperty, baseAssumptions, baseCriteria);
    const b = btlEngine.run(baseProperty, baseAssumptions, baseCriteria);
    expect(a).toEqual(b);
  });

  it("emits engine_version btl-v1", () => {
    const r = btlEngine.run(baseProperty, baseAssumptions, baseCriteria);
    expect(r.engine_version).toBe("btl-v1");
  });

  it("uses rent_pcm override when set", () => {
    const r = btlEngine.run(
      baseProperty,
      { ...baseAssumptions, rent_pcm: 2_000_00 },
      baseCriteria,
    );
    expect(r.outputs.rent_source).toBe("override");
    expect(r.outputs.monthly_rent).toBe(2_000_00);
  });

  it("falls back to property.estimated_monthly_rent when no override", () => {
    const r = btlEngine.run(baseProperty, baseAssumptions, baseCriteria);
    expect(r.outputs.rent_source).toBe("estimated");
    expect(r.outputs.monthly_rent).toBe(baseProperty.estimated_monthly_rent);
  });

  it("flags missing rent and fails the deal", () => {
    const r = btlEngine.run(
      { ...baseProperty, estimated_monthly_rent: null },
      baseAssumptions,
      baseCriteria,
    );
    expect(r.outputs.rent_source).toBe("missing");
    expect(r.pass).toBe(false);
    expect(
      r.fail_reasons.some((s) => s.toLowerCase().includes("no rent")),
    ).toBe(true);
  });

  it("includes a +2% stress test against the assumption rate", () => {
    const r = btlEngine.run(baseProperty, baseAssumptions, baseCriteria);
    const stress = r.outputs.stress_2pct as {
      rate: number;
      monthly_cashflow: number;
    };
    expect(stress.rate).toBeCloseTo(baseAssumptions.rate_pct + 0.02, 4);
    expect(typeof stress.monthly_cashflow).toBe("number");
  });

  it("cash_required = deposit + stamp duty + refurb + legal", () => {
    const r = btlEngine.run(
      baseProperty,
      { ...baseAssumptions, refurb: 5_000_00, legal_fees: 200_000 },
      baseCriteria,
    );
    const o = r.outputs as Record<string, number>;
    expect(o.deposit).toBe(50_000_00); // 25% of £200k
    // Stamp duty £200k = £6,250 + £5,250 = £11,500 → 1,150,000 pence
    expect(o.stamp_duty).toBe(1_150_000);
    expect(o.cash_required).toBe(
      o.deposit + o.stamp_duty + 5_000_00 + 200_000,
    );
  });

  it("fails when cashflow is below the criteria minimum", () => {
    const r = btlEngine.run(
      baseProperty,
      baseAssumptions,
      { ...baseCriteria, min_cashflow: 10_000_000 }, // ridiculous £100k/mo
    );
    expect(r.pass).toBe(false);
    expect(
      r.fail_reasons.some((s) => s.toLowerCase().includes("cashflow")),
    ).toBe(true);
  });

  it("passes a deal that meets all criteria", () => {
    const cheap: EngineProperty = {
      ...baseProperty,
      listing_price: 100_000_00, // £100k
      estimated_monthly_rent: 800_00, // £800/mo
    };
    const lenient: CriteriaProfile = {
      min_cashflow: 0,
      min_roi: 0,
      max_cash_required: 10_000_000_00,
    };
    const r = btlEngine.run(cheap, baseAssumptions, lenient);
    expect(r.pass).toBe(true);
    expect(r.fail_reasons).toEqual([]);
  });
});
