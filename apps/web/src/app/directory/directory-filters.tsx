"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BLOOD_GROUPS } from "../profile/constants";

export type Lookup = { id: string; name: string };
export type Specialty = { id: string; profession_id: string; name: string };
export type City = {
  id: string;
  name: string;
  state: string | null;
  country: string;
};

const selectClass =
  "w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary";
const labelClass = "mb-1 block text-xs font-medium text-brand-text-muted";

export function DirectoryFilters({
  professions,
  specialties,
  cities,
  subCommunities,
  current,
}: {
  professions: Lookup[];
  specialties: Specialty[];
  cities: City[];
  subCommunities: Lookup[];
  current: {
    name: string;
    profession: string;
    specialty: string;
    city: string;
    sub_community: string;
    blood: string;
    matrimony: string;
    native: string;
  };
}) {
  const router = useRouter();
  const [name, setName] = useState(current.name);
  const [profession, setProfession] = useState(current.profession);
  const [specialty, setSpecialty] = useState(current.specialty);
  const [city, setCity] = useState(current.city);
  const [subCommunity, setSubCommunity] = useState(current.sub_community);
  const [blood, setBlood] = useState(current.blood);
  const [matrimony, setMatrimony] = useState(current.matrimony);
  const [native, setNative] = useState(current.native);

  const specialtiesForProfession = useMemo(
    () =>
      profession
        ? specialties.filter((s) => s.profession_id === profession)
        : [],
    [profession, specialties],
  );

  // The currently *applied* (in-URL) dropdown filters, as a query string. The
  // live name search composes its query on top of these so typing a name keeps
  // any profession/city/etc. already applied. Memoised on the primitive values
  // so it's a stable dependency for the debounce effect below.
  const appliedParams = useMemo(() => {
    const p = new URLSearchParams();
    if (current.profession) p.set("profession", current.profession);
    if (current.specialty) p.set("specialty", current.specialty);
    if (current.city) p.set("city", current.city);
    if (current.sub_community) p.set("sub_community", current.sub_community);
    if (current.blood) p.set("blood", current.blood);
    if (current.matrimony) p.set("matrimony", current.matrimony);
    if (current.native) p.set("native", current.native);
    return p.toString();
  }, [
    current.profession,
    current.specialty,
    current.city,
    current.sub_community,
    current.blood,
    current.matrimony,
    current.native,
  ]);

  // Live name search: debounce the URL update so results stream in as the user
  // types (J → Ja → Jay …) and snap back to the default order when the field is
  // cleared. `scroll: false` keeps the page from jumping on every keystroke.
  // Guards on `name === current.name` so it only fires when the typed value
  // actually differs from what's already in the URL (incl. after each push).
  useEffect(() => {
    const trimmed = name.trim();
    if (trimmed === current.name) return;
    const t = setTimeout(() => {
      const p = new URLSearchParams(appliedParams);
      if (trimmed) p.set("name", trimmed);
      const qs = p.toString();
      router.replace(qs ? `/directory?${qs}` : "/directory", { scroll: false });
    }, 300);
    return () => clearTimeout(t);
  }, [name, current.name, appliedParams, router]);

  const citiesByCountry = useMemo(() => {
    const m = new Map<string, City[]>();
    for (const c of cities) {
      const list = m.get(c.country) ?? [];
      list.push(c);
      m.set(c.country, list);
    }
    return m;
  }, [cities]);

  function apply() {
    const params = new URLSearchParams();
    if (name.trim()) params.set("name", name.trim());
    if (profession) params.set("profession", profession);
    if (specialty) params.set("specialty", specialty);
    if (city) params.set("city", city);
    if (subCommunity) params.set("sub_community", subCommunity);
    if (blood) params.set("blood", blood);
    if (matrimony) params.set("matrimony", matrimony);
    if (native.trim()) params.set("native", native.trim());
    const qs = params.toString();
    router.push(qs ? `/directory?${qs}` : "/directory");
  }

  function clear() {
    setName("");
    setProfession("");
    setSpecialty("");
    setCity("");
    setSubCommunity("");
    setBlood("");
    setMatrimony("");
    setNative("");
    router.push("/directory");
  }

  const hasFilters =
    name ||
    profession ||
    specialty ||
    city ||
    subCommunity ||
    blood ||
    matrimony ||
    native;

  return (
    <div className="rounded-2xl border border-brand-border bg-white p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-4">
          <label className={labelClass} htmlFor="f-name">
            Name <span className="font-normal normal-case">· updates as you type</span>
          </label>
          <input
            id="f-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Search by name or surname — e.g. Jay, Chhaya, or Jay Chhaya"
            className={selectClass}
            autoComplete="off"
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="f-profession">
            Profession
          </label>
          <select
            id="f-profession"
            value={profession}
            onChange={(e) => {
              setProfession(e.target.value);
              setSpecialty("");
            }}
            className={selectClass}
          >
            <option value="">Any</option>
            {professions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="f-specialty">
            Specialty
          </label>
          <select
            id="f-specialty"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className={selectClass}
            disabled={specialtiesForProfession.length === 0}
          >
            <option value="">Any</option>
            {specialtiesForProfession.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
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
            onChange={(e) => setCity(e.target.value)}
            className={selectClass}
          >
            <option value="">Any</option>
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

        <div>
          <label className={labelClass} htmlFor="f-sub">
            Sub-community
          </label>
          <select
            id="f-sub"
            value={subCommunity}
            onChange={(e) => setSubCommunity(e.target.value)}
            className={selectClass}
          >
            <option value="">Any</option>
            {subCommunities.map((s) => (
              <option key={s.id} value={s.id} lang="gu">
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            className="mb-1 block text-xs font-semibold text-brand-danger uppercase"
            htmlFor="f-blood"
          >
            Blood donor
          </label>
          <select
            id="f-blood"
            value={blood}
            onChange={(e) => setBlood(e.target.value)}
            className={selectClass}
          >
            <option value="">Any</option>
            {BLOOD_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            className="mb-1 block text-xs font-semibold text-brand-gold uppercase"
            htmlFor="f-matrimony"
          >
            Matrimony
          </label>
          <select
            id="f-matrimony"
            value={matrimony}
            onChange={(e) => setMatrimony(e.target.value)}
            className={selectClass}
          >
            <option value="">Any</option>
            <option value="open">Open to matrimony</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="f-native">
            Native place
          </label>
          <input
            id="f-native"
            type="text"
            value={native}
            onChange={(e) => setNative(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                apply();
              }
            }}
            placeholder="e.g. Junagadh"
            className={selectClass}
          />
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={apply}
          className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-primary-dark"
        >
          Apply filters
        </button>
        {hasFilters ? (
          <button
            onClick={clear}
            className="rounded-lg border border-brand-border px-4 py-2 text-sm text-brand-text transition hover:border-brand-primary hover:text-brand-primary"
          >
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}
