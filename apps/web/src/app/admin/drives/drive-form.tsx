"use client";

import { useActionState } from "react";
import { createDrive, type DriveState } from "./actions";

type City = { id: string; name: string };

const inputClass =
  "w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-base focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary";
const labelClass = "mb-1 block text-sm font-medium text-brand-text";

const KIND_OPTIONS = [
  { value: "blood", label: "Blood needed" },
  { value: "emergency", label: "Emergency" },
  { value: "help", label: "Help drive" },
  { value: "announcement", label: "Announcement" },
];
const BLOOD = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const initialState: DriveState = { ok: false };

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1 text-xs text-brand-danger" role="alert">
      {msg}
    </p>
  );
}

export function DriveForm({ cities }: { cities: City[] }) {
  const [state, action, pending] = useActionState(createDrive, initialState);
  const err = state.errors;

  return (
    <form action={action} className="space-y-5" noValidate>
      <p className="rounded-lg border border-brand-gold/40 bg-brand-gold/10 px-4 py-3 text-sm text-brand-text">
        Drives are <strong>public</strong> — visible to everyone, including
        non-members. Don&apos;t include anything you wouldn&apos;t want shown
        openly.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="kind">
            Type <span className="text-brand-danger">*</span>
          </label>
          <select id="kind" name="kind" className={inputClass} required defaultValue="">
            <option value="" disabled>
              Choose…
            </option>
            {KIND_OPTIONS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
          <FieldError msg={err?.kind} />
        </div>
        <div>
          <label className={labelClass} htmlFor="blood_group">
            Blood group{" "}
            <span className="font-normal text-brand-text-muted">
              (for blood drives)
            </span>
          </label>
          <select id="blood_group" name="blood_group" className={inputClass} defaultValue="">
            <option value="">—</option>
            {BLOOD.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <FieldError msg={err?.blood_group} />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="title">
          Title <span className="text-brand-danger">*</span>
        </label>
        <input id="title" name="title" type="text" maxLength={140} className={inputClass} required />
        <FieldError msg={err?.title} />
      </div>

      <div>
        <label className={labelClass} htmlFor="body">
          Details <span className="text-brand-danger">*</span>
        </label>
        <textarea id="body" name="body" rows={5} maxLength={2000} className={`${inputClass} resize-y`} required />
        <FieldError msg={err?.body} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="city_id">
            City{" "}
            <span className="font-normal text-brand-text-muted">(optional)</span>
          </label>
          <select id="city_id" name="city_id" className={inputClass} defaultValue="">
            <option value="">Anywhere</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <FieldError msg={err?.city_id} />
        </div>
        <div>
          <label className={labelClass} htmlFor="expires_at">
            Auto-hide after{" "}
            <span className="font-normal text-brand-text-muted">(optional)</span>
          </label>
          <input id="expires_at" name="expires_at" type="datetime-local" className={inputClass} />
          <FieldError msg={err?.expires_at} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="contact_name">
            Contact name{" "}
            <span className="font-normal text-brand-text-muted">(optional)</span>
          </label>
          <input id="contact_name" name="contact_name" type="text" maxLength={120} className={inputClass} />
          <FieldError msg={err?.contact_name} />
        </div>
        <div>
          <label className={labelClass} htmlFor="contact_info">
            Contact (phone / how to reach){" "}
            <span className="font-normal text-brand-text-muted">(optional, public)</span>
          </label>
          <input id="contact_info" name="contact_info" type="text" maxLength={200} className={inputClass} />
          <FieldError msg={err?.contact_info} />
        </div>
      </div>

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
        {pending ? "Publishing…" : "Publish drive"}
      </button>
    </form>
  );
}
