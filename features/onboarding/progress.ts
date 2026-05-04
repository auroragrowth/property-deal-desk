import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  auditLog,
  deals,
  savedFilters,
  watchlist,
} from "@/lib/db/schema";

export type OnboardingStep = {
  key: "paste" | "watchlist" | "analyse" | "filter";
  label: string;
  hint: string;
  href: string;
  done: boolean;
};

export type OnboardingProgress = {
  steps: OnboardingStep[];
  doneCount: number;
  total: number;
};

const countOf = (rows: { n: number }[]) => rows[0]?.n ?? 0;

export async function getOnboardingProgress(
  userId: string,
): Promise<OnboardingProgress> {
  const [pasted, watched, dealsCnt, filters] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(auditLog)
      .where(
        and(
          eq(auditLog.actorUserId, userId),
          eq(auditLog.entity, "property"),
          eq(auditLog.action, "create"),
        ),
      ),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(watchlist)
      .where(eq(watchlist.userId, userId)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(deals)
      .where(eq(deals.userId, userId)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(savedFilters)
      .where(eq(savedFilters.userId, userId)),
  ]);

  const pastedCount = countOf(pasted);
  const watchedCount = countOf(watched);
  const dealsCount = countOf(dealsCnt);
  const filterCount = countOf(filters);

  // Pre-audit-log users may have properties without a "property.create" row.
  // Treat any downstream activity as proof they've added a property.
  const pasteDone =
    pastedCount > 0 || watchedCount > 0 || dealsCount > 0;

  const steps: OnboardingStep[] = [
    {
      key: "paste",
      label: "Paste your first property",
      hint: "Drop in a Rightmove, Zoopla, or Purplebricks URL.",
      href: "/dashboard",
      done: pasteDone,
    },
    {
      key: "watchlist",
      label: "Save one to your watchlist",
      hint: "Tap the bookmark on any card to keep it nearby.",
      href: "/dashboard",
      done: watchedCount > 0,
    },
    {
      key: "analyse",
      label: "Run a deal analysis",
      hint: "Open a property and let the BTL engine do the numbers.",
      href: "/watchlist",
      done: dealsCount > 0,
    },
    {
      key: "filter",
      label: "Save a search filter",
      hint: "Name a postcode + price range so it's one click next time.",
      href: "/dashboard",
      done: filterCount > 0,
    },
  ];

  return {
    steps,
    doneCount: steps.filter((s) => s.done).length,
    total: steps.length,
  };
}
