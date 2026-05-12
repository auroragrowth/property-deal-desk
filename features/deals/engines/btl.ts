import {
  estimateStampDuty,
  fmtPenceShort,
  fmtPercent,
  interestOnlyMonthly,
} from "@/lib/btl/calc";
import type {
  AssumptionProfile,
  CriteriaProfile,
  EngineProperty,
  EngineRunResult,
  StrategyEngine,
} from "./_interface";

// ─── BTL engine v2 ──────────────────────────────────────────────────
//
// Implementation of "Mastering The Numbers" verbatim:
//
//   Gross yield        = annual_rent / purchase × 100
//   Net yield          = (annual_rent − annual_expenses) / purchase × 100
//   Gross ROCE         = annual_rent / money_left_in × 100
//   Net ROCE           = (annual_rent − annual_expenses) / money_left_in × 100
//   Money left in      = total_costs − (GDV × 0.75)
//   All-money-out off. = (GDV × 0.75) − refurb − stamp − legals − fees
//   Net cashflow       = monthly_rent − monthly_running_costs
//
//   Monthly mortgage   = price × ltv × rate / 12   (interest-only)
//   Annual agent fee   = rent_pcm × 12 × mgmt_pct  (canonical 10%)
//   Annual insurance   = insurance_pcm × 12
//
// "Expenses" (net yield)        = mortgage + agent + insurance
// "Running costs" (cashflow)    = expenses + voids + maintenance
//
// +2% stress test (brief §13) is preserved on the interest-only model.

export const btlEngine: StrategyEngine = {
  id: "btl",
  version: "btl-v2",

  run(
    property: EngineProperty,
    assumptions: AssumptionProfile,
    criteria: CriteriaProfile,
  ): EngineRunResult {
    const price = property.listing_price;
    const ltv = 1 - assumptions.deposit_pct;

    // ── Inputs ──────────────────────────────────────────────────
    const monthlyRent =
      assumptions.rent_pcm ?? property.estimated_monthly_rent ?? 0;
    const rentSource: "override" | "estimated" | "missing" =
      assumptions.rent_pcm !== undefined && assumptions.rent_pcm !== null
        ? "override"
        : property.estimated_monthly_rent && property.estimated_monthly_rent > 0
          ? "estimated"
          : "missing";
    const annualRent = monthlyRent * 12;

    const gdv = assumptions.gdv_pence ?? price;
    const refinanceBudget = Math.round(gdv * 0.75); // GDV × 75%
    const stampDuty = estimateStampDuty(price);
    const totalFees =
      assumptions.refurb +
      stampDuty +
      assumptions.legal_fees +
      assumptions.auction_fee +
      assumptions.sourcing_fee;
    const totalIn = price + totalFees; // every quid spent acquiring + improving

    // Money left in = total spend − refinance amount (≥ 0)
    const moneyLeftIn = Math.max(0, totalIn - refinanceBudget);

    // All-money-out offer = refinance budget − refurb − stamp − legals − fees.
    // Computed using stamp on the user's input purchase-price; if they
    // offer lower the stamp drops, so this is a conservative target.
    const allMoneyOutOffer = Math.round(
      refinanceBudget -
        assumptions.refurb -
        stampDuty -
        assumptions.legal_fees -
        assumptions.auction_fee -
        assumptions.sourcing_fee,
    );

    // ── Expenses (Net Yield) ────────────────────────────────────
    const monthlyMortgage = interestOnlyMonthly(
      price,
      ltv,
      assumptions.rate_pct,
    );
    const annualMortgage = monthlyMortgage * 12;
    const annualAgent = Math.round(annualRent * assumptions.mgmt_pct);
    const annualInsurance = assumptions.insurance_pcm * 12;
    const annualExpenses = annualMortgage + annualAgent + annualInsurance;

    // ── Running costs (Net Cashflow) ────────────────────────────
    const annualVoids = Math.round(annualRent * assumptions.void_pct);
    const annualMaintenance = Math.round(
      annualRent * assumptions.maintenance_pct,
    );
    const annualRunningCosts =
      annualExpenses + annualVoids + annualMaintenance;
    const annualCashflow = annualRent - annualRunningCosts;
    const monthlyCashflow = Math.round(annualCashflow / 12);

    // ── Headline metrics ────────────────────────────────────────
    const grossYield = price > 0 ? annualRent / price : 0;
    const netYield = price > 0 ? (annualRent - annualExpenses) / price : 0;
    const grossRoce = moneyLeftIn > 0 ? annualRent / moneyLeftIn : 0;
    const netRoce =
      moneyLeftIn > 0 ? (annualRent - annualExpenses) / moneyLeftIn : 0;

    // ── +2% stress test ─────────────────────────────────────────
    const stressRate = assumptions.rate_pct + 0.02;
    const stressMortgage = interestOnlyMonthly(price, ltv, stressRate);
    const stressAnnualMortgage = stressMortgage * 12;
    const stressAnnualRunning =
      stressAnnualMortgage +
      annualAgent +
      annualInsurance +
      annualVoids +
      annualMaintenance;
    const stressMonthlyCashflow = Math.round(
      (annualRent - stressAnnualRunning) / 12,
    );

    // ── Pass / fail ─────────────────────────────────────────────
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

      if (netRoce >= criteria.min_roi) {
        passReasons.push(
          `Net ROCE ${fmtPercent(netRoce)} meets minimum ${fmtPercent(criteria.min_roi)}`,
        );
      } else {
        failReasons.push(
          `Net ROCE ${fmtPercent(netRoce)} below minimum ${fmtPercent(criteria.min_roi)}`,
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

    if (moneyLeftIn <= criteria.max_cash_required) {
      passReasons.push(
        `Money left in ${fmtPenceShort(moneyLeftIn)} within budget ${fmtPenceShort(criteria.max_cash_required)}`,
      );
    } else {
      failReasons.push(
        `Money left in ${fmtPenceShort(moneyLeftIn)} exceeds budget ${fmtPenceShort(criteria.max_cash_required)}`,
      );
    }

    return {
      engine_version: "btl-v2",
      outputs: {
        // Mastering The Numbers headline metrics
        gross_yield: grossYield,
        net_yield: netYield,
        gross_roce: grossRoce,
        net_roce: netRoce,
        money_left_in: moneyLeftIn,
        all_money_out_offer: allMoneyOutOffer,
        monthly_cashflow: monthlyCashflow,
        annual_cashflow: annualCashflow,
        // Working — exposed so the deal page can show the breakdown
        gdv,
        refinance_budget: refinanceBudget,
        purchase_price: price,
        total_in: totalIn,
        stamp_duty: stampDuty,
        monthly_mortgage: monthlyMortgage,
        annual_mortgage: annualMortgage,
        annual_agent: annualAgent,
        annual_insurance: annualInsurance,
        annual_expenses: annualExpenses,
        annual_voids: annualVoids,
        annual_maintenance: annualMaintenance,
        annual_running_costs: annualRunningCosts,
        monthly_rent: monthlyRent,
        rent_source: rentSource,
        stress_2pct: {
          rate: stressRate,
          monthly_cashflow: stressMonthlyCashflow,
        },
      },
      pass: failReasons.length === 0,
      pass_reasons: passReasons,
      fail_reasons: failReasons,
    };
  },
};
