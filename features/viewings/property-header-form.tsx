"use client";

import { useCallback, useState } from "react";
import { updateViewingHeader } from "./actions";
import { useDebouncedSave } from "./use-debounced-save";

// Editable property header. Lets the user override anything the
// URL parser got wrong — most importantly the postcode, which can
// be picked up from the "nearby properties" section by mistake.
//
// Fields save independently on a debounce so the user can patch one
// without losing focus on another.

function StatusBadge({ status }: { status: "idle" | "saving" | "saved" }) {
  if (status === "saving")
    return <span className="text-text-tertiary text-[10px]">Saving…</span>;
  if (status === "saved")
    return <span className="text-pass-fg text-[10px]">Saved ✓</span>;
  return null;
}

export function PropertyHeaderForm({
  viewingId,
  initialAddress,
  initialPostcode,
  initialPricePence,
}: {
  viewingId: string;
  initialAddress: string | null;
  initialPostcode: string | null;
  initialPricePence: number | null;
}) {
  const [address, setAddress] = useState(initialAddress ?? "");
  const [postcode, setPostcode] = useState(initialPostcode ?? "");
  const [pricePounds, setPricePounds] = useState(
    initialPricePence != null
      ? String(Math.round(initialPricePence / 100))
      : "",
  );

  const saveAddress = useCallback(
    async (value: string) => {
      await updateViewingHeader(viewingId, {
        propertyAddress: value || null,
      });
    },
    [viewingId],
  );
  const savePostcode = useCallback(
    async (value: string) => {
      await updateViewingHeader(viewingId, {
        propertyPostcode: value || null,
      });
    },
    [viewingId],
  );
  const savePrice = useCallback(
    async (value: string) => {
      const n = parseInt(value.replace(/[^0-9]/g, ""), 10);
      await updateViewingHeader(viewingId, {
        propertyPricePence: Number.isFinite(n) ? n * 100 : null,
      });
    },
    [viewingId],
  );

  const addressStatus = useDebouncedSave(
    address,
    initialAddress ?? "",
    saveAddress,
  );
  const postcodeStatus = useDebouncedSave(
    postcode,
    initialPostcode ?? "",
    savePostcode,
  );
  const priceStatus = useDebouncedSave(
    pricePounds,
    initialPricePence != null
      ? String(Math.round(initialPricePence / 100))
      : "",
    savePrice,
  );

  return (
    <section
      aria-labelledby="viewing-property"
      className="border-border bg-bg-surface space-y-3 rounded-lg border-[0.5px] p-4"
    >
      <header className="flex items-baseline justify-between gap-2">
        <h2
          id="viewing-property"
          className="text-text-primary font-serif text-lg"
        >
          Property details
        </h2>
        <p className="text-text-tertiary text-[11px]">
          Fix anything the parser got wrong — postcode in particular.
        </p>
      </header>

      <label className="block">
        <span className="text-text-secondary mb-1 flex items-center justify-between text-xs">
          <span>Address</span>
          <StatusBadge status={addressStatus} />
        </span>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. 12 Brookfield Road, Ipswich"
          className="border-border bg-bg-page focus:ring-accent-soft h-11 w-full rounded-md border-[0.5px] px-3 text-base focus:ring-[3px] focus:outline-none"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-text-secondary mb-1 flex items-center justify-between text-xs">
            <span>Postcode</span>
            <StatusBadge status={postcodeStatus} />
          </span>
          <input
            value={postcode}
            onChange={(e) =>
              setPostcode(e.target.value.toUpperCase().slice(0, 8))
            }
            placeholder="IP4 1AB"
            inputMode="text"
            autoCapitalize="characters"
            spellCheck={false}
            className="border-border bg-bg-page focus:ring-accent-soft h-11 w-full rounded-md border-[0.5px] px-3 text-base uppercase focus:ring-[3px] focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-text-secondary mb-1 flex items-center justify-between text-xs">
            <span>Asking £</span>
            <StatusBadge status={priceStatus} />
          </span>
          <input
            value={pricePounds}
            onChange={(e) =>
              setPricePounds(e.target.value.replace(/[^0-9]/g, ""))
            }
            placeholder="165000"
            inputMode="numeric"
            className="border-border bg-bg-page focus:ring-accent-soft h-11 w-full rounded-md border-[0.5px] px-3 text-base focus:ring-[3px] focus:outline-none"
          />
        </label>
      </div>
    </section>
  );
}
