"use client";

import { useActionState, useMemo, useState } from "react";
import { createRequest, type RequestFormState } from "./actions";

export type Category = { id: string; name: string };
export type City = {
  id: string;
  name: string;
  state: string | null;
  country: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  business: "A business",
  room: "A room to rent",
  vehicle: "A vehicle / ride",
  pg: "A PG / hostel",
  goods: "Goods to buy",
  tour: "A tour",
  service: "A service",
  expert: "Expert help",
  education: "A tutor / course",
};

const inputClass =
  "w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-base focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary";
const labelClass = "mb-1 block text-sm font-medium text-brand-text";

const initialState: RequestFormState = { ok: false };

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1 text-xs text-brand-danger" role="alert">
      {msg}
    </p>
  );
}

export function RequestForm({
  categories,
  cities,
}: {
  categories: Category[];
  cities: City[];
}) {
  const [state, formAction, pending] = useActionState(
    createRequest,
    initialState,
  );
  const [categoryId, setCategoryId] = useState("");
  const err = state.errors;

  const selected = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId],
  );
  const isPg = selected?.name === "pg";

  const citiesByCountry = useMemo(() => {
    const m = new Map<string, City[]>();
    for (const c of cities) {
      const list = m.get(c.country) ?? [];
      list.push(c);
      m.set(c.country, list);
    }
    return m;
  }, [cities]);

  return (
    <form action={formAction} noValidate className="space-y-6">
      <p className="rounded-xl border border-brand-gold/40 bg-brand-surface/30 p-4 text-sm text-brand-text-muted">
        Tell the community what you&apos;re looking for — it&apos;s free. Members
        who can help will reach out to you directly.
      </p>

      <div>
        <label className={labelClass} htmlFor="category_id">
          What are you looking for? <span className="text-brand-danger">*</span>
        </label>
        <select
          id="category_id"
          name="category_id"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={inputClass}
          required
        >
          <option value="" disabled>
            Choose…
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {CATEGORY_LABELS[c.name] ?? c.name}
            </option>
          ))}
        </select>
        <FieldError msg={err?.category_id} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="city_id">
            City
          </label>
          <select
            id="city_id"
            name="city_id"
            className={inputClass}
            defaultValue=""
          >
            <option value="">Any / select…</option>
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
          <FieldError msg={err?.city_id} />
        </div>
        <div>
          <label className={labelClass} htmlFor="area_text">
            Area / neighbourhood
          </label>
          <input
            id="area_text"
            name="area_text"
            type="text"
            maxLength={200}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass} htmlFor="budget_text">
            Budget
          </label>
          <input
            id="budget_text"
            name="budget_text"
            type="text"
            maxLength={200}
            className={inputClass}
            placeholder="e.g. up to ₹10k/mo"
          />
          <FieldError msg={err?.budget_text} />
        </div>
        <div>
          <label className={labelClass} htmlFor="needed_from">
            Needed from
          </label>
          <input
            id="needed_from"
            name="needed_from"
            type="date"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="needed_to">
            Until
          </label>
          <input
            id="needed_to"
            name="needed_to"
            type="date"
            className={inputClass}
          />
          <FieldError msg={err?.needed_to} />
        </div>
      </div>

      {isPg ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="gender_pref">
              Gender preference
            </label>
            <select
              id="gender_pref"
              name="gender_pref"
              className={inputClass}
              defaultValue=""
            >
              <option value="">Any</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="food_pref">
              Food preference
            </label>
            <select
              id="food_pref"
              name="food_pref"
              className={inputClass}
              defaultValue=""
            >
              <option value="">Any</option>
              <option value="veg">Vegetarian</option>
              <option value="jain">Jain</option>
            </select>
          </div>
        </div>
      ) : null}

      <div>
        <label className={labelClass} htmlFor="details">
          Details
        </label>
        <textarea
          id="details"
          name="details"
          rows={4}
          maxLength={2000}
          className={`${inputClass} resize-y`}
          placeholder="Anything that helps members understand what you need."
        />
        <FieldError msg={err?.details} />
      </div>

      {state.message && !state.ok ? (
        <p className="text-sm text-brand-danger" role="alert">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-base font-medium text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
      >
        {pending ? "Posting…" : "Post request"}
      </button>
    </form>
  );
}
