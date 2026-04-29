import {
  calcMortgagePayment,
  estimateStampDuty,
  fmtPenceShort,
  fmtPercent,
} from "@/lib/btl/calc";
import type {
  AssumptionProfile,
  CriteriaProfile,
  EngineProperty,
  EngineRunResult,
  StrategyEngine,
} from "./_interface";

const TERM_YEARS = 25;

export const btlEngine: StrategyEngine = {
  id: "btl",
  version: "btl-v1",

  run(
    property: EngineProperty,
    assumptions: AssumptionProfile,
    criteria: CriteriaProfile,
  ): EngineRunResult {
    const price = property.listing_price;

    const depositPence = price * assumptions.deposit_pct;
    const principalPence = price - depositPence;

    const monthlyMortgage = calcMortgagePayment(
      principalPence,
      assumptions.rate_pct,
      TERM_YEARS,
    );
    const annualMortgage = monthlyMortgage * 12;

    // Rent: explicit override beats stored estimate; both are pence-per-month.
    const monthlyRent =
      assumptions.rent_pcm ?? property.estimated_monthly_rent ?? 0;
    const rentSource: "override" | "estimated" | "missing" =
      assumptions.rent_pcm !== undefined && assumptions.rent_pcm !== null
        ? "override"
        : property.estimated_monthly_rent && property.estimated_monthly_rent > 0
          ? "estimated"
          : "missing";
    const grossRent = monthlyRent * 12;

    const mgmtCost = grossRent * assumptions.mgmt_pct;
    const voidCost = grossRent * assumptions.void_pct;

    const annualCashflow = grossRent - mgmtCost - voidCost - annualMortgage;
    const monthlyCashflow = annualCashflow / 12;

    const stampDuty = estimateStampDuty(price);
    const cashRequired =
      depositPence +
      stampDuty +
      assumptions.refurb +
      assumptions.legal_fees;

    const roi = cashRequired > 0 ? annualCashflow / cashRequired : 0;
    const grossYield = price > 0 ? grossRent / price : 0;

    // +2% stress test
    const stressRate = assumptions.rate_pct + 0.02;
    const stressMortgage = calcMortgagePayment(
      principalPence,
      stressRate,
      TERM_YEARS,
    );
    const stressMonthlyCashflow =
      (grossRent - mgmtCost - voidCost - stressMortgage * 12) / 12;

    const passReasons: string[] = [];
    const failReasons: string[] = [];

    if (monthlyRent <= 0) {
      failReasons.push(
        "No rent estimate — set a monthly rent in your assumptions to analyse this property.",
      );
    } else {
      if (monthlyCashflow >= criteria.min_cashflow) {
        passReasons.push(
          `Monthly cashflow ${fmtPenceShort(monthlyCashflow)} meets minimum ${fmtPenceShort(criteria.min_cashflow)}`,
        );
      } else {
        failReasons.push(
          `Monthly cashflow ${fmtPenceShort(monthlyCashflow)} below minimum ${fmtPenceShort(criteria.min_cashflow)}`,
        );
      }

      if (roi >= criteria.min_roi) {
        passReasons.push(
          `Cash-on-cash ROI ${fmtPercent(roi)} meets minimum ${fmtPercent(criteria.min_roi)}`,
        );
      } else {
        failReasons.push(
          `Cash-on-cash ROI ${fmtPercent(roi)} below minimum ${fmtPercent(criteria.min_roi)}`,
        );
      }

      if (stressMonthlyCashflow >= 0) {
        passReasons.push(
          `Survives +2% stress test (${fmtPenceShort(stressMonthlyCashflow)}/mo at ${fmtPercent(stressRate)})`,
        );
      } else {
        failReasons.push(
          `Fails +2% stress test — cashflow drops to ${fmtPenceShort(stressMonthlyCashflow)}/mo at ${fmtPercent(stressRate)}`,
        );
      }
    }

    if (cashRequired <= criteria.max_cash_required) {
      passReasons.push(
        `Cash required ${fmtPenceShort(cashRequired)} within budget ${fmtPenceShort(criteria.max_cash_required)}`,
      );
    } else {
      failReasons.push(
        `Cash required ${fmtPenceShort(cashRequired)} exceeds budget ${fmtPenceShort(criteria.max_cash_required)}`,
      );
    }

    return {
      engine_version: "btl-v1",
      outputs: {
        cash_required: Math.round(cashRequired),
        deposit: Math.round(depositPence),
        stamp_duty: Math.round(stampDuty),
        annual_cashflow: Math.round(annualCashflow),
        monthly_cashflow: Math.round(monthlyCashflow),
        cash_on_cash_roi: roi,
        gross_yield: grossYield,
        monthly_rent: monthlyRent,
        rent_source: rentSource,
        monthly_mortgage: Math.round(monthlyMortgage),
        stress_2pct: {
          rate: stressRate,
          monthly_cashflow: Math.round(stressMonthlyCashflow),
        },
      },
      pass: failReasons.length === 0,
      pass_reasons: passReasons,
      fail_reasons: failReasons,
    };
  },
};
