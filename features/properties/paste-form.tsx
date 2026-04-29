"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PasteForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/properties/paste", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        throw new Error(data?.error?.message ?? "Failed to fetch the listing");
      }
      setUrl("");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="bg-bg-surface border-border rounded-lg border-[0.5px] p-5"
    >
      <label
        htmlFor="paste-url"
        className="text-text-secondary mb-2 block text-xs font-medium tracking-wide uppercase"
      >
        Paste a property URL
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="paste-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.rightmove.co.uk/properties/..."
          required
          className="border-border focus:border-border-focus text-text-primary placeholder:text-text-tertiary focus:ring-accent-soft h-11 flex-1 rounded-md border-[0.5px] bg-transparent px-3 text-sm focus:ring-[3px] focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !url}
          className="bg-bg-strong text-text-on-strong h-11 rounded-md px-5 text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Fetching…" : "Add property"}
        </button>
      </div>
      {error && <p className="text-fail-fg mt-2 text-sm">{error}</p>}
      <p className="text-text-tertiary mt-2 text-xs">
        Rightmove, Zoopla, or Purplebricks listings.
      </p>
    </form>
  );
}
