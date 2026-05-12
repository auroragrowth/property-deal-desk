import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { pdCache } from "@/lib/db/schema";

// Generic cache wrapper for PropertyData API calls.
// Keys are short, opaque strings — "rents:IP41AA:3", "prices:IP41AA",
// etc. — built by the caller. 7-day default TTL.

export const PD_DEFAULT_TTL_SEC = 60 * 60 * 24 * 7; // 7 days

export async function fetchCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSec: number = PD_DEFAULT_TTL_SEC,
): Promise<T> {
  try {
    const row = await db.query.pdCache.findFirst({
      where: eq(pdCache.key, key),
    });
    if (row && row.expiresAt && row.expiresAt > new Date()) {
      return row.body as T;
    }
  } catch (err) {
    // Cache failure shouldn't break the live call — log + fall through.
    console.warn("[pd-cache] read failed", (err as Error).message);
  }

  const body = await fetcher();
  const expiresAt = new Date(Date.now() + ttlSec * 1000);
  try {
    await db
      .insert(pdCache)
      .values({
        key,
        body: body as Record<string, unknown>,
        fetchedAt: new Date(),
        expiresAt,
      })
      .onConflictDoUpdate({
        target: pdCache.key,
        set: {
          body: body as Record<string, unknown>,
          fetchedAt: new Date(),
          expiresAt,
        },
      });
  } catch (err) {
    console.warn("[pd-cache] write failed", (err as Error).message);
  }
  return body;
}
