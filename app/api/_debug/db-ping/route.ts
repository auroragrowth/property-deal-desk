import { NextResponse } from "next/server";
import postgres from "postgres";

// TEMPORARY DEBUG ROUTE — delete after diagnosing the production DB issue.
// Tries SELECT 1 against DATABASE_URL and returns the raw error.
// Does NOT leak the connection string or password.

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.DATABASE_URL ?? "";

  // Sanity-check the URL shape without leaking the password.
  let host = "";
  let user = "";
  let port = "";
  let dbname = "";
  const urlLength = url.length;
  try {
    const u = new URL(url);
    host = u.hostname;
    user = u.username;
    port = u.port;
    dbname = u.pathname.replace(/^\//, "");
  } catch {
    // ignore
  }

  // Trim check — leading/trailing whitespace breaks pg auth silently.
  const trimmedDifferent = url.trim() !== url;

  let ok = false;
  let errorMessage: string | null = null;
  let errorCode: string | null = null;
  let errorName: string | null = null;

  if (url) {
    let client: ReturnType<typeof postgres> | null = null;
    try {
      client = postgres(url, { prepare: false, ssl: "require", max: 1 });
      const rows = await client`SELECT 1 AS ping`;
      ok = rows[0]?.ping === 1;
    } catch (err) {
      const e = err as Error & { code?: string };
      errorMessage = e.message ?? String(err);
      errorCode = e.code ?? null;
      errorName = e.name ?? null;
    } finally {
      if (client) {
        await client.end({ timeout: 1 }).catch(() => {});
      }
    }
  } else {
    errorMessage = "DATABASE_URL is empty";
  }

  return NextResponse.json({
    ok,
    urlLength,
    trimmedDifferent,
    host,
    user,
    port,
    dbname,
    errorName,
    errorCode,
    errorMessage,
  });
}
