import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { savedFilters } from "@/lib/db/schema";
import { sanitiseFilter, type SavedFilter } from "./saved-filters";

export async function listSavedFilters(userId: string): Promise<SavedFilter[]> {
  const rows = await db
    .select({
      id: savedFilters.id,
      name: savedFilters.name,
      filterJson: savedFilters.filterJson,
    })
    .from(savedFilters)
    .where(
      and(eq(savedFilters.userId, userId), eq(savedFilters.isActive, true)),
    )
    .orderBy(desc(savedFilters.createdAt));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    filter: sanitiseFilter(r.filterJson),
  }));
}
