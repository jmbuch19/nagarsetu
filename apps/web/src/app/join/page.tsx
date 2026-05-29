"use client";

// ⚠ TEMPORARY (test-phase) email onboarding — bridge until WhatsApp OTP is live.
// Collects email + REAL WhatsApp number + Terms acceptance + WhatsApp opt-in,
// passes phone + consent through signInWithOtp({ options: { data } }) so the
// auth bootstrap trigger (migration 0030) stores the real phone. Remove at
// WABA cutover (switch back to /sign-in phone OTP).

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { buildConsentPayload, identity } from "@nagarsetu/shared";
import { createClient } from "@/lib/supabase/client";

const COUNTRY_CODES = [
  { dial: "+91", label: "India (+91)" },
  { dial: "+1", label: "USA / Canada (+1)" },
  { dial: "+44", label: "UK (+44)" },
  { dial: "+971", label: "UAE (+971)" },
  { dial: "+254", label: "Kenya (+254)" },
  { dial: "+81", label: "Japan (+81)" },
] as const;

const inputClass =
  "w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-base focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary";

export default function JoinPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [dialCode, setDialCode] = useState("+91");
  const [national, setNational] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [optInWhatsapp, setOptInWhatsapp] = useState(true);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fullPhone = `${dialCode}${national.replace(/\D/g, "")}`;

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!termsAccepted) {
      setError("Please accept the Terms to continue.");
      return;
    }
    if (national.replace(/\D/g, "").length < 6) {
      setError("Please enter a valid WhatsApp number.");
      return;
    }
    setPending(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: true,
        // phone + consent persist to the auth bootstrap trigger (0030).
        data: { ...buildConsentPayload(optInWhatsapp), phone: fullPhone },
      },
    });
    setPending(false);
    if (otpError) setError(otpError.message);
    else setSent(true);
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-brand-border bg-white p-8 shadow-sm">
        <header className="mb-5 text-center">
          <p className="text-xs tracking-[0.3em] text-brand-text-muted uppercase">
            {identity.tagline.en}
          </p>
          <h1 className="mt-1 text-3xl font-light text-brand-primary">
            Join the community
          </h1>
          <p className="mt-1 text-lg font-light text-brand-primary-dark" lang="gu">
            {identity.name.gu}
          </p>
        </header>

        <p className="mb-5 rounded-lg border border-brand-gold/40 bg-brand-surface/40 px-3 py-2 text-xs text-brand-text-muted">
          We&apos;re finalising WhatsApp sign-in — for now, join with your email.
          We use your WhatsApp number so fellow Nagars can reach you.
        </p>

        {sent ? (
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-light text-brand-primary">
              Check your email
            </h2>
            <p className="text-sm text-brand-text-muted">
              We sent a sign-in link to{" "}
              <span className="font-medium text-brand-text">{email}</span>. Open
              it in this browser to continue.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-brand-text">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-medium text-brand-text">
                WhatsApp number
              </label>
              <div className="flex gap-2">
                <select
                  className="rounded-lg border border-brand-border bg-white px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  value={dialCode}
                  onChange={(e) => setDialCode(e.target.value)}
                  aria-label="Country code"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.dial} value={c.dial}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  className={`${inputClass} flex-1`}
                  placeholder="9876543210"
                  value={national}
                  onChange={(e) => setNational(e.target.value)}
                  required
                />
              </div>
              <p className="mt-1 text-xs text-brand-text-muted">
                Used for connecting with fellow Nagars. Never shown publicly —
                revealed only when you connect.
              </p>
            </div>

            <fieldset className="space-y-2 border-t border-brand-border pt-4">
              <legend className="sr-only">Consent</legend>
              <label className="flex items-start gap-2 text-sm text-brand-text">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  required
                />
                <span>
                  I accept the{" "}
                  <Link href="/terms" className="text-brand-primary underline">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-brand-primary underline">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
              <label className="flex items-start gap-2 text-sm text-brand-text">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary"
                  checked={optInWhatsapp}
                  onChange={(e) => setOptInWhatsapp(e.target.checked)}
                />
                <span>
                  Send me lead alerts + the community digest on WhatsApp once
                  it&apos;s live. (Off = in-app + email only.)
                </span>
              </label>
            </fieldset>

            {error ? (
              <p className="text-sm text-brand-danger" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={pending || !termsAccepted}
              className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-base font-medium text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Sending…" : "Send sign-in link"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
