"use client";

import { useMemo, useState } from "react";
import { btlEngine } from "./engines/btl";
import type {
  AssumptionProfile,
  CriteriaProfile,
  EngineProperty,
} from "./engines/_interface";
import { computeMaxOfferForCriteria } from "./max-offer";
import { fmtPenceShort, fmtPercent } from "@/lib/btl/calc";

// Two-slider live analyser:
//   • Rent (£/mo) — slides between the PropertyData area low and high
//     for the property's beds. Re-runs the BTL engine on change.
//   • Money left in (£) — slides 0 → refinance budget. Default 0
//     ("all money out"). Adjusts the displayed offer price; the
//     headline All-Money-Out Offer stays fixed for reference.
//
// All math is pure (engine + max-offer), so changes update KPIs in
// the same frame — no server round-trip.

type Outputs = {
  gross_yield?: number;
  net_yield?: number;
  gross_roce?: number;
  net_roce?: number;
  money_left_in?: number;
  all_money_out_offer?: number;
  monthly_cashflow?: number;
  monthly_mortgage?: number;
  refinance_budget?: number;
  stamp_duty?: number;
  annual_expenses?: number;
  annual_running_costs?: number;
  stress_2pct?: { rate: number; monthly_cashflow: number };
};

export function InteractiveDealNumbers({
  property,
  assumptions,
  criteria,
  rentLowMonthlyPence,
  rentHighMonthlyPence,
  initialRentMonthlyPence,
}: {
  property: EngineProperty;
  assumptions: AssumptionProfile;
  criteria: CriteriaProfile;
  rentLowMonthlyPence: number | null;
  rentHighMonthlyPence: number | null;
  initialRentMonthlyPence: number | null;
}) {
  // ── Slider state ────────────────────────────────────────────────
  const hasRange =
    rentLowMonthlyPence != null && rentHighMonthlyPence != null &&
    rentHighMonthlyPence > rentLowMonthlyPence;

  // Conservative seed for the slider when PD gave us no range and no
  // rent has been entered yet — keep the control usable (±25% of seed).
  const fallbackSeed =
    initialRentMonthlyPence ?? property.estimated_monthly_rent ?? 100000;

  // Default rent = LOW end of the PD area range (most conservative starting
  // point), else last-run / property rent, else the seed.
  const defaultRent = hasRange
    ? rentLowMonthlyPence!
    : (initialRentMonthlyPence ?? property.estimated_monthly_rent ?? fallbackSeed);

  const [rentPence, setRentPence] = useState(defaultRent);
  const [moneyLeftInPence, setMoneyLeftInPence] = useState(0);

  // Rent slider bounds — fall back to ±25% of seed if PD has no range.
  const rentMin = hasRange
    ? rentLowMonthlyPence!
    : Math.max(0, Math.round(fallbackSeed * 0.75));
  const rentMax = hasRange
    ? rentHighMonthlyPence!
    : Math.round(fallbackSeed * 1.25);

  // ── Engine run with current rent ────────────────────────────────
  const result = useMemo(() => {
    return btlEngine.run(
      { ...property, estimated_monthly_rent: rentPence },
      { ...assumptions, rent_pcm: rentPence },
      criteria,
    );
  }, [property, assumptions, criteria, rentPence]);

  const o = result.outputs as Outputs;
  const allMoneyOutOffer = o.all_money_out_offer ?? 0;
  const refinanceBudget = o.refinance_budget ?? 0;

  // Money-left-in slider max: refinance budget. Step £500.
  const moneyMax = Math.max(refinanceBudget, 0);
  const targetOffer = allMoneyOutOffer + moneyLeftInPence;

  // Backward-engineered offer for criteria — refreshes per rent.
  const maxOfferForCriteria = useMemo(() => {
    return computeMaxOfferForCriteria(
      property.listing_price,
      { ...property, estimated_monthly_rent: rentPence },
      { ...assumptions, rent_pcm: rentPence },
      criteria,
    );
  }, [property, assumptions, criteria, rentPence]);

  return (
    <div className="space-y-6">
      {/* ── Sliders ─────────────────────────────────────────────── */}
      <section className="border-border bg-bg-surface space-y-5 rounded-lg border-[0.5px] p-5">
        <div>
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <label
              htmlFor="rent-slider"
              className="text-text-primary text-sm font-medium"
            >
              Monthly rent
            </label>
            <span className="text-text-primary font-serif text-lg">
              {fmtPenceShort(rentPence)}
              <span className="text-text-tertiary text-xs">/mo</span>
            </span>
          </div>
          <input
            id="rent-slider"
            type="range"
            min={rentMin}
            max={rentMax}
            step={2500}
            value={rentPence}
            onChange={(e) => setRentPence(Number(e.target.value))}
            className="accent-accent w-full"
          />
          <div className="text-text-tertiary mt-1 flex justify-between font-mono text-[10px]">
            <span>{fmtPenceShort(rentMin)}</span>
            <span>
              {hasRange ? "PropertyData range" : "±25% of estimate"}
            </span>
            <span>{fmtPenceShort(rentMax)}</span>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <label
              htmlFor="mli-slider"
              className="text-text-primary text-sm font-medium"
            >
              Money left in
            </label>
            <span className="text-text-primary font-serif text-lg">
              {fmtPenceShort(moneyLeftInPence)}
            </span>
          </div>
          <input
            id="mli-slider"
            type="range"
            min={0}
            max={moneyMax}
            step={50000}
            value={Math.min(moneyLeftInPence, moneyMax)}
            onChange={(e) => setMoneyLeftInPence(Number(e.target.value))}
            className="accent-accent w-full"
          />
          <div className="text-text-tertiary mt-1 flex justify-between font-mono text-[10px]">
            <span>£0 (all money out)</span>
            <span>step £500</span>
            <span>{fmtPenceShort(moneyMax)}</span>
          </div>
        </div>
      </section>

      {/* ── Offer prices, side by side ─────────────────────────── */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="border-pass-border bg-pass-bg text-pass-fg rounded-lg border-[0.5px] p-5">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase">
            Suggested offer
          </p>
          <p className="mt-1 font-serif text-3xl">
            {fmtPenceShort(targetOffer)}
          </p>
          <p className="mt-1 text-[11px] opacity-80">
            All-money-out offer + your chosen money left in.
          </p>
        </div>
        <div className="border-border bg-bg-surface rounded-lg border-[0.5px] p-5">
          <p className="text-text-tertiary font-mono text-[10px] tracking-[0.18em] uppercase">
            Max offer for criteria
          </p>
          <p
            className={`mt-1 font-serif text-3xl ${
              maxOfferForCriteria > 0 ? "text-pass-fg" : "text-fail-fg"
            }`}
          >
            {maxOfferForCriteria > 0
              ? fmtPenceShort(maxOfferForCriteria)
              : "—"}
          </p>
          <p className="text-text-tertiary mt-1 text-[11px]">
            Highest price that still passes cashflow, ROCE, money-left-in
            and stress at this rent.
          </p>
        </div>
      </section>

      {/* ── KPI grid (live) ────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Kpi label="Gross yield" value={fmtPercent(o.gross_yield ?? 0)} />
        <Kpi label="Net yield" value={fmtPercent(o.net_yield ?? 0)} />
        <Kpi
          label="Monthly cashflow"
          value={fmtPenceShort(o.monthly_cashflow ?? 0)}
          tone={(o.monthly_cashflow ?? 0) >= 0 ? "pass" : "fail"}
        />
        <Kpi label="Gross ROCE" value={fmtPercent(o.gross_roce ?? 0)} />
        <Kpi label="Net ROCE" value={fmtPercent(o.net_roce ?? 0)} />
        <Kpi
          label="Money left in"
          value={fmtPenceShort(o.money_left_in ?? 0)}
          tone={(o.money_left_in ?? 0) === 0 ? "pass" : "neutral"}
        />
        <Kpi
          label="All-money-out offer"
          value={fmtPenceShort(o.all_money_out_offer ?? 0)}
        />
        <Kpi
          label="Refinance budget (GDV × 75%)"
          value={fmtPenceShort(o.refinance_budget ?? 0)}
        />
        <Kpi
          label="Stamp duty (BTL)"
          value={fmtPenceShort(o.stamp_duty ?? 0)}
        />
      </section>

      {/* ── +2% stress ─────────────────────────────────────────── */}
      {o.stress_2pct && (
        <section className="bg-bg-surface border-border rounded-lg border-[0.5px] p-5">
          <p className="text-text-secondary mb-1 font-mono text-[11px] tracking-[0.12em] uppercase">
            Stress test (+2%)
          </p>
          <p className="text-text-primary text-sm">
            At a rate of{" "}
            <span className="font-mono">
              {fmtPercent(o.stress_2pct.rate)}
            </span>
            , monthly cashflow becomes{" "}
            <span
              className={
                o.stress_2pct.monthly_cashflow >= 0
                  ? "text-pass-fg font-medium"
                  : "text-fail-fg font-medium"
              }
            >
              {fmtPenceShort(o.stress_2pct.monthly_cashflow)}/mo
            </span>
            .
          </p>
        </section>
      )}

      {/* ── Live verdict + reasons ─────────────────────────────── */}
      <section className="space-y-3">
        <p
          className={`inline-block rounded-full border-[0.5px] px-3 py-1 font-mono text-[10px] tracking-wide uppercase ${
            result.pass
              ? "border-pass-border bg-pass-bg text-pass-fg"
              : "border-fail-border bg-fail-bg text-fail-fg"
          }`}
        >
          {result.pass ? "Pass" : "Fail"}
        </p>
        <ul className="space-y-1">
          {result.pass_reasons.map((r, i) => (
            <li
              key={`p-${i}`}
              className="text-text-primary flex items-start gap-2 text-sm"
            >
              <span aria-hidden className="text-pass-border mt-0.5">
                ✓
              </span>
              <span>{r}</span>
            </li>
          ))}
          {result.fail_reasons.map((r, i) => (
            <li
              key={`f-${i}`}
              className="text-text-primary flex items-start gap-2 text-sm"
            >
              <span aria-hidden className="text-fail-border mt-0.5">
                ✗
              </span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-text-tertiary text-xs">
        Live recalculation — nothing is saved until you tap{" "}
        <strong>Re-run analysis</strong> on the form below.
      </p>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "pass" | "fail" | "neutral";
}) {
  const valueClass =
    tone === "pass"
      ? "text-pass-fg"
      : tone === "fail"
        ? "text-fail-fg"
        : "text-text-primary";
  return (
    <div className="bg-bg-surface border-border rounded-lg border-[0.5px] p-5">
      <p className="text-text-tertiary font-mono text-[10px] tracking-[0.12em] uppercase">
        {label}
      </p>
      <p className={`mt-1 font-serif text-2xl ${valueClass}`}>{value}</p>
    </div>
  );
}
