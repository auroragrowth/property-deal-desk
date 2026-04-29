import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  var __dealdesk_pg__: ReturnType<typeof postgres> | undefined;
}

// Placeholder URL so module load doesn't throw before env vars are wired
// (matters during `next build` page-data collection on Vercel and in CI).
// Real queries against this URL will fail with a clear connection error,
// which is what we want — better than a silent module-level crash.
const url =
  process.env.DATABASE_URL ||
  "postgresql://placeholder:placeholder@localhost:5432/placeholder_set_DATABASE_URL";

const client = globalThis.__dealdesk_pg__ ?? postgres(url, { prepare: false });
if (process.env.NODE_ENV !== "production") {
  globalThis.__dealdesk_pg__ = client;
}

export const db = drizzle(client, { schema });
export type Db = typeof db;
