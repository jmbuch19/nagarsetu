"use client";

import { useState, useTransition } from "react";
import {
  CAPABILITY_DESC_MAX,
  CAPABILITY_KIND_OPTIONS,
  DOMAIN_MAX,
} from "./constants";
import {
  addCapability,
  deleteCapability,
  updateCapability,
  type CapabilityFormState,
} from "./capability-actions";

export type CapabilityRowData = {
  id: string;
  kind: string;
  domain: string;
  description: string | null;
  is_offered: boolean;
};

// Locked encouragement copy — SPEC §7.04. Framed as an act of સેવા, placed
// BEFORE the opt-ins as the motivating moment. Honesty rule: promises the
// possibility of helping, never a guaranteed outcome.
const ENCOURAGEMENT =
  "This is where Jay Hatkesh comes alive. Somewhere a Nagar student is anxious about a choice you've mastered; a family is frightened by a medical report you could explain; someone needs a professional they can trust. By sharing what you know, you could be the answer to a fellow Nagar's need. It takes two minutes — and you control everything, editable anytime.";

const EMPTY_HINT =
  "You haven't offered anything yet. Even a small offer — 15 minutes of guidance — helps the circle.";

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

const KIND_LABEL = new Map<string, string>(
  CAPABILITY_KIND_OPTIONS.map((k) => [k.value, k.label]),
);

const INITIAL_STATE: CapabilityFormState = { ok: false };

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1 text-xs text-brand-danger" role="alert">
      {msg}
    </p>
  );
}

function ResultBanner({ state }: { state: CapabilityFormState }) {
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

function CapabilityFields({
  defaults,
  errors,
}: {
  defaults?: CapabilityRowData;
  errors?: CapabilityFormState["errors"];
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="kind">
            What you can offer <span className="text-brand-danger">*</span>
          </label>
          <select
            id="kind"
            name="kind"
            defaultValue={defaults?.kind ?? "expert_guidance"}
            className={inputClass}
            required
          >
            {CAPABILITY_KIND_OPTIONS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
          <FieldError msg={errors?.kind} />
        </div>

        <div>
          <label className={labelClass} htmlFor="domain">
            Field or area <span className="text-brand-danger">*</span>
          </label>
          <input
            id="domain"
            name="domain"
            type="text"
            maxLength={DOMAIN_MAX}
            defaultValue={defaults?.domain ?? ""}
            className={inputClass}
            placeholder="e.g. Cardiology, Career guidance, College admissions"
            required
          />
          <FieldError msg={errors?.domain} />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="description">
          A little more{" "}
          <span className="font-normal text-brand-text-muted">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          maxLength={CAPABILITY_DESC_MAX}
          defaultValue={defaults?.description ?? ""}
          className={`${inputClass} resize-y`}
          placeholder="e.g. Happy to give a second opinion on cardiac reports for fellow Nagars."
        />
        <FieldError msg={errors?.description} />
      </div>

      <label className="flex items-center gap-2 text-sm text-brand-text">
        <input
          type="checkbox"
          name="is_offered"
          defaultChecked={defaults ? defaults.is_offered : true}
          className="h-4 w-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary"
        />
        <span>Currently offering this (uncheck to pause without deleting)</span>
      </label>
    </div>
  );
}

function AddCapability() {
  const [state, setState] = useState<CapabilityFormState>(INITIAL_STATE);
  const [formKey, setFormKey] = useState(0);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await addCapability(INITIAL_STATE, formData);
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
      <p className="text-sm font-medium text-brand-text">Offer something</p>
      <CapabilityFields errors={state.errors} />
      <ResultBanner state={state} />
      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? "Adding…" : "Add offer"}
      </button>
    </form>
  );
}

function CapabilityRow({ row }: { row: CapabilityRowData }) {
  const [editing, setEditing] = useState(false);
  const [state, setState] = useState<CapabilityFormState>(INITIAL_STATE);
  const [pending, startTransition] = useTransition();

  function save(formData: FormData) {
    startTransition(async () => {
      const result = await updateCapability(INITIAL_STATE, formData);
      setState(result);
      if (result.ok) setEditing(false);
    });
  }

  function remove(formData: FormData) {
    if (!confirm("Remove this offer?")) return;
    startTransition(async () => {
      await deleteCapability(formData);
    });
  }

  if (editing) {
    return (
      <li className="rounded-xl border border-brand-border bg-white p-4">
        <form action={save} noValidate className="space-y-4">
          <input type="hidden" name="id" value={row.id} />
          <CapabilityFields defaults={row} errors={state.errors} />
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
          {row.domain}
          {!row.is_offered ? (
            <span className="ml-2 rounded-full bg-brand-surface px-2 py-0.5 text-xs font-medium text-brand-text-muted">
              Paused
            </span>
          ) : null}
        </p>
        <p className="mt-1 text-xs text-brand-text-muted">
          {KIND_LABEL.get(row.kind) ?? row.kind}
        </p>
        {row.description ? (
          <p className="mt-2 text-sm text-brand-text">{row.description}</p>
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

export function CapabilitiesEditor({ rows }: { rows: CapabilityRowData[] }) {
  return (
    <section>
      <header className="mb-4">
        <h2 className="text-lg font-medium text-brand-primary">
          Could you be the answer to a fellow Nagar&apos;s need?
        </h2>
        <p className="mt-2 rounded-lg border-l-4 border-brand-gold/60 bg-brand-surface/30 px-4 py-3 text-sm leading-relaxed text-brand-text">
          {ENCOURAGEMENT}
        </p>
      </header>

      {rows.length > 0 ? (
        <ul className="mb-4 space-y-3">
          {rows.map((r) => (
            <CapabilityRow key={r.id} row={r} />
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-sm text-brand-text-muted">{EMPTY_HINT}</p>
      )}

      <AddCapability />
    </section>
  );
}
