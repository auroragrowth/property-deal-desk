import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  var __dealdesk_pg__: ReturnType<typeof postgres> | undefined;
}

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set");
}

const client = globalThis.__dealdesk_pg__ ?? postgres(url, { prepare: false });
if (process.env.NODE_ENV !== "production") {
  globalThis.__dealdesk_pg__ = client;
}

export const db = drizzle(client, { schema });
export type Db = typeof db;
