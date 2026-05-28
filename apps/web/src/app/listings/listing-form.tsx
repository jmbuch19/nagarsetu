"use client";

import { useActionState, useMemo, useState } from "react";
import { createListing, type ListingFormState } from "./actions";

export type Category = {
  id: string;
  name: string;
  is_paid: boolean;
  verification: string;
};
export type City = {
  id: string;
  name: string;
  state: string | null;
  country: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  business: "Business",
  room: "Room",
  vehicle: "Vehicle",
  pg: "PG / Hostel",
  goods: "Goods for sale",
  tour: "Tour",
  service: "Service",
  expert: "Expert session",
  education: "Education (tutoring / course)",
};

const inputClass =
  "w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-base focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary";
const labelClass = "mb-1 block text-sm font-medium text-brand-text";

const initialState: ListingFormState = { ok: false };

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1 text-xs text-brand-danger" role="alert">
      {msg}
    </p>
  );
}

export function ListingForm({
  categories,
  cities,
}: {
  categories: Category[];
  cities: City[];
}) {
  const [state, formAction, pending] = useActionState(
    createListing,
    initialState,
  );
  const [categoryId, setCategoryId] = useState("");
  const err = state.errors;

  const selected = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId],
  );
  const isBusinessLike =
    selected?.name === "business" || selected?.name === "service";

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
      {/* Offer-side persuasion (the four levers). */}
      <div className="rounded-xl border border-brand-gold/40 bg-brand-surface/30 p-4 text-sm text-brand-text">
        <p className="font-medium">Why offer to the circle?</p>
        <p className="mt-1 leading-relaxed text-brand-text-muted">
          <strong>Earning</strong> — your idle room, vehicle or skill earns
          instead of sitting idle. <strong>Security</strong> — you deal with a
          verified fellow Nagar, not a stranger. <strong>Safety</strong> —
          reviews and community accountability. <strong>સેવા</strong> — you
          help a fellow Nagar who needs exactly what you have.
        </p>
      </div>

      <div>
        <label className={labelClass} htmlFor="category_id">
          What are you listing? <span className="text-brand-danger">*</span>
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
            Choose a category…
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {CATEGORY_LABELS[c.name] ?? c.name}
            </option>
          ))}
        </select>
        {selected ? (
          <p className="mt-1 text-xs text-brand-text-muted">
            {selected.is_paid
              ? "Carries the listing fee on publish (paid publishing coming soon)."
              : "Free to publish."}
            {selected.verification === "id_verified"
              ? " Requires ID verification to publish."
              : selected.verification === "admin"
                ? " Reviewed by an admin before going live."
                : ""}
          </p>
        ) : null}
        <FieldError msg={err?.category_id} />
      </div>

      <div>
        <label className={labelClass} htmlFor="title">
          Title <span className="text-brand-danger">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          maxLength={120}
          className={inputClass}
          placeholder="e.g. Sunny 1BHK near Race Course, Rajkot"
          required
        />
        <FieldError msg={err?.title} />
      </div>

      <div>
        <label className={labelClass} htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={2000}
          className={`${inputClass} resize-y`}
          placeholder="Describe what you're offering."
        />
        <FieldError msg={err?.description} />
      </div>

      <div>
        <label className={labelClass} htmlFor="price_text">
          Price / terms
        </label>
        <input
          id="price_text"
          name="price_text"
          type="text"
          maxLength={200}
          className={inputClass}
          placeholder="e.g. ₹12,000 / month · negotiable"
        />
        <p className="mt-1 text-xs text-brand-text-muted">
          Free text — money changes hands directly between you and the other
          member, offline.
        </p>
        <FieldError msg={err?.price_text} />
      </div>

      {/* Location */}
      <fieldset className="space-y-4 border-t border-brand-border pt-4">
        <legend className="text-sm font-semibold text-brand-text">
          Where
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="location_city_id">
              City
            </label>
            <select
              id="location_city_id"
              name="location_city_id"
              className={inputClass}
              defaultValue=""
            >
              <option value="">Select…</option>
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
            <FieldError msg={err?.location_city_id} />
          </div>
          <div>
            <label className={labelClass} htmlFor="pincode">
              PIN / postal code
            </label>
            <input
              id="pincode"
              name="pincode"
              type="text"
              maxLength={12}
              className={inputClass}
            />
            <FieldError msg={err?.pincode} />
          </div>
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
            placeholder="e.g. University Road"
          />
          {!isBusinessLike && selected ? (
            <p className="mt-1 text-xs text-brand-text-muted">
              The exact address is shared with the other member only when you
              connect — never published.
            </p>
          ) : null}
          <FieldError msg={err?.area_text} />
        </div>

        {isBusinessLike ? (
          <>
            <div>
              <label className={labelClass} htmlFor="address">
                Full address
              </label>
              <input
                id="address"
                name="address"
                type="text"
                maxLength={200}
                className={inputClass}
              />
              <FieldError msg={err?.address} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="hours">
                  Hours
                </label>
                <input
                  id="hours"
                  name="hours"
                  type="text"
                  maxLength={200}
                  className={inputClass}
                  placeholder="Mon–Sat 10–7"
                />
                <FieldError msg={err?.hours} />
              </div>
              <div>
                <label className={labelClass} htmlFor="service_area">
                  Service area
                </label>
                <input
                  id="service_area"
                  name="service_area"
                  type="text"
                  maxLength={200}
                  className={inputClass}
                  placeholder="Covers Rajkot + Jamnagar"
                />
                <FieldError msg={err?.service_area} />
              </div>
            </div>
          </>
        ) : null}
      </fieldset>

      {/* Contact */}
      <fieldset className="space-y-4 border-t border-brand-border pt-4">
        <legend className="text-sm font-semibold text-brand-text">
          Contact{" "}
          <span className="font-normal text-brand-text-muted">(optional)</span>
        </legend>
        <p className="-mt-2 text-xs text-brand-text-muted">
          Leave blank to use your profile number. Shown to a member only when
          they connect.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="contact_whatsapp">
              WhatsApp
            </label>
            <input
              id="contact_whatsapp"
              name="contact_whatsapp"
              type="tel"
              maxLength={200}
              className={inputClass}
            />
            <FieldError msg={err?.contact_whatsapp} />
          </div>
          <div>
            <label className={labelClass} htmlFor="contact_phone">
              Phone
            </label>
            <input
              id="contact_phone"
              name="contact_phone"
              type="tel"
              maxLength={200}
              className={inputClass}
            />
            <FieldError msg={err?.contact_phone} />
          </div>
        </div>
      </fieldset>

      <p className="rounded-lg border border-brand-border bg-brand-surface/30 px-3 py-2 text-xs text-brand-text-muted">
        Jay Hatkesh is a connector, not a party to your deal. The price and
        payment happen directly between members — we never take a commission.
      </p>

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
        {pending ? "Saving…" : "Save as draft"}
      </button>
      <p className="text-xs text-brand-text-muted">
        Saved as a draft — you publish it from “Your listings”.
      </p>
    </form>
  );
}
