"use client";

import { useActionState } from "react";
import { submitContactQuery, type ContactState } from "./actions";

const inputClass =
  "w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-base focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary";
const labelClass = "mb-1 block text-sm font-medium text-brand-text";

const initialState: ContactState = { ok: false };

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1 text-xs text-brand-danger" role="alert">
      {msg}
    </p>
  );
}

export function ContactForm({
  captchaA,
  captchaB,
}: {
  captchaA: number;
  captchaB: number;
}) {
  const [state, action, pending] = useActionState(
    submitContactQuery,
    initialState,
  );

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-brand-success/40 bg-brand-success/10 p-6 text-center">
        <p className="text-base text-brand-text">{state.message}</p>
      </div>
    );
  }

  const err = state.errors;

  return (
    <form action={action} noValidate className="space-y-5">
      <input type="hidden" name="captcha_a" value={captchaA} />
      <input type="hidden" name="captcha_b" value={captchaB} />

      <div>
        <label className={labelClass} htmlFor="name">
          Name <span className="text-brand-danger">*</span>
        </label>
        <input id="name" name="name" type="text" maxLength={120} className={inputClass} required />
        <FieldError msg={err?.name} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="email">
            Email <span className="text-brand-danger">*</span>
          </label>
          <input id="email" name="email" type="email" autoComplete="email" className={inputClass} required />
          <FieldError msg={err?.email} />
        </div>
        <div>
          <label className={labelClass} htmlFor="phone">
            Phone <span className="font-normal text-brand-text-muted">(optional)</span>
          </label>
          <input id="phone" name="phone" type="tel" maxLength={40} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="message">
          Your message, suggestion or question{" "}
          <span className="text-brand-danger">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          maxLength={4000}
          className={`${inputClass} resize-y`}
          required
        />
        <FieldError msg={err?.message} />
      </div>

      <div>
        <label className={labelClass} htmlFor="captcha_answer">
          Quick check: what is {captchaA} + {captchaB}?{" "}
          <span className="text-brand-danger">*</span>
        </label>
        <input
          id="captcha_answer"
          name="captcha_answer"
          type="number"
          inputMode="numeric"
          className={`${inputClass} max-w-[8rem]`}
          required
        />
        <FieldError msg={err?.captcha} />
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
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
