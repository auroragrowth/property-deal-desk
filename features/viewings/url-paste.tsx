"use client";

import { useState, useTransition } from "react";
import { updateViewingHeader } from "./actions";

type ParsedListing = {
  address: string;
  postcode: string;
  pricePence: number | null;
  bedrooms: number | null;
  propertyType: string | null;
  imageUrl: string | null;
  sourceUrl: string;
};

export function UrlPaste({
  viewingId,
  initialUrl,
}: {
  viewingId: string;
  initialUrl: string | null;
}) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedListing | null>(null);
  const [, startTransition] = useTransition();

  async function go(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/viewings/parse-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = (await res.json()) as
        | ParsedListing
        | { error: { message: string } };
      if (!res.ok || "error" in data) {
        const msg =
          ("error" in data && data.error?.message) || "Could not parse";
        throw new Error(msg);
      }
      setParsed(data);
      // Persist header fields to the viewing.
      startTransition(async () => {
        await updateViewingHeader(viewingId, {
          propertyUrl: data.sourceUrl,
          propertyAddress: data.address,
          propertyPostcode: data.postcode,
          propertyPricePence: data.pricePence,
        });
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-labelledby="viewing-url"
      className="border-border bg-bg-surface space-y-3 rounded-lg border-[0.5px] p-4"
    >
      <h2
        id="viewing-url"
        className="text-text-primary font-serif text-lg"
      >
        1. Paste the listing
      </h2>
      <form onSubmit={go} className="space-y-2">
        <input
          type="url"
          inputMode="url"
          autoComplete="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="rightmove.co.uk / zoopla.co.uk URL"
          className="border-border bg-bg-page focus:ring-accent-soft h-12 w-full rounded-md border-[0.5px] px-3 text-base focus:ring-[3px] focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !url.trim()}
          className="bg-bg-strong text-text-on-strong h-12 w-full rounded-md px-4 text-sm font-medium disabled:opacity-50"
        >
          {busy ? "Fetching…" : parsed ? "Re-parse" : "Pull listing details"}
        </button>
        {error && (
          <p role="alert" className="text-fail-fg text-sm">
            {error}
          </p>
        )}
      </form>

      {parsed && (
        <div className="border-border bg-bg-page space-y-2 rounded-md border-[0.5px] p-3">
          {parsed.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={parsed.imageUrl}
              alt={parsed.address}
              className="aspect-[4/3] w-full rounded object-cover"
              loading="lazy"
            />
          )}
          <p className="text-text-primary text-sm font-medium">
            {parsed.address}
          </p>
          <p className="text-text-tertiary font-mono text-xs tracking-wide">
            {parsed.postcode}
            {parsed.bedrooms ? ` · ${parsed.bedrooms} bed` : ""}
            {parsed.propertyType ? ` · ${parsed.propertyType}` : ""}
          </p>
          {parsed.pricePence && (
            <p className="text-text-primary font-serif text-2xl">
              £{(parsed.pricePence / 100).toLocaleString("en-GB")}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
