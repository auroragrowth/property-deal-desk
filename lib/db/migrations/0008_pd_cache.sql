-- PropertyData cache table. Stores raw API responses keyed by
-- (endpoint + params hash). 7-day TTL is the default; expired rows
-- are simply ignored on read.

CREATE TABLE IF NOT EXISTS "pd_cache" (
  "key" text PRIMARY KEY,
  "body" jsonb NOT NULL,
  "fetched_at" timestamp WITH TIME ZONE DEFAULT now(),
  "expires_at" timestamp WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS "pd_cache_expires_idx" ON "pd_cache" ("expires_at");
