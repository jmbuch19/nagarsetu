"use client";

import { useActionState } from "react";
import { GENDER_OPTIONS, BIO_MAX, NAME_MAX } from "./constants";
import { updateProfile, type ProfileFormState } from "./actions";

export type City = {
  id: string;
  name: string;
  state: string | null;
  country: string;
};

export type SubCommunity = { id: string; name: string };

export type ProfileValues = {
  full_name: string | null;
  surname: string | null;
  city_id: string | null;
  pincode: string | null;
  gender: string | null;
  date_of_birth: string | null;
  email: string | null;
  sub_community_id: string | null;
  bio: string | null;
  openly_contactable: boolean | null;
  recognised_surname?: boolean | null;
};

const initialState: ProfileFormState = { ok: false };

const inputClass =
  "w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-base focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary";
const labelClass = "mb-1 block text-sm font-medium text-brand-text";

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1 text-xs text-brand-danger" role="alert">
      {msg}
    </p>
  );
}

export function ProfileForm({
  phone,
  values,
  cities,
  subCommunities,
}: {
  phone: string;
  values: ProfileValues | null;
  cities: City[];
  subCommunities: SubCommunity[];
}) {
  const [state, formAction, pending] = useActionState(
    updateProfile,
    initialState,
  );

  const v = values;
  const err = state.errors;
  const todayStr = new Date().toISOString().slice(0, 10);

  // Group cities by country for <optgroup>. The query already orders by
  // country → state → name, so insertion order is correct.
  const citiesByCountry = new Map<string, City[]>();
  for (const c of cities) {
    const list = citiesByCountry.get(c.country) ?? [];
    list.push(c);
    citiesByCountry.set(c.country, list);
  }

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {/* Phone — verified at sign-in, not editable here. */}
      <div>
        <label className={labelClass} htmlFor="phone-display">
          WhatsApp number
        </label>
        <input
          id="phone-display"
          type="text"
          value={phone}
          readOnly
          disabled
          className={`${inputClass} cursor-not-allowed bg-brand-surface/40 text-brand-text-muted`}
        />
        <p className="mt-1 text-xs text-brand-text-muted">
          Verified at sign-in. Contact us to change your number.
        </p>
      </div>

      {/* Required ─────────────────────────────────────────────────────── */}
      <fieldset className="space-y-5 border-t border-brand-border pt-5">
        <legend className="text-sm font-semibold text-brand-text">
          About you <span className="font-normal text-brand-text-muted">(required)</span>
        </legend>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="full_name">
              Full name <span className="text-brand-danger">*</span>
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              maxLength={NAME_MAX}
              autoComplete="given-name"
              defaultValue={v?.full_name ?? ""}
              className={inputClass}
              required
            />
            <FieldError msg={err?.full_name} />
          </div>

          <div>
            <label className={labelClass} htmlFor="surname">
              Surname <span className="text-brand-danger">*</span>
            </label>
            <input
              id="surname"
              name="surname"
              type="text"
              maxLength={NAME_MAX}
              autoComplete="family-name"
              defaultValue={v?.surname ?? ""}
              className={inputClass}
              required
            />
            <FieldError msg={err?.surname} />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="gender">
              Gender <span className="text-brand-danger">*</span>
            </label>
            <select
              id="gender"
              name="gender"
              defaultValue={v?.gender ?? ""}
              className={inputClass}
              required
            >
              <option value="" disabled>
                Select…
              </option>
              {GENDER_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
            <FieldError msg={err?.gender} />
          </div>

          <div>
            <label className={labelClass} htmlFor="date_of_birth">
              Date of birth <span className="text-brand-danger">*</span>
            </label>
            <input
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              max={todayStr}
              min="1900-01-01"
              defaultValue={v?.date_of_birth ?? ""}
              className={inputClass}
              required
            />
            <FieldError msg={err?.date_of_birth} />
          </div>
        </div>
      </fieldset>

      {/* Location — city + PIN only, never a home address ──────────────── */}
      <fieldset className="space-y-5 border-t border-brand-border pt-5">
        <legend className="text-sm font-semibold text-brand-text">
          Where you are{" "}
          <span className="font-normal text-brand-text-muted">(required)</span>
        </legend>
        <p className="-mt-2 text-xs text-brand-text-muted">
          We only ask for your city and PIN / postal code — never your home
          address.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="city_id">
              City <span className="text-brand-danger">*</span>
            </label>
            <select
              id="city_id"
              name="city_id"
              defaultValue={v?.city_id ?? ""}
              className={inputClass}
              required
            >
              <option value="" disabled>
                Select your city…
              </option>
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
            <label className={labelClass} htmlFor="pincode">
              PIN / postal code <span className="text-brand-danger">*</span>
            </label>
            <input
              id="pincode"
              name="pincode"
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={12}
              defaultValue={v?.pincode ?? ""}
              className={inputClass}
              required
            />
            <FieldError msg={err?.pincode} />
          </div>
        </div>
      </fieldset>

      {/* Optional ─────────────────────────────────────────────────────── */}
      <fieldset className="space-y-5 border-t border-brand-border pt-5">
        <legend className="text-sm font-semibold text-brand-text">
          A little more{" "}
          <span className="font-normal text-brand-text-muted">(optional)</span>
        </legend>

        <div>
          <label className={labelClass} htmlFor="sub_community_id">
            Sub-community
          </label>
          <select
            id="sub_community_id"
            name="sub_community_id"
            defaultValue={v?.sub_community_id ?? ""}
            className={inputClass}
          >
            <option value="">Prefer not to say</option>
            {subCommunities.map((s) => (
              <option key={s.id} value={s.id} lang="gu">
                {s.name}
              </option>
            ))}
          </select>
          <FieldError msg={err?.sub_community_id} />
        </div>

        <div>
          <label className={labelClass} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={v?.email ?? ""}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-brand-text-muted">
            Optional — used only for receipts and as an OTP fallback, never for
            marketing.
          </p>
          <FieldError msg={err?.email} />
        </div>

        <div>
          <label className={labelClass} htmlFor="bio">
            Short bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            maxLength={BIO_MAX}
            defaultValue={v?.bio ?? ""}
            className={`${inputClass} resize-y`}
            placeholder="A line or two about you for fellow Nagars."
          />
          <FieldError msg={err?.bio} />
        </div>

        <label className="flex items-start gap-2 text-sm text-brand-text">
          <input
            type="checkbox"
            name="openly_contactable"
            defaultChecked={!!v?.openly_contactable}
            className="mt-0.5 h-4 w-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary"
          />
          <span>
            Let fellow members reach me directly on WhatsApp from the directory.
            (Off = members must send a connection request you approve first.)
          </span>
        </label>
      </fieldset>

      {/* Result banner ────────────────────────────────────────────────── */}
      {state.message ? (
        <p
          className={`rounded-lg border px-4 py-3 text-sm ${
            state.ok
              ? "border-brand-success/40 bg-brand-success/10 text-brand-success"
              : "border-brand-danger/40 bg-brand-danger/10 text-brand-danger"
          }`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-base font-medium text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
