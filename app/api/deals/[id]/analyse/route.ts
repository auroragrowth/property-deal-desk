import { getUserIdOrNull } from "@/lib/auth/server";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { deals } from "@/lib/db/schema";
import { analyseProperty } from "@/features/deals/analyse";
import type {
  AssumptionProfile,
  CriteriaProfile,
} from "@/features/deals/engines/_interface";
import { logAudit } from "@/lib/audit";
import { track } from "@/lib/analytics/server";

// Re-runs the engine with optional inline overrides. Per brief §09, every
// run inserts a fresh deal_results row — never updates.

const isFiniteNumber = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

function pickAssumptionOverrides(
  raw: Record<string, unknown>,
): Partial<AssumptionProfile> {
  const o: Partial<AssumptionProfile> = {};
  if (isFiniteNumber(raw.deposit_pct)) o.deposit_pct = raw.deposit_pct;
  if (isFiniteNumber(raw.rate_pct)) o.rate_pct = raw.rate_pct;
  if (isFiniteNumber(raw.mgmt_pct)) o.mgmt_pct = raw.mgmt_pct;
  if (isFiniteNumber(raw.void_pct)) o.void_pct = raw.void_pct;
  if (isFiniteNumber(raw.refurb)) o.refurb = raw.refurb;
  if (isFiniteNumber(raw.legal_fees)) o.legal_fees = raw.legal_fees;
  if (isFiniteNumber(raw.rent_pcm)) o.rent_pcm = raw.rent_pcm;
  return o;
}

function pickCriteriaOverrides(
  raw: Record<string, unknown>,
): Partial<CriteriaProfile> {
  const o: Partial<CriteriaProfile> = {};
  if (isFiniteNumber(raw.min_cashflow)) o.min_cashflow = raw.min_cashflow;
  if (isFiniteNumber(raw.min_roi)) o.min_roi = raw.min_roi;
  if (isFiniteNumber(raw.max_cash_required))
    o.max_cash_required = raw.max_cash_required;
  return o;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserIdOrNull();
    if (!userId) {
      return NextResponse.json(
        { error: { code: "auth", message: "Unauthorized" } },
        { status: 401 },
      );
    }

    const { id } = await params;

    const deal = await db.query.deals.findFirst({
      where: and(eq(deals.id, id), eq(deals.userId, userId)),
    });
    if (!deal) {
      return NextResponse.json(
        { error: { code: "not_found", message: "Deal not found" } },
        { status: 404 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      assumptions?: unknown;
      criteria?: unknown;
    };

    const assumptionOverrides =
      body.assumptions && typeof body.assumptions === "object"
        ? pickAssumptionOverrides(body.assumptions as Record<string, unknown>)
        : undefined;
    const criteriaOverrides =
      body.criteria && typeof body.criteria === "object"
        ? pickCriteriaOverrides(body.criteria as Record<string, unknown>)
        : undefined;

    const { result } = await analyseProperty(userId, deal.propertyId, {
      strategy: deal.strategy ?? "btl",
      assumptionOverrides,
      criteriaOverrides,
    });

    await logAudit({
      actorUserId: userId,
      action: "create",
      entity: "deal_result",
      entityId: result.id,
      after: {
        dealId: deal.id,
        pass: result.pass,
        strategy: deal.strategy ?? "btl",
        rerun: true,
      },
    });
    await track(userId, "deal_analysed", {
      dealId: deal.id,
      pass: result.pass,
      strategy: deal.strategy ?? "btl",
      rerun: true,
    });

    return NextResponse.json({ resultId: result.id });
  } catch (err) {
    console.error("[deals/[id]/analyse POST]", err);
    return NextResponse.json(
      {
        error: {
          code: "server",
          message: (err as Error).message ?? "Server error",
        },
      },
      { status: 500 },
    );
  }
}
