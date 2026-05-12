import { btlEngine } from "./engines/btl";
import type {
  AssumptionProfile,
  CriteriaProfile,
  EngineProperty,
} from "./engines/_interface";

// Binary-search the highest purchase price ≤ basePrice that satisfies
// every criterion in `criteria` (cashflow, net ROCE, money-left-in,
// +2% stress). Two "All-Money-Out Offer" cousins:
//
//   • all_money_out_offer (engine output): price that leaves zero
//     money in (PDF rule).
//   • this function: price that just clears all the user's thresholds.
//
// Returns 0 if no price down to £1 passes (criteria are unsolvable
// against this property's rent).
//
// Cost: one engine.run per binary-search step (≤ 20 steps for any
// realistic price range). Engine is pure; no side effects.

const STEP_PENCE = 10_000; // £100 granularity — finer is wasted UI noise.

export function computeMaxOfferForCriteria(
  basePrice: number,
  property: EngineProperty,
  assumptions: AssumptionProfile,
  criteria: CriteriaProfile,
): number {
  if (basePrice <= 0) return 0;

  const passes = (p: number) =>
    btlEngine.run(
      { ...property, listing_price: p },
      assumptions,
      criteria,
    ).pass;

  // Easy outs.
  if (passes(basePrice)) return basePrice;
  if (!passes(STEP_PENCE)) return 0;

  let lo = STEP_PENCE;
  let hi = basePrice;
  while (hi - lo > STEP_PENCE) {
    // Snap to £100 to avoid jittery odd-pound results.
    const mid =
      Math.round((lo + hi) / 2 / STEP_PENCE) * STEP_PENCE;
    if (mid === lo || mid === hi) break;
    if (passes(mid)) lo = mid;
    else hi = mid;
  }
  return lo;
}
