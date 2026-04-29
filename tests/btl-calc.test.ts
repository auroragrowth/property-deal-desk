import { describe, expect, it } from "vitest";
import {
  calcMortgagePayment,
  estimateStampDuty,
  fmtPenceShort,
  fmtPercent,
} from "@/lib/btl/calc";

describe("calcMortgagePayment", () => {
  it("returns 0 for non-positive principal", () => {
    expect(calcMortgagePayment(0, 0.05, 25)).toBe(0);
    expect(calcMortgagePayment(-100, 0.05, 25)).toBe(0);
  });

  it("returns 0 for non-positive years", () => {
    expect(calcMortgagePayment(100_000_00, 0.05, 0)).toBe(0);
  });

  it("falls back to simple division when rate is 0", () => {
    // £100,000 / (25 * 12) = £333.33/mo
    expect(calcMortgagePayment(100_000_00, 0, 25)).toBe(33333);
  });

  it("computes expected monthly payment for £200k @ 5% over 25 years (~£1,170)", () => {
    const monthly = calcMortgagePayment(200_000_00, 0.05, 25);
    // Independently: 200000 * (0.05/12) / (1 - (1.00417)^-300) ≈ £1,169.18
    expect(monthly).toBeGreaterThan(116_500);
    expect(monthly).toBeLessThan(117_500);
  });

  it("higher rate increases payment", () => {
    const low = calcMortgagePayment(150_000_00, 0.04, 25);
    const high = calcMortgagePayment(150_000_00, 0.07, 25);
    expect(high).toBeGreaterThan(low);
  });
});

describe("estimateStampDuty (UK BTL, post-April 2025 bands)", () => {
  it("returns 0 for non-positive price", () => {
    expect(estimateStampDuty(0)).toBe(0);
    expect(estimateStampDuty(-1)).toBe(0);
  });

  it("£100,000: only band 1 (5%) → £5,000", () => {
    expect(estimateStampDuty(100_000_00)).toBe(500_000);
  });

  it("£150,000: band 1 (£125k @ 5% = £6,250) + band 2 (£25k @ 7% = £1,750) = £8,000", () => {
    expect(estimateStampDuty(150_000_00)).toBe(800_000);
  });

  it("£400,000: bands 1+2+3 = £6,250 + £8,750 + £15,000 = £30,000", () => {
    expect(estimateStampDuty(400_000_00)).toBe(3_000_000);
  });

  it("£1,000,000: bands 1-4 = £6,250 + £8,750 + £67,500 + £11,250 = £93,750", () => {
    expect(estimateStampDuty(1_000_000_00)).toBe(9_375_000);
  });

  it("monotonic — higher price never reduces tax", () => {
    let prev = -1;
    for (const price of [100, 150, 250, 400, 925, 1_000, 1_500, 2_000]) {
      const tax = estimateStampDuty(price * 1000_00);
      expect(tax).toBeGreaterThanOrEqual(prev);
      prev = tax;
    }
  });
});

describe("formatters", () => {
  it("fmtPenceShort handles whole pounds, negatives, and non-finite", () => {
    expect(fmtPenceShort(1_234_56)).toBe("£1,235");
    expect(fmtPenceShort(0)).toBe("£0");
    expect(fmtPenceShort(-50_00)).toBe("£-50");
    expect(fmtPenceShort(Number.NaN)).toBe("—");
  });

  it("fmtPercent renders decimal as %", () => {
    expect(fmtPercent(0.0549)).toBe("5.5%");
    expect(fmtPercent(0.08, 2)).toBe("8.00%");
    expect(fmtPercent(Number.POSITIVE_INFINITY)).toBe("—");
  });
});
