"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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
