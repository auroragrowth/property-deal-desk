"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type AssumptionDefaults = {
  deposit_pct: number; // decimal e.g. 0.25
  rate_pct: number; // decimal e.g. 0.0549
  mgmt_pct: number;
  void_pct: number;
  refurb_pence: number;
  legal_fees_pence: number;
  rent_pcm_pence: number | null;
};

type CriteriaDefaults = {
  min_cashflow_pence: number;
  min_roi_pct: number; // decimal e.g. 0.08
  max_cash_required_pence: number;
};

const fieldClass =
  "border-border focus:border-border-focus text-text-primary placeholder:text-text-tertiary focus:ring-accent-soft h-10 w-full rounded-md border-[0.5px] bg-transparent px-3 text-sm focus:ring-[3px] focus:outline-none";

const labelClass =
  "text-text-secondary mb-1 block text-[11px] font-medium tracking-wide uppercase";

export function AssumptionForm({
  dealId,
  assumptions,
  criteria,
}: {
  dealId: string;
  assumptions: AssumptionDefaults;
  criteria: CriteriaDefaults;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form values held as strings so empty input is preserved cleanly. Display
  // units (%, £) — convert to engine units (decimal, pence) on submit.
  const [depositPctPct, setDepositPctPct] = useState(
    String(round(assumptions.deposit_pct * 100, 1)),
  );
  const [ratePctPct, setRatePctPct] = useState(
    String(round(assumptions.rate_pct * 100, 2)),
  );
  const [mgmtPctPct, setMgmtPctPct] = useState(
    String(round(assumptions.mgmt_pct * 100, 1)),
  );
  const [voidPctPct, setVoidPctPct] = useState(
    String(round(assumptions.void_pct * 100, 1)),
  );
  const [refurbGbp, setRefurbGbp] = useState(
    String(Math.round(assumptions.refurb_pence / 100)),
  );
  const [legalGbp, setLegalGbp] = useState(
    String(Math.round(assumptions.legal_fees_pence / 100)),
  );
  const [rentGbp, setRentGbp] = useState(
    assumptions.rent_pcm_pence === null
      ? ""
      : String(Math.round(assumptions.rent_pcm_pence / 100)),
  );

  const [minCashflowGbp, setMinCashflowGbp] = useState(
    String(Math.round(criteria.min_cashflow_pence / 100)),
  );
  const [minRoiPct, setMinRoiPct] = useState(
    String(round(criteria.min_roi_pct * 100, 1)),
  );
  const [maxCashGbp, setMaxCashGbp] = useState(
    String(Math.round(criteria.max_cash_required_pence / 100)),
  );

  async function submit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const body = {
        assumptions: {
          deposit_pct: parsePct(depositPctPct),
          rate_pct: parsePct(ratePctPct),
          mgmt_pct: parsePct(mgmtPctPct),
          void_pct: parsePct(voidPctPct),
          refurb: parsePence(refurbGbp),
          legal_fees: parsePence(legalGbp),
          rent_pcm: rentGbp.trim() === "" ? null : parsePence(rentGbp),
        },
        criteria: {
          min_cashflow: parsePence(minCashflowGbp),
          min_roi: parsePct(minRoiPct),
          max_cash_required: parsePence(maxCashGbp),
        },
      };
      const res = await fetch(`/api/deals/${dealId}/analyse`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      let data: { error?: { message?: string } } = {};
      try {
        data = JSON.parse(text);
      } catch {
        // ignore
      }
      if (!res.ok) {
        throw new Error(
          data.error?.message ?? text ?? `Re-run failed (HTTP ${res.status})`,
        );
      }
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <details
      open
      className="bg-bg-surface border-border rounded-lg border-[0.5px]"
    >
      <summary className="text-text-primary hover:text-text-accent cursor-pointer p-5 font-serif text-xl">
        Assumptions
      </summary>
      <form onSubmit={submit} className="border-border border-t-[0.5px] p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Deposit %" suffix="%">
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              min={0}
              max={100}
              value={depositPctPct}
              onChange={(e) => setDepositPctPct(e.target.value)}
              className={fieldClass}
            />
          </Field>
          <Field label="Mortgage rate %" suffix="%">
            <input
              type="number"
              inputMode="decimal"
              step="0.05"
              min={0}
              max={20}
              value={ratePctPct}
              onChange={(e) => setRatePctPct(e.target.value)}
              className={fieldClass}
            />
          </Field>
          <Field label="Management %" suffix="%">
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              min={0}
              max={50}
              value={mgmtPctPct}
              onChange={(e) => setMgmtPctPct(e.target.value)}
              className={fieldClass}
            />
          </Field>
          <Field label="Void allowance %" suffix="%">
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              min={0}
              max={50}
              value={voidPctPct}
              onChange={(e) => setVoidPctPct(e.target.value)}
              className={fieldClass}
            />
          </Field>
          <Field label="Refurb £">
            <input
              type="number"
              inputMode="numeric"
              step={500}
              min={0}
              value={refurbGbp}
              onChange={(e) => setRefurbGbp(e.target.value)}
              className={fieldClass}
            />
          </Field>
          <Field label="Legal fees £">
            <input
              type="number"
              inputMode="numeric"
              step={100}
              min={0}
              value={legalGbp}
              onChange={(e) => setLegalGbp(e.target.value)}
              className={fieldClass}
            />
          </Field>
          <Field label="Rent £/month (override)">
            <input
              type="number"
              inputMode="numeric"
              step={25}
              min={0}
              placeholder="leave blank to use estimate"
              value={rentGbp}
              onChange={(e) => setRentGbp(e.target.value)}
              className={fieldClass}
            />
          </Field>
        </div>

        <p className="text-text-tertiary mt-6 mb-2 font-mono text-[11px] tracking-[0.12em] uppercase">
          Pass criteria
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Min cashflow £/mo">
            <input
              type="number"
              inputMode="numeric"
              step={25}
              min={0}
              value={minCashflowGbp}
              onChange={(e) => setMinCashflowGbp(e.target.value)}
              className={fieldClass}
            />
          </Field>
          <Field label="Min ROI %" suffix="%">
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              min={0}
              max={100}
              value={minRoiPct}
              onChange={(e) => setMinRoiPct(e.target.value)}
              className={fieldClass}
            />
          </Field>
          <Field label="Max cash £">
            <input
              type="number"
              inputMode="numeric"
              step={1000}
              min={0}
              value={maxCashGbp}
              onChange={(e) => setMaxCashGbp(e.target.value)}
              className={fieldClass}
            />
          </Field>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          {error ? (
            <p className="text-fail-fg text-sm">{error}</p>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={pending}
            className="bg-accent text-accent-on hover:bg-accent-hover active:bg-accent-pressed h-10 rounded-md px-5 text-sm font-medium disabled:opacity-50"
          >
            {pending ? "Re-running…" : "Re-run analysis"}
          </button>
        </div>
      </form>
    </details>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  suffix?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function parsePct(s: string): number {
  const n = parseFloat(s);
  if (!Number.isFinite(n)) return 0;
  return n / 100;
}

function parsePence(s: string): number {
  const n = parseFloat(s);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

function round(n: number, digits: number): number {
  const f = Math.pow(10, digits);
  return Math.round(n * f) / f;
}
