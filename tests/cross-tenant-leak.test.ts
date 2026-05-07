import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Brief §13 acceptance: "Cross-tenant leak test: user A cannot read user B's
// watchlist, deals, or saved filters under any URL."
//
// We enforce this defensively at three layers:
//   1. RLS in lib/db/migrations/0001_rls.sql (defence in depth — Supabase JS).
//   2. Server-side Drizzle queries always filter by userId (this test).
//   3. API routes call only those userId-scoped queries (this test).
//
// This is a static guard: it greps the source for user-scoped query and
// route files and asserts each one references a userId-bound predicate.
// If anyone removes a userId filter, this test fails before merge.

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

// Extract every `.where(...)` call body, respecting nested parentheses so
// `.where(and(eq(a,b), eq(c,d)))` returns the full inner expression.
function whereBlocks(src: string): string[] {
  const out: string[] = [];
  const needle = ".where(";
  let i = 0;
  while (i < src.length) {
    const start = src.indexOf(needle, i);
    if (start === -1) break;
    let depth = 1;
    let j = start + needle.length;
    while (j < src.length && depth > 0) {
      const ch = src[j];
      if (ch === "(") depth++;
      else if (ch === ")") depth--;
      j++;
    }
    out.push(src.slice(start + needle.length, j - 1));
    i = j;
  }
  return out;
}

const USER_SCOPED_QUERY_FILES = [
  "features/watchlist/queries.ts",
  "features/properties/saved-filters-server.ts",
];

const USER_SCOPED_ROUTE_FILES = [
  "app/api/watchlist/route.ts",
  "app/api/watchlist/[id]/route.ts",
  "app/api/saved-filters/route.ts",
  "app/api/saved-filters/[id]/route.ts",
  "app/api/deals/route.ts",
  "app/api/deals/[id]/analyse/route.ts",
];

describe("cross-tenant leak guard", () => {
  it.each(USER_SCOPED_QUERY_FILES)(
    "%s filters by userId",
    (file) => {
      const src = read(file);
      // Every exported async function must mention userId, and every Drizzle
      // .where(...) must include a userId predicate. We assert the simpler
      // shape: file references userId AND every where() block contains it.
      expect(src).toMatch(/userId/);
      for (const block of whereBlocks(src)) {
        expect(block, `where() without userId in ${file}: ${block}`).toMatch(
          /userId/,
        );
      }
    },
  );

  it.each(USER_SCOPED_ROUTE_FILES)(
    "%s authenticates and scopes to the caller",
    (file) => {
      const src = read(file);
      // Must read the user via our Supabase auth helper before any work.
      expect(src).toMatch(/from "@\/lib\/auth\/server"/);
      expect(src).toMatch(/getUser(IdOrNull)?\(\)/);
      expect(src).toMatch(/userId/);
      // Must early-return on no userId (401 Unauthorized).
      expect(src).toMatch(/Unauthorized/);
      // Direct DB writes/deletes/updates inside the route must scope to the
      // userId — assert any .where(...) on user-scoped tables names userId.
      for (const block of whereBlocks(src)) {
        expect(block, `where() without userId in ${file}: ${block}`).toMatch(
          /userId/,
        );
      }
    },
  );

  it("watchlist POST never reads existing rows by propertyId alone", () => {
    // The watchlist route had a bug where the "already on list" lookup
    // filtered only by propertyId, leaking another tenant's row. Pin the
    // current shape so the regression cannot return.
    const src = read("app/api/watchlist/route.ts");
    // The conflict-recovery query must scope by userId AND propertyId.
    expect(src).toMatch(/eq\(watchlist\.userId, userId\)/);
    expect(src).toMatch(/eq\(watchlist\.propertyId, propertyId\)/);
  });
});
