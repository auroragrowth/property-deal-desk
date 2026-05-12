import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getUserIdOrNull } from "@/lib/auth/server";
import { getDealView, type DealResultView } from "@/features/deals/queries";
import { fmtPenceShort, fmtPercent } from "@/lib/btl/calc";
import { AssumptionForm } from "@/features/deals/assumption-form";
import { computeMaxOfferForCriteria } from "@/features/deals/max-offer";

const formatPostcode = (pc: string) => {
  if (pc.length <= 4) return pc;
  return `${pc.slice(0, pc.length - 3)} ${pc.slice(-3)}`;
};

const portalLabel = (host: string) => {
  if (host.includes("rightmove")) return "Rightmove";
  if (host.includes("zoopla")) return "Zoopla";
  if (host.includes("purplebricks")) return "Purplebricks";
  return "the listing";
};

type Outputs = {
  // Headline (Mastering The Numbers)
  gross_yield?: number;
  net_yield?: number;
  gross_roce?: number;
  net_roce?: number;
  money_left_in?: number;
  all_money_out_offer?: number;
  monthly_cashflow?: number;
  annual_cashflow?: number;
  // Working breakdown
  gdv?: number;
  refinance_budget?: number;
  total_in?: number;
  stamp_duty?: number;
  monthly_mortgage?: number;
  annual_mortgage?: number;
  annual_agent?: number;
  annual_insurance?: number;
  annual_expenses?: number;
  annual_voids?: number;
  annual_maintenance?: number;
  annual_running_costs?: number;
  monthly_rent?: number;
  rent_source?: "override" | "estimated" | "missing";
  stress_2pct?: { rate: number; monthly_cashflow: number };
  // Legacy (kept so old result rows still render)
  cash_required?: number;
  deposit?: number;
  cash_on_cash_roi?: number;
};

const RENT_SOURCE_LABEL: Record<NonNullable<Outputs["rent_source"]>, string> = {
  override: "your override",
  estimated: "auto-estimated from yield benchmarks",
  missing: "missing — set in your assumptions",
};

export default async function DealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getUserIdOrNull();
  if (!userId) redirect("/sign-in");
  const { id } = await params;

  const view = await getDealView(id, userId);
  if (!view) notFound();
  const { property, result, history } = view;

  // Defaults for the assumption form: prefer the latest run's snapshot.
  const lastSnap =
    (result?.assumptionSnapshot ?? {}) as {
      assumptions?: {
        deposit_pct?: number;
        rate_pct?: number;
        mgmt_pct?: number;
        void_pct?: number;
        maintenance_pct?: number;
        insurance_pcm?: number;
        refurb?: number;
        legal_fees?: number;
        auction_fee?: number;
        sourcing_fee?: number;
        gdv_pence?: number | null;
        rent_pcm?: number | null;
      };
      criteria?: {
        min_cashflow?: number;
        min_roi?: number;
        max_cash_required?: number;
      };
    };
  const formAssumptions = {
    deposit_pct: lastSnap.assumptions?.deposit_pct ?? 0.25,
    rate_pct: lastSnap.assumptions?.rate_pct ?? 0.05,
    mgmt_pct: lastSnap.assumptions?.mgmt_pct ?? 0.1,
    void_pct: lastSnap.assumptions?.void_pct ?? 0.05,
    maintenance_pct: lastSnap.assumptions?.maintenance_pct ?? 0.05,
    insurance_pcm_pence: lastSnap.assumptions?.insurance_pcm ?? 2000,
    refurb_pence: lastSnap.assumptions?.refurb ?? 0,
    legal_fees_pence: lastSnap.assumptions?.legal_fees ?? 200000,
    auction_fee_pence: lastSnap.assumptions?.auction_fee ?? 0,
    sourcing_fee_pence: lastSnap.assumptions?.sourcing_fee ?? 0,
    gdv_pence: lastSnap.assumptions?.gdv_pence ?? null,
    rent_pcm_pence: lastSnap.assumptions?.rent_pcm ?? null,
  };
  const formCriteria = {
    min_cashflow_pence: lastSnap.criteria?.min_cashflow ?? 20000,
    min_roi_pct: lastSnap.criteria?.min_roi ?? 0.08,
    max_cash_required_pence: lastSnap.criteria?.max_cash_required ?? 5000000,
  };

  // Backward-engineered offer: highest price ≤ listing that still
  // passes the current criteria (min cashflow, min Net ROCE,
  // max money-left-in, +2% stress).
  // Use the last run's rent (override > engine fallback) so the
  // backward-search agrees with the on-screen verdict.
  const lastRunRent =
    (result?.outputs as { monthly_rent?: number } | undefined)?.monthly_rent ??
    null;
  const maxOfferForCriteria = result
    ? computeMaxOfferForCriteria(
        property.listingPrice ?? 0,
        {
          id: property.id,
          listing_price: property.listingPrice ?? 0,
          estimated_monthly_rent: lastRunRent,
          postcode: property.postcode,
          bedrooms: property.bedrooms ?? 0,
          property_type: property.propertyType ?? "other",
        },
        {
          deposit_pct: formAssumptions.deposit_pct,
          rate_pct: formAssumptions.rate_pct,
          mgmt_pct: formAssumptions.mgmt_pct,
          void_pct: formAssumptions.void_pct,
          maintenance_pct: formAssumptions.maintenance_pct,
          insurance_pcm: formAssumptions.insurance_pcm_pence,
          refurb: formAssumptions.refurb_pence,
          legal_fees: formAssumptions.legal_fees_pence,
          auction_fee: formAssumptions.auction_fee_pence,
          sourcing_fee: formAssumptions.sourcing_fee_pence,
          gdv_pence: formAssumptions.gdv_pence ?? undefined,
          rent_pcm: formAssumptions.rent_pcm_pence ?? undefined,
        },
        {
          min_cashflow: formCriteria.min_cashflow_pence,
          min_roi: formCriteria.min_roi_pct,
          max_cash_required: formCriteria.max_cash_required_pence,
        },
      )
    : 0;

  let host = "";
  try {
    host = property.sourceUrl
      ? new URL(property.sourceUrl).hostname.toLowerCase()
      : "";
  } catch {
    host = "";
  }

  const o = (result?.outputs ?? {}) as Outputs;
  const verdictClass =
    result === null
      ? "bg-bg-surface-2 border-border-strong text-text-primary"
      : result.pass
        ? "bg-pass-bg text-pass-fg border-pass-border"
        : "bg-fail-bg text-fail-fg border-fail-border";
  const verdictLabel =
    result === null ? "Pending" : result.pass ? "Pass" : "Fail";

  return (
    <main id="main" className="bg-bg-page max-w-prose mx-auto p-8">
      <Link
        href="/watchlist"
        className="text-text-secondary mb-4 inline-block text-xs underline-offset-2 hover:underline"
      >
        ← Back to watchlist
      </Link>

      <header className="mb-6">
        <p className="text-accent mb-2 font-mono text-xs tracking-[0.18em] uppercase">
          09 / Deal · btl
        </p>
        <h1 className="text-text-primary font-serif text-3xl leading-tight">
          {property.addressLine1}
        </h1>
        <p className="text-text-secondary mt-1 font-mono text-xs tracking-wide">
          {formatPostcode(property.postcode)} ·{" "}
          {fmtPenceShort(property.listingPrice ?? 0)} ·{" "}
          {property.bedrooms ?? "—"} bed · {property.propertyType ?? "—"}
        </p>
        {property.sourceUrl && (
          <a
            href={property.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent mt-1 inline-block text-xs underline underline-offset-2"
          >
            View on {portalLabel(host)} ↗
          </a>
        )}
      </header>

      {/* Verdict banner */}
      <section
        className={`rounded-r-md border-l-[3px] px-5 py-4 ${verdictClass}`}
      >
        <p className="font-mono text-xs tracking-[0.12em] uppercase">
          Verdict
        </p>
        <p className="font-serif text-2xl">
          {verdictLabel}
          {result === null
            ? " — analysis hasn't run yet."
            : result.pass
              ? " — meets your criteria."
              : ` — ${result.failReasons.length} ${result.failReasons.length === 1 ? "issue" : "issues"} below.`}
        </p>
      </section>

      {/* Mastering The Numbers — headline grid */}
      {result && (
        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
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
            label="Max offer for your criteria"
            value={
              maxOfferForCriteria > 0
                ? fmtPenceShort(maxOfferForCriteria)
                : "—"
            }
            tone={maxOfferForCriteria > 0 ? "pass" : "fail"}
          />
          <Kpi
            label="Stamp duty (BTL)"
            value={fmtPenceShort(o.stamp_duty ?? 0)}
          />
          <Kpi
            label="Refinance budget (GDV × 75%)"
            value={fmtPenceShort(o.refinance_budget ?? 0)}
          />
        </section>
      )}

      {/* Stress test */}
      {result && o.stress_2pct && (
        <section className="bg-bg-surface border-border mt-6 rounded-lg border-[0.5px] p-5">
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

      {/* Reasons */}
      {result && (
        <section className="mt-6">
          <h2 className="text-text-primary mb-3 font-serif text-xl">
            Reasons
          </h2>
          <ul className="space-y-2">
            {result.passReasons.map((r, i) => (
              <li key={`p-${i}`} className="flex items-start gap-2 text-sm">
                <span aria-hidden className="text-pass-border mt-0.5">
                  ✓
                </span>
                <span className="text-text-primary">{r}</span>
              </li>
            ))}
            {result.failReasons.map((r, i) => (
              <li key={`f-${i}`} className="flex items-start gap-2 text-sm">
                <span aria-hidden className="text-fail-border mt-0.5">
                  ✗
                </span>
                <span className="text-text-primary">{r}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Numbers detail */}
      {result && (
        <section className="bg-bg-surface border-border mt-6 rounded-lg border-[0.5px] p-5">
          <p className="text-text-secondary mb-3 font-mono text-[11px] tracking-[0.12em] uppercase">
            How we got there
          </p>
          <dl className="text-text-primary grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <Row
              label="Monthly rent"
              value={`${fmtPenceShort(o.monthly_rent ?? 0)}/mo${o.rent_source ? ` · ${RENT_SOURCE_LABEL[o.rent_source]}` : ""}`}
            />
            <Row
              label="Monthly mortgage (IO)"
              value={`${fmtPenceShort(o.monthly_mortgage ?? 0)}/mo`}
            />
            <Row
              label="Annual agent fee"
              value={fmtPenceShort(o.annual_agent ?? 0)}
            />
            <Row
              label="Annual insurance"
              value={fmtPenceShort(o.annual_insurance ?? 0)}
            />
            <Row
              label="Annual expenses (net yield)"
              value={fmtPenceShort(o.annual_expenses ?? 0)}
            />
            <Row
              label="Annual voids"
              value={fmtPenceShort(o.annual_voids ?? 0)}
            />
            <Row
              label="Annual maintenance"
              value={fmtPenceShort(o.annual_maintenance ?? 0)}
            />
            <Row
              label="Annual running costs (cashflow)"
              value={fmtPenceShort(o.annual_running_costs ?? 0)}
            />
            <Row label="GDV" value={fmtPenceShort(o.gdv ?? 0)} />
            <Row label="Total in" value={fmtPenceShort(o.total_in ?? 0)} />
          </dl>
        </section>
      )}

      {/* Inline assumption editor */}
      <section className="mt-8">
        <AssumptionForm
          dealId={view.dealId}
          assumptions={formAssumptions}
          criteria={formCriteria}
        />
      </section>

      {/* Result history */}
      {history.length > 0 && (
        <section className="mt-8">
          <h2 className="text-text-primary mb-3 font-serif text-xl">
            Previous runs
          </h2>
          <ol className="border-border bg-bg-surface divide-border divide-y rounded-lg border-[0.5px]">
            {history.map((h) => (
              <HistoryRow key={h.id} run={h} />
            ))}
          </ol>
        </section>
      )}

      <p className="text-text-tertiary mt-8 text-xs">
        Indicative analysis only. Not regulated advice. Engine version{" "}
        <span className="font-mono">{result?.engineVersion ?? "—"}</span>.
        Every re-run inserts a new history row — previous results are kept.
      </p>
    </main>
  );
}

function HistoryRow({ run }: { run: DealResultView }) {
  const o = (run.outputs ?? {}) as Outputs;
  const when = run.calculatedAt
    ? new Date(run.calculatedAt).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";
  return (
    <li className="flex items-baseline justify-between gap-3 px-4 py-3 text-sm">
      <span className="text-text-tertiary font-mono text-[11px] tracking-wide">
        {when}
      </span>
      <span className="text-text-primary">
        {fmtPenceShort(o.monthly_cashflow ?? 0)}/mo ·{" "}
        {fmtPercent(o.net_roce ?? o.cash_on_cash_roi ?? 0)} Net ROCE
      </span>
      <span
        className={[
          "font-mono text-[10px] tracking-[0.12em] uppercase",
          run.pass ? "text-pass-fg" : "text-fail-fg",
        ].join(" ")}
      >
        {run.pass ? "Pass" : "Fail"}
      </span>
    </li>
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
      <p className={`mt-1 font-serif text-3xl ${valueClass}`}>{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-text-tertiary text-xs">{label}</dt>
      <dd className="text-right font-mono text-xs">{value}</dd>
    </>
  );
}
