"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buildConsentPayload, identity, salutation } from "@nagarsetu/shared";
import { createClient } from "@/lib/supabase/client";

// Country codes the community spans most. India default; UK / US / UAE / Kenya
// / Japan cover the diaspora hubs called out in MEMORY (Tokyo welcome, Utah
// PG, Nairobi assistance, etc). Adding a country = one line; not worth a
// dropdown library yet.
const COUNTRY_CODES = [
  { dial: "+91",  label: "India (+91)" },
  { dial: "+1",   label: "USA / Canada (+1)" },
  { dial: "+44",  label: "UK (+44)" },
  { dial: "+971", label: "UAE (+971)" },
  { dial: "+254", label: "Kenya (+254)" },
  { dial: "+81",  label: "Japan (+81)" },
] as const;

type Step = "phone" | "otp";

export default function SignInPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>("phone");
  const [dialCode, setDialCode] = useState<string>("+91");
  const [national, setNational] = useState("");
  const [otp, setOtp] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [optInWhatsapp, setOptInWhatsapp] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fullPhone = `${dialCode}${national.replace(/\D/g, "")}`;

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!termsAccepted) {
      setError("Please accept the Terms to continue.");
      return;
    }
    if (national.replace(/\D/g, "").length < 6) {
      setError("Please enter a valid phone number.");
      return;
    }

    setPending(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: fullPhone,
      options: {
        // Consent persists through to the auth trigger via raw_user_meta_data.
        // Migration 0014's handle_new_auth_user() whitelists these exact keys.
        data: buildConsentPayload(optInWhatsapp, false),
      },
    });
    setPending(false);

    if (otpError) {
      setError(otpError.message);
      return;
    }
    setStep("otp");
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (otp.replace(/\D/g, "").length < 4) {
      setError("Please enter the OTP code.");
      return;
    }

    setPending(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: fullPhone,
      token: otp.trim(),
      type: "sms",
    });
    setPending(false);

    if (verifyError) {
      setError(verifyError.message);
      return;
    }
    // replace() to a new route already does a fresh server render with the new
    // session cookie; a second refresh() just adds a round-trip and a flash.
    router.replace("/");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-brand-border bg-white p-8 shadow-sm">
        <header className="mb-6 text-center">
          <p className="text-xs tracking-[0.3em] text-brand-text-muted uppercase">
            {identity.tagline.en}
          </p>
          <h1 className="mt-1 text-3xl font-light text-brand-primary">
            {identity.name.en}
          </h1>
          <p className="mt-1 text-lg font-light text-brand-primary-dark" lang="gu">
            {identity.name.gu}
          </p>
        </header>

        {/* Test-phase escape hatch: WhatsApp OTP isn't live yet, so anyone who
            joined by email (or was redirected here after a session lapse) must
            re-enter via the email path. Remove at WABA cutover. */}
        <div className="mb-6 rounded-lg border border-brand-border bg-brand-surface/50 p-3 text-center text-sm text-brand-text">
          Joined with your email during our early test phase?{" "}
          <Link href="/join" className="font-medium text-brand-primary underline">
            Continue with email
          </Link>
          .
        </div>

        {step === "phone" ? (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <label
                htmlFor="phone"
                className="mb-1 block text-sm font-medium text-brand-text"
              >
                Mobile number
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
                  className="flex-1 rounded-lg border border-brand-border bg-white px-3 py-2 text-base focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  placeholder="9876543210"
                  value={national}
                  onChange={(e) => setNational(e.target.value)}
                  required
                />
              </div>
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
                  Send me lead alerts + the fortnightly community digest on
                  WhatsApp. (Off = in-app notifications only.)
                </span>
              </label>
            </fieldset>

            {error && (
              <p className="text-sm text-brand-danger" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending || !termsAccepted}
              className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-base font-medium text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Sending OTP…" : "Send OTP"}
            </button>

            <p className="text-center text-xs text-brand-text-muted">
              We send a one-time code over WhatsApp.
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <p className="text-sm text-brand-text-muted">
              Enter the code sent to{" "}
              <span className="font-medium text-brand-text">{fullPhone}</span>.
            </p>

            <div>
              <label
                htmlFor="otp"
                className="mb-1 block text-sm font-medium text-brand-text"
              >
                One-time code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-center text-2xl tracking-[0.5em] focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                placeholder="••••••"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm text-brand-danger" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-base font-medium text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Verifying…" : "Verify & sign in"}
            </button>

            <div className="flex items-center justify-between text-xs text-brand-text-muted">
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setError(null);
                }}
                className="text-brand-primary underline"
              >
                Change number
              </button>
              <span lang="gu">{salutation.gu}</span>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
