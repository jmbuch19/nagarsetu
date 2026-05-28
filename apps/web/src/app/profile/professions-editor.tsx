"use client";

import { useMemo, useState, useTransition } from "react";
import {
  EXPERTISE_MAX,
  PROFESSION_STATUS_OPTIONS,
  YEARS_MAX,
  YEARS_MIN,
} from "./constants";
import {
  addProfession,
  deleteProfession,
  updateProfession,
  type ProfessionFormState,
} from "./profession-actions";

export type Profession = { id: string; name: string };
export type Specialty = { id: string; profession_id: string; name: string };
export type ProfessionRowData = {
  id: string;
  profession_id: string;
  specialty_id: string | null;
  years_experience: number | null;
  expertise_text: string | null;
  status: string;
  is_verified: boolean;
};

const NUDGE_BODY =
  "Add what you do — your profession and expertise. It's how a fellow Nagar finds the right person when they need one. Add at least one; you can edit or add more anytime.";
const EMPTY_HINT = "You haven't added anything yet — start below.";

const inputClass =
  "w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-base focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary";
const labelClass = "mb-1 block text-sm font-medium text-brand-text";
const btnPrimary =
  "rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-50";
const btnGhost =
  "rounded-lg border border-brand-border px-4 py-2 text-sm text-brand-text transition hover:border-brand-primary hover:text-brand-primary";
const btnGhostSmall =
  "rounded-md border border-brand-border px-3 py-1.5 text-xs text-brand-text transition hover:border-brand-primary hover:text-brand-primary";
const btnDangerSmall =
  "rounded-md border border-brand-border px-3 py-1.5 text-xs text-brand-danger transition hover:border-brand-danger disabled:opacity-50";

const STATUS_LABEL = new Map<string, string>(
  PROFESSION_STATUS_OPTIONS.map((o) => [o.value, o.label]),
);

const INITIAL_STATE: ProfessionFormState = { ok: false };

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1 text-xs text-brand-danger" role="alert">
      {msg}
    </p>
  );
}

function ResultBanner({ state }: { state: ProfessionFormState }) {
  if (!state.message) return null;
  return (
    <p
      className={`rounded-lg border px-3 py-2 text-sm ${
        state.ok
          ? "border-brand-success/40 bg-brand-success/10 text-brand-success"
          : "border-brand-danger/40 bg-brand-danger/10 text-brand-danger"
      }`}
      role="status"
    >
      {state.message}
    </p>
  );
}

// Shared cascading fields used by both the add form and each edit form.
// Profession + specialty are controlled so the specialty list "auto-appears"
// from the chosen profession (SPEC §7.04) and clears when profession changes.
function ProfessionFields({
  professions,
  specialtiesByProfession,
  defaults,
  errors,
}: {
  professions: Profession[];
  specialtiesByProfession: Map<string, Specialty[]>;
  defaults?: ProfessionRowData;
  errors?: ProfessionFormState["errors"];
}) {
  const [professionId, setProfessionId] = useState(
    defaults?.profession_id ?? "",
  );
  const [specialtyId, setSpecialtyId] = useState(defaults?.specialty_id ?? "");
  const specialties = professionId
    ? (specialtiesByProfession.get(professionId) ?? [])
    : [];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className={labelClass} htmlFor="profession_id">
          Profession <span className="text-brand-danger">*</span>
        </label>
        <select
          id="profession_id"
          name="profession_id"
          value={professionId}
          onChange={(e) => {
            setProfessionId(e.target.value);
            setSpecialtyId("");
          }}
          className={inputClass}
          required
        >
          <option value="" disabled>
            Select…
          </option>
          {professions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <FieldError msg={errors?.profession_id} />
      </div>

      {specialties.length > 0 ? (
        <div>
          <label className={labelClass} htmlFor="specialty_id">
            Specialty
          </label>
          <select
            id="specialty_id"
            name="specialty_id"
            value={specialtyId}
            onChange={(e) => setSpecialtyId(e.target.value)}
            className={inputClass}
          >
            <option value="">General / not listed</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <FieldError msg={errors?.specialty_id} />
        </div>
      ) : null}

      <div>
        <label className={labelClass} htmlFor="status">
          Status <span className="text-brand-danger">*</span>
        </label>
        <select
          id="status"
          name="status"
          defaultValue={defaults?.status ?? "current"}
          className={inputClass}
          required
        >
          {PROFESSION_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-brand-text-muted">
          Retired expertise still counts; studying marks an aspiring member.
        </p>
        <FieldError msg={errors?.status} />
      </div>

      <div>
        <label className={labelClass} htmlFor="years_experience">
          Years of experience
        </label>
        <input
          id="years_experience"
          name="years_experience"
          type="number"
          inputMode="numeric"
          min={YEARS_MIN}
          max={YEARS_MAX}
          defaultValue={defaults?.years_experience ?? ""}
          className={inputClass}
        />
        <FieldError msg={errors?.years_experience} />
      </div>

      <div className="sm:col-span-2">
        <label className={labelClass} htmlFor="expertise_text">
          What you actually do{" "}
          <span className="font-normal text-brand-text-muted">(optional)</span>
        </label>
        <textarea
          id="expertise_text"
          name="expertise_text"
          rows={2}
          maxLength={EXPERTISE_MAX}
          defaultValue={defaults?.expertise_text ?? ""}
          className={`${inputClass} resize-y`}
          placeholder="e.g. 30 years in turnkey power projects; happy to advise on EPC contracts."
        />
        <FieldError msg={errors?.expertise_text} />
      </div>
    </div>
  );
}

function AddProfession({
  professions,
  specialtiesByProfession,
}: {
  professions: Profession[];
  specialtiesByProfession: Map<string, Specialty[]>;
}) {
  const [state, setState] = useState<ProfessionFormState>(INITIAL_STATE);
  // Bumping the key on success remounts ProfessionFields → resets the form.
  const [formKey, setFormKey] = useState(0);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await addProfession(INITIAL_STATE, formData);
      setState(result);
      if (result.ok) setFormKey((k) => k + 1);
    });
  }

  return (
    <form
      key={formKey}
      action={submit}
      noValidate
      className="space-y-4 rounded-xl border border-dashed border-brand-border bg-brand-surface/30 p-4"
    >
      <p className="text-sm font-medium text-brand-text">Add a profession</p>
      <ProfessionFields
        professions={professions}
        specialtiesByProfession={specialtiesByProfession}
        errors={state.errors}
      />
      <ResultBanner state={state} />
      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? "Adding…" : "Add profession"}
      </button>
    </form>
  );
}

function ProfessionRow({
  row,
  professions,
  specialtiesByProfession,
  professionName,
  specialtyName,
}: {
  row: ProfessionRowData;
  professions: Profession[];
  specialtiesByProfession: Map<string, Specialty[]>;
  professionName: (id: string) => string;
  specialtyName: (id: string) => string;
}) {
  const [editing, setEditing] = useState(false);
  const [state, setState] = useState<ProfessionFormState>(INITIAL_STATE);
  const [pending, startTransition] = useTransition();

  function save(formData: FormData) {
    startTransition(async () => {
      const result = await updateProfession(INITIAL_STATE, formData);
      setState(result);
      if (result.ok) setEditing(false);
    });
  }

  function remove(formData: FormData) {
    if (!confirm("Remove this profession?")) return;
    startTransition(async () => {
      await deleteProfession(formData);
    });
  }

  if (editing) {
    return (
      <li className="rounded-xl border border-brand-border bg-white p-4">
        <form action={save} noValidate className="space-y-4">
          <input type="hidden" name="id" value={row.id} />
          <ProfessionFields
            professions={professions}
            specialtiesByProfession={specialtiesByProfession}
            defaults={row}
            errors={state.errors}
          />
          <ResultBanner state={state} />
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className={btnPrimary}>
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className={btnGhost}
            >
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-start justify-between gap-4 rounded-xl border border-brand-border bg-white p-4">
      <div className="min-w-0">
        <p className="font-medium text-brand-text">
          {professionName(row.profession_id)}
          {row.specialty_id ? (
            <span className="text-brand-text-muted">
              {" · "}
              {specialtyName(row.specialty_id)}
            </span>
          ) : null}
          {row.is_verified ? (
            <span className="ml-2 rounded-full bg-brand-success/10 px-2 py-0.5 text-xs font-medium text-brand-success">
              Verified
            </span>
          ) : null}
        </p>
        <p className="mt-1 text-xs text-brand-text-muted">
          {STATUS_LABEL.get(row.status) ?? row.status}
          {row.years_experience != null
            ? ` · ${row.years_experience} yr${row.years_experience === 1 ? "" : "s"}`
            : ""}
        </p>
        {row.expertise_text ? (
          <p className="mt-2 text-sm text-brand-text">{row.expertise_text}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => {
            setState(INITIAL_STATE);
            setEditing(true);
          }}
          className={btnGhostSmall}
        >
          Edit
        </button>
        <form action={remove}>
          <input type="hidden" name="id" value={row.id} />
          <button type="submit" disabled={pending} className={btnDangerSmall}>
            Remove
          </button>
        </form>
      </div>
    </li>
  );
}

export function ProfessionsEditor({
  professions,
  specialties,
  rows,
}: {
  professions: Profession[];
  specialties: Specialty[];
  rows: ProfessionRowData[];
}) {
  const specialtiesByProfession = useMemo(() => {
    const m = new Map<string, Specialty[]>();
    for (const s of specialties) {
      const list = m.get(s.profession_id) ?? [];
      list.push(s);
      m.set(s.profession_id, list);
    }
    return m;
  }, [specialties]);

  const professionName = useMemo(() => {
    const m = new Map(professions.map((p) => [p.id, p.name]));
    return (id: string) => m.get(id) ?? "Unknown profession";
  }, [professions]);

  const specialtyName = useMemo(() => {
    const m = new Map(specialties.map((s) => [s.id, s.name]));
    return (id: string) => m.get(id) ?? "";
  }, [specialties]);

  return (
    <section>
      <header className="mb-4">
        <h2 className="text-lg font-medium text-brand-primary">
          What can you offer the circle?
        </h2>
        <p className="mt-1 text-sm text-brand-text-muted">{NUDGE_BODY}</p>
      </header>

      {rows.length > 0 ? (
        <ul className="mb-4 space-y-3">
          {rows.map((r) => (
            <ProfessionRow
              key={r.id}
              row={r}
              professions={professions}
              specialtiesByProfession={specialtiesByProfession}
              professionName={professionName}
              specialtyName={specialtyName}
            />
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-sm text-brand-text-muted">{EMPTY_HINT}</p>
      )}

      <AddProfession
        professions={professions}
        specialtiesByProfession={specialtiesByProfession}
      />
    </section>
  );
}
