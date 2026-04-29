"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";

const PROPERTY_TYPES = [
  { value: "flat", label: "Flat" },
  { value: "terrace", label: "Terrace" },
  { value: "semi", label: "Semi" },
  { value: "detached", label: "Detached" },
] as const;

const PRICE_BRACKETS_K = [
  50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350, 400, 450, 500,
  600, 700, 800, 900, 1000, 1250, 1500, 2000, 3000, 5000,
] as const;

const PRICE_OPTIONS = PRICE_BRACKETS_K.map((k) => ({
  value: String(k * 1000),
  label: k >= 1000 ? `£${k / 1000}m` : `£${k}k`,
}));

const BED_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

const inputClass =
  "border-border focus:border-border-focus text-text-primary placeholder:text-text-tertiary focus:ring-accent-soft h-11 w-full rounded-md border-[0.5px] bg-transparent px-3 text-sm focus:ring-[3px] focus:outline-none";

const selectClass = `${inputClass} appearance-none bg-bg-surface bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 12 12%22><path fill=%22%236b5e4d%22 d=%22M2 4l4 4 4-4z%22/></svg>')] bg-[length:12px_12px] bg-[right_12px_center] bg-no-repeat pr-8`;

const labelClass =
  "text-text-secondary mb-1.5 block text-xs font-medium tracking-wide uppercase";

export function DashboardFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [postcode, setPostcode] = useState(searchParams.get("postcode") ?? "");
  const [priceMin, setPriceMin] = useState(searchParams.get("priceMin") ?? "");
  const [priceMax, setPriceMax] = useState(searchParams.get("priceMax") ?? "");
  const [bedsMin, setBedsMin] = useState(searchParams.get("bedsMin") ?? "");
  const [bedsMax, setBedsMax] = useState(searchParams.get("bedsMax") ?? "");
  const [types, setTypes] = useState<string[]>(searchParams.getAll("type"));
  const [includeOffer, setIncludeOffer] = useState(
    searchParams.get("status") === "all",
  );

  function submit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (postcode.trim()) params.set("postcode", postcode.trim());
    if (priceMin) params.set("priceMin", priceMin);
    if (priceMax) params.set("priceMax", priceMax);
    if (bedsMin) params.set("bedsMin", bedsMin);
    if (bedsMax) params.set("bedsMax", bedsMax);
    types.forEach((t) => params.append("type", t));
    if (includeOffer) params.set("status", "all");
    const qs = params.toString();
    router.push(qs ? `/dashboard?${qs}` : "/dashboard");
  }

  function reset() {
    setPostcode("");
    setPriceMin("");
    setPriceMax("");
    setBedsMin("");
    setBedsMax("");
    setTypes([]);
    setIncludeOffer(false);
    router.push("/dashboard");
  }

  function currentFilter() {
    return {
      postcode: postcode.trim() || undefined,
      priceMin: priceMin || undefined,
      priceMax: priceMax || undefined,
      bedsMin: bedsMin || undefined,
      bedsMax: bedsMax || undefined,
      type: types.length > 0 ? types : undefined,
      status: includeOffer ? "all" : undefined,
    };
  }

  const [saving, setSaving] = useState(false);

  async function saveCurrent() {
    const name = window.prompt("Name this saved search:");
    if (!name?.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/saved-filters", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), filter: currentFilter() }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        window.alert(text || "Could not save");
        return;
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  function toggleType(value: string) {
    setTypes((t) =>
      t.includes(value) ? t.filter((x) => x !== value) : [...t, value],
    );
  }

  const isFiltered = Array.from(searchParams.keys()).length > 0;

  return (
    <form
      onSubmit={submit}
      className="bg-bg-surface border-border rounded-lg border-[0.5px] p-5"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="f-postcode" className={labelClass}>
            Area / Postcode
          </label>
          <input
            id="f-postcode"
            type="text"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            placeholder="e.g. PE1, IP11, or full postcode"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Price</label>
          <div className="flex items-center gap-2">
            <select
              aria-label="Minimum price"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className={selectClass}
            >
              <option value="">No min</option>
              {PRICE_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <span className="text-text-tertiary text-sm">–</span>
            <select
              aria-label="Maximum price"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className={selectClass}
            >
              <option value="">No max</option>
              {PRICE_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Bedrooms</label>
          <div className="flex items-center gap-2">
            <select
              aria-label="Minimum bedrooms"
              value={bedsMin}
              onChange={(e) => setBedsMin(e.target.value)}
              className={selectClass}
            >
              <option value="">No min</option>
              {BED_OPTIONS.map((n) => (
                <option key={n} value={String(n)}>
                  {n}+
                </option>
              ))}
            </select>
            <span className="text-text-tertiary text-sm">–</span>
            <select
              aria-label="Maximum bedrooms"
              value={bedsMax}
              onChange={(e) => setBedsMax(e.target.value)}
              className={selectClass}
            >
              <option value="">No max</option>
              {BED_OPTIONS.map((n) => (
                <option key={n} value={String(n)}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Type</label>
          <div className="flex flex-wrap gap-2">
            {PROPERTY_TYPES.map((t) => {
              const active = types.includes(t.value);
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => toggleType(t.value)}
                  aria-pressed={active}
                  className={[
                    "h-11 rounded-md border-[0.5px] px-4 text-xs font-medium",
                    active
                      ? "bg-bg-strong text-text-on-strong border-transparent"
                      : "border-border-strong text-text-primary bg-transparent",
                  ].join(" ")}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <label className="text-text-secondary flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeOffer}
            onChange={(e) => setIncludeOffer(e.target.checked)}
            className="accent-accent h-4 w-4"
          />
          Include Under Offer / Sold STC
        </label>
        <div className="flex flex-wrap gap-2">
          {isFiltered && (
            <button
              type="button"
              onClick={reset}
              className="text-text-secondary hover:text-text-primary h-11 text-sm font-medium underline-offset-2 hover:underline"
            >
              Reset
            </button>
          )}
          {isFiltered && (
            <button
              type="button"
              onClick={saveCurrent}
              disabled={saving}
              className="border-border-strong text-text-primary h-11 rounded-md border-[0.5px] bg-transparent px-4 text-sm font-medium disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save search"}
            </button>
          )}
          <button
            type="submit"
            className="bg-accent text-accent-on hover:bg-accent-hover active:bg-accent-pressed h-11 rounded-md px-5 text-sm font-medium"
          >
            Search
          </button>
        </div>
      </div>
    </form>
  );
}
