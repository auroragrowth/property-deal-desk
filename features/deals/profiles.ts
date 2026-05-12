import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { assumptionProfiles, criteriaProfiles } from "@/lib/db/schema";
import type {
  AssumptionProfile,
  CriteriaProfile,
} from "./engines/_interface";

// Drizzle returns numeric() columns as strings — convert at the boundary.
const num = (v: string | number | null | undefined, fallback: number) =>
  v === null || v === undefined ? fallback : Number(v);

export async function getOrCreateAssumptionProfile(userId: string) {
  const existing = await db.query.assumptionProfiles.findFirst({
    where: eq(assumptionProfiles.userId, userId),
  });
  if (existing) return existing;
  const [created] = await db
    .insert(assumptionProfiles)
    .values({ userId })
    .returning();
  return created;
}

export async function getOrCreateCriteriaProfile(userId: string) {
  const existing = await db.query.criteriaProfiles.findFirst({
    where: eq(criteriaProfiles.userId, userId),
  });
  if (existing) return existing;
  const [created] = await db
    .insert(criteriaProfiles)
    .values({ userId })
    .returning();
  return created;
}

export function toAssumption(
  row: typeof assumptionProfiles.$inferSelect,
): AssumptionProfile {
  return {
    deposit_pct: num(row.depositPct, 0.25),
    rate_pct: num(row.ratePct, 0.05),
    mgmt_pct: num(row.mgmtPct, 0.1),
    void_pct: num(row.voidPct, 0.05),
    maintenance_pct: num(row.maintenancePct, 0.05),
    insurance_pcm: row.insurancePcm ?? 2000,
    refurb: row.refurb ?? 0,
    legal_fees: row.legalFees ?? 200000,
    auction_fee: row.auctionFee ?? 0,
    sourcing_fee: row.sourcingFee ?? 0,
    gdv_pence: row.gdvPence ?? undefined,
    rent_pcm: row.rentPcmOverride ?? undefined,
  };
}

export function toCriteria(
  row: typeof criteriaProfiles.$inferSelect,
): CriteriaProfile {
  return {
    min_cashflow: row.minCashflow ?? 20000,
    min_roi: num(row.minRoi, 0.08),
    max_cash_required: row.maxCashRequired ?? 5000000,
  };
}
