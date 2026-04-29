// Pure helpers + types for saved filters. No DB imports — safe to use from
// client components.

export type StoredFilter = {
  postcode?: string;
  priceMin?: string;
  priceMax?: string;
  bedsMin?: string;
  bedsMax?: string;
  type?: string[];
  status?: "active" | "all";
};

export type SavedFilter = {
  id: string;
  name: string;
  filter: StoredFilter;
};

const ALLOWED_KEYS = new Set([
  "postcode",
  "priceMin",
  "priceMax",
  "bedsMin",
  "bedsMax",
  "type",
  "status",
]);

export function sanitiseFilter(raw: unknown): StoredFilter {
  if (!raw || typeof raw !== "object") return {};
  const out: StoredFilter = {};
  const r = raw as Record<string, unknown>;
  for (const key of Object.keys(r)) {
    if (!ALLOWED_KEYS.has(key)) continue;
    const v = r[key];
    if (key === "type") {
      if (Array.isArray(v)) {
        out.type = v.filter((x): x is string => typeof x === "string");
      } else if (typeof v === "string") {
        out.type = [v];
      }
      continue;
    }
    if (key === "status") {
      out.status = v === "all" ? "all" : "active";
      continue;
    }
    if (typeof v === "string") {
      (out as Record<string, unknown>)[key] = v;
    }
  }
  return out;
}

export function filterToQueryString(f: StoredFilter): string {
  const params = new URLSearchParams();
  if (f.postcode) params.set("postcode", f.postcode);
  if (f.priceMin) params.set("priceMin", f.priceMin);
  if (f.priceMax) params.set("priceMax", f.priceMax);
  if (f.bedsMin) params.set("bedsMin", f.bedsMin);
  if (f.bedsMax) params.set("bedsMax", f.bedsMax);
  if (f.type) f.type.forEach((t) => params.append("type", t));
  if (f.status === "all") params.set("status", "all");
  return params.toString();
}
