import { describe, expect, it } from "vitest";
import { btlEngine } from "@/features/deals/engines/btl";
import type {
  AssumptionProfile,
  CriteriaProfile,
  EngineProperty,
} from "@/features/deals/engines/_interface";

// Canonical assumptions from "Mastering The Numbers":
//   deposit 25%, rate 5%, agent 10%, voids 5%, maintenance 5%,
//   insurance £20/mo, legals £2,000.
const baseAssumptions: AssumptionProfile = {
  deposit_pct: 0.25,
  rate_pct: 0.05,
  mgmt_pct: 0.1,
  void_pct: 0.05,
  maintenance_pct: 0.05,
  insurance_pcm: 2_000, // £20/mo
  refurb: 0,
  legal_fees: 200_000, // £2,000
  auction_fee: 0,
  sourcing_fee: 0,
};

const baseCriteria: CriteriaProfile = {
  min_cashflow: 20_000, // £200/mo
  min_roi: 0.08,
  max_cash_required: 5_000_000, // £50,000
};

// PDF Gross Yield example: £1,200pcm rent + £180k purchase → 8%.
const pdfYieldProperty: EngineProperty = {
  id: "pdf-yield",
  listing_price: 180_000_00,
  estimated_monthly_rent: 1_200_00,
  postcode: "IP11AA",
  bedrooms: 3,
  property_type: "semi",
};

// PDF "Money Left In ROCE" example: GDV £300k, ask £290k, rent £1,350pcm,
// refurb £30k, legals £2k, stamp computed (= £19,000 on £290k BTL).
const pdfRoceProperty: EngineProperty = {
  id: "pdf-roce",
  listing_price: 290_000_00,
  estimated_monthly_rent: 1_350_00,
  postcode: "IP11AA",
  bedrooms: 3,
  property_type: "semi",
};
const pdfRoceAssumptions: AssumptionProfile = {
  ...baseAssumptions,
  refurb: 30_000_00,
  legal_fees: 200_000,
  gdv_pence: 300_000_00,
};

describe("btlEngine — Mastering The Numbers", () => {
  it("is deterministic — same inputs, same outputs (brief §13)", () => {
    const a = btlEngine.run(pdfYieldProperty, baseAssumptions, baseCriteria);
    const b = btlEngine.run(pdfYieldProperty, baseAssumptions, baseCriteria);
    expect(a).toEqual(b);
  });

  it("emits engine_version btl-v2", () => {
    const r = btlEngine.run(pdfYieldProperty, baseAssumptions, baseCriteria);
    expect(r.engine_version).toBe("btl-v2");
  });

  // ── Headline formulae ───────────────────────────────────────────

  it("Gross Yield = Annual Rent / Purchase Price × 100", () => {
    // £1,200 × 12 = £14,400. £14,400 / £180,000 = 8.0%.
    const r = btlEngine.run(pdfYieldProperty, baseAssumptions, baseCriteria);
    expect((r.outputs.gross_yield as number) * 100).toBeCloseTo(8.0, 4);
  });

  it("Monthly mortgage = Price × LTV × rate / 12 (interest-only)", () => {
    // £180,000 × 0.75 × 0.05 / 12 = £562.50/mo = 56,250 pence
    const r = btlEngine.run(pdfYieldProperty, baseAssumptions, baseCriteria);
    expect(r.outputs.monthly_mortgage).toBe(56_250);
  });

  it("Annual agent = Rent × 10% × 12", () => {
    // £1,200 × 0.10 × 12 = £1,440 = 144,000 pence
    const r = btlEngine.run(pdfYieldProperty, baseAssumptions, baseCriteria);
    expect(r.outputs.annual_agent).toBe(144_000);
  });

  it("Annual insurance = monthly premium × 12", () => {
    // £20/mo × 12 = £240 = 24,000 pence
    const r = btlEngine.run(pdfYieldProperty, baseAssumptions, baseCriteria);
    expect(r.outputs.annual_insurance).toBe(24_000);
  });

  it("annual_expenses = mortgage + agent + insurance (NOT voids/maint)", () => {
    const r = btlEngine.run(pdfYieldProperty, baseAssumptions, baseCriteria);
    const o = r.outputs as Record<string, number>;
    expect(o.annual_expenses).toBe(
      o.annual_mortgage + o.annual_agent + o.annual_insurance,
    );
  });

  it("Net Yield = (Annual Rent − Annual Expenses) / Purchase × 100", () => {
    // Annual rent 14,400. Expenses = 562.50×12 + 1,440 + 240 = 6,750 + 1,440 + 240 = 8,430.
    // Net yield = (14,400 − 8,430) / 180,000 = 5,970/180,000 = 3.3167%.
    const r = btlEngine.run(pdfYieldProperty, baseAssumptions, baseCriteria);
    expect((r.outputs.net_yield as number) * 100).toBeCloseTo(3.3167, 3);
  });

  it("annual_running_costs = expenses + voids + maintenance", () => {
    const r = btlEngine.run(pdfYieldProperty, baseAssumptions, baseCriteria);
    const o = r.outputs as Record<string, number>;
    expect(o.annual_running_costs).toBe(
      o.annual_expenses + o.annual_voids + o.annual_maintenance,
    );
  });

  it("Net cashflow = monthly_rent − monthly_running_costs", () => {
    // Voids: 14,400 × 5% = 720. Maintenance: 14,400 × 5% = 720.
    // Running costs = 8,430 + 720 + 720 = 9,870.
    // Annual cashflow = 14,400 − 9,870 = 4,530. Monthly = 377.50.
    const r = btlEngine.run(pdfYieldProperty, baseAssumptions, baseCriteria);
    expect(r.outputs.annual_cashflow).toBe(453_000);
    expect(r.outputs.monthly_cashflow).toBe(37_750);
  });

  it("Money Left In = (purchase + refurb + stamp + legals + fees) − (GDV × 75%)", () => {
    // GDV 300k × 75% = 225k. Total in = 290k + 30k + stamp + 2k.
    // SDLT on £290k BTL (5/7/10 bands): 6,250 + 8,750 + 4,000 = £19,000.
    // Total in = 290,000 + 30,000 + 19,000 + 2,000 = 341,000.
    // Money left in = 341,000 − 225,000 = £116,000 = 11,600,000 pence.
    const r = btlEngine.run(pdfRoceProperty, pdfRoceAssumptions, baseCriteria);
    expect(r.outputs.refinance_budget).toBe(225_000_00);
    expect(r.outputs.stamp_duty).toBe(19_00_000); // 1,900,000 pence
    expect(r.outputs.money_left_in).toBe(116_000_00);
  });

  it("Gross ROCE = Annual Rent / Money Left In × 100", () => {
    // Rent 1,350 × 12 = £16,200. Money left in = £116,000.
    // Gross ROCE = 16,200 / 116,000 = 13.97%.
    const r = btlEngine.run(pdfRoceProperty, pdfRoceAssumptions, baseCriteria);
    expect((r.outputs.gross_roce as number) * 100).toBeCloseTo(13.9655, 2);
  });

  it("All-Money-Out Offer = (GDV × 75%) − refurb − stamp − legals − fees", () => {
    // 225,000 − 30,000 − 19,000 − 2,000 = £174,000 = 17,400,000 pence.
    const r = btlEngine.run(pdfRoceProperty, pdfRoceAssumptions, baseCriteria);
    expect(r.outputs.all_money_out_offer).toBe(174_000_00);
  });

  it("GDV defaults to purchase price when not set (no refinance uplift)", () => {
    const r = btlEngine.run(pdfYieldProperty, baseAssumptions, baseCriteria);
    expect(r.outputs.gdv).toBe(pdfYieldProperty.listing_price);
  });

  // ── Inputs / overrides ──────────────────────────────────────────

  it("uses rent_pcm override when set", () => {
    const r = btlEngine.run(
      pdfYieldProperty,
      { ...baseAssumptions, rent_pcm: 2_000_00 },
      baseCriteria,
    );
    expect(r.outputs.rent_source).toBe("override");
    expect(r.outputs.monthly_rent).toBe(2_000_00);
  });

  it("falls back to property.estimated_monthly_rent when no override", () => {
    const r = btlEngine.run(pdfYieldProperty, baseAssumptions, baseCriteria);
    expect(r.outputs.rent_source).toBe("estimated");
    expect(r.outputs.monthly_rent).toBe(
      pdfYieldProperty.estimated_monthly_rent,
    );
  });

  it("flags missing rent and fails the deal", () => {
    const r = btlEngine.run(
      { ...pdfYieldProperty, estimated_monthly_rent: null },
      baseAssumptions,
      baseCriteria,
    );
    expect(r.outputs.rent_source).toBe("missing");
    expect(r.pass).toBe(false);
    expect(
      r.fail_reasons.some((s) => s.toLowerCase().includes("no rent")),
    ).toBe(true);
  });

  // ── Stress test ─────────────────────────────────────────────────

  it("+2% stress test bumps the mortgage rate by 0.02 and recomputes cashflow", () => {
    const r = btlEngine.run(pdfYieldProperty, baseAssumptions, baseCriteria);
    const stress = r.outputs.stress_2pct as {
      rate: number;
      monthly_cashflow: number;
    };
    expect(stress.rate).toBeCloseTo(baseAssumptions.rate_pct + 0.02, 4);
    // Mortgage at 7% = 180,000 × 0.75 × 0.07 / 12 = £787.50/mo → annual 9,450.
    // Running 9,450 + 1,440 + 240 + 720 + 720 = 12,570.
    // Annual cashflow 14,400 − 12,570 = 1,830 → monthly 152.50.
    expect(stress.monthly_cashflow).toBe(15_250);
  });

  // ── Pass / fail ─────────────────────────────────────────────────

  it("fails when monthly cashflow is below the criteria minimum", () => {
    const r = btlEngine.run(pdfYieldProperty, baseAssumptions, {
      ...baseCriteria,
      min_cashflow: 10_000_000, // £100,000/mo
    });
    expect(r.pass).toBe(false);
    expect(
      r.fail_reasons.some((s) => s.toLowerCase().includes("cashflow")),
    ).toBe(true);
  });

  it("fails when money_left_in exceeds the criteria budget", () => {
    const r = btlEngine.run(pdfRoceProperty, pdfRoceAssumptions, {
      ...baseCriteria,
      max_cash_required: 1_000_000, // £10k budget — money left in is way more
    });
    expect(r.pass).toBe(false);
    expect(
      r.fail_reasons.some((s) => s.toLowerCase().includes("money left in")),
    ).toBe(true);
  });

  it("passes a deal that meets all criteria (cheap property, lenient criteria)", () => {
    const cheap: EngineProperty = {
      id: "cheap",
      listing_price: 100_000_00,
      estimated_monthly_rent: 800_00,
      postcode: "IP11AA",
      bedrooms: 2,
      property_type: "terrace",
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
