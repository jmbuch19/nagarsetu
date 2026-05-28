"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export type Lookup = { id: string; name: string };
export type City = {
  id: string;
  name: string;
  state: string | null;
  country: string;
};

const selectClass =
  "w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary";
const labelClass = "mb-1 block text-xs font-medium text-brand-text-muted";

const CATEGORY_LABELS: Record<string, string> = {
  business: "Business",
  room: "Room",
  vehicle: "Vehicle",
  pg: "PG / Hostel",
  goods: "Goods",
  tour: "Tour",
  service: "Service",
  expert: "Expert session",
  education: "Education",
};

export function FeedFilters({
  categories,
  cities,
  current,
}: {
  categories: Lookup[];
  cities: City[];
  current: { category: string; city: string; type: string };
}) {
  const router = useRouter();
  const [category, setCategory] = useState(current.category);
  const [city, setCity] = useState(current.city);
  const type = current.type;

  const citiesByCountry = useMemo(() => {
    const m = new Map<string, City[]>();
    for (const c of cities) {
      const list = m.get(c.country) ?? [];
      list.push(c);
      m.set(c.country, list);
    }
    return m;
  }, [cities]);

  function apply(nextCategory: string, nextCity: string) {
    const params = new URLSearchParams();
    if (type && type !== "offers") params.set("type", type);
    if (nextCategory) params.set("category", nextCategory);
    if (nextCity) params.set("city", nextCity);
    const qs = params.toString();
    router.push(qs ? `/feed?${qs}` : "/feed");
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-brand-border bg-white p-4 shadow-sm sm:grid-cols-2">
      <div>
        <label className={labelClass} htmlFor="f-category">
          Category
        </label>
        <select
          id="f-category"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            apply(e.target.value, city);
          }}
          className={selectClass}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {CATEGORY_LABELS[c.name] ?? c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass} htmlFor="f-city">
          City
        </label>
        <select
          id="f-city"
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            apply(category, e.target.value);
          }}
          className={selectClass}
        >
          <option value="">All cities</option>
          {[...citiesByCountry.entries()].map(([country, list]) => (
            <optgroup key={country} label={country}>
              {list.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.state ? `${c.name}, ${c.state}` : c.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    </div>
  );
}
