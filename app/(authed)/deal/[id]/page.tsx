import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getDealView } from "@/features/deals/queries";
import { fmtPenceShort, fmtPercent } from "@/lib/btl/calc";

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
  cash_required?: number;
  deposit?: number;
  stamp_duty?: number;
  monthly_cashflow?: number;
  monthly_mortgage?: number;
  monthly_rent?: number;
  cash_on_cash_roi?: number;
  gross_yield?: number;
  stress_2pct?: { rate: number; monthly_cashflow: number };
};

export default async function DealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const { id } = await params;

  const view = await getDealView(id, userId);
  if (!view) notFound();
  const { property, result } = view;

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
    <main className="bg-bg-page max-w-prose mx-auto p-8">
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

      {/* KPI grid */}
      {result && (
        <section className="mt-6 grid grid-cols-2 gap-3">
          <Kpi
            label="Cash required"
            value={fmtPenceShort(o.cash_required ?? 0)}
          />
          <Kpi
            label="Monthly cashflow"
            value={fmtPenceShort(o.monthly_cashflow ?? 0)}
            tone={
              (o.monthly_cashflow ?? 0) >= 0 ? "pass" : "fail"
            }
          />
          <Kpi
            label="Cash-on-cash ROI"
            value={fmtPercent(o.cash_on_cash_roi ?? 0)}
          />
          <Kpi label="Gross yield" value={fmtPercent(o.gross_yield ?? 0)} />
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
          <dl className="text-text-primary divide-border-strong/40 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <Row label="Deposit" value={fmtPenceShort(o.deposit ?? 0)} />
            <Row label="Stamp duty (BTL)" value={fmtPenceShort(o.stamp_duty ?? 0)} />
            <Row label="Monthly rent" value={`${fmtPenceShort(o.monthly_rent ?? 0)}/mo`} />
            <Row
              label="Monthly mortgage"
              value={`${fmtPenceShort(o.monthly_mortgage ?? 0)}/mo`}
            />
          </dl>
        </section>
      )}

      <p className="text-text-tertiary mt-8 text-xs">
        Indicative analysis only. Not regulated advice. Inline assumption
        editing ships in week 10 — change defaults via{" "}
        <Link href="/settings" className="underline underline-offset-2">
          Settings
        </Link>{" "}
        when that lands. Engine version{" "}
        <span className="font-mono">{result?.engineVersion ?? "—"}</span>.
      </p>
    </main>
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
