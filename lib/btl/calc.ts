// Money helpers — all amounts are integer pence per the engineering rules.
// Pure functions, deterministic, no side effects (brief §09).

/**
 * Standard repayment-mortgage monthly payment in pence.
 * Kept for backwards compatibility — the BTL engine now uses
 * `interestOnlyMonthly` per the Mastering The Numbers rules.
 */
export function calcMortgagePayment(
  principalPence: number,
  annualRate: number,
  years: number,
): number {
  if (principalPence <= 0 || years <= 0) return 0;
  const monthlyRate = annualRate / 12;
  const months = years * 12;
  if (monthlyRate === 0) return Math.round(principalPence / months);
  const factor = Math.pow(1 + monthlyRate, -months);
  return Math.round((principalPence * monthlyRate) / (1 - factor));
}

/**
 * Interest-only monthly mortgage payment in pence.
 *
 * Mastering The Numbers — Expenses slide:
 *   monthly = Purchase Price × LTV × annual_rate / 12
 *
 * e.g. £180,000 × 75% × 5% / 12 = £562.50/month.
 */
export function interestOnlyMonthly(
  pricePence: number,
  ltv: number,
  annualRate: number,
): number {
  if (pricePence <= 0 || ltv <= 0 || annualRate <= 0) return 0;
  return Math.round((pricePence * ltv * annualRate) / 12);
}

/**
 * UK SDLT for an additional dwelling (BTL) — England, post-April 2025
 * marginal banded rates. Returns tax in pence.
 *
 * TODO(v1.x): parameterise per nation (Wales LTT / Scotland LBTT / NI),
 *   and verify rates closer to launch.
 */
export function estimateStampDuty(pricePence: number): number {
  if (pricePence <= 0) return 0;
  const BANDS: Array<{ upToPence: number; rate: number }> = [
    { upToPence: 125_00 * 1000, rate: 0.05 }, // £125,000
    { upToPence: 250_00 * 1000, rate: 0.07 }, // £250,000
    { upToPence: 925_00 * 1000, rate: 0.1 }, // £925,000
    { upToPence: 1_500_00 * 1000, rate: 0.15 }, // £1,500,000
    { upToPence: Number.POSITIVE_INFINITY, rate: 0.17 },
  ];

  let tax = 0;
  let remaining = pricePence;
  let prevTop = 0;
  for (const band of BANDS) {
    if (remaining <= 0) break;
    const bandSpan = band.upToPence - prevTop;
    const taxed = Math.min(remaining, bandSpan);
    tax += taxed * band.rate;
    remaining -= taxed;
    prevTop = band.upToPence;
  }
  return Math.round(tax);
}

export function fmtPenceShort(pence: number): string {
  if (!Number.isFinite(pence)) return "—";
  const sign = pence < 0 ? "-" : "";
  return `£${sign}${Math.abs(Math.round(pence / 100)).toLocaleString("en-GB")}`;
}

export function fmtPercent(decimal: number, digits = 1): string {
  if (!Number.isFinite(decimal)) return "—";
  return `${(decimal * 100).toFixed(digits)}%`;
}
