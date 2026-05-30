"use client";

// ⚠ TEMPORARY (test-phase) email onboarding — bridge until WhatsApp OTP is live.
// 2-step flow: enter email + phone + consent → Supabase emails a 6-digit code →
// type the code in the SAME tab → signed in. The code path deliberately
// sidesteps the in-app-browser problem (Gmail/WhatsApp webviews drop cookies
// when the user later opens their real browser). The magic-link in the email
// still works for users who tap it — /auth/callback handles that path.
//
// Welcome email + the auth bootstrap (phone + consent) work identically on
// both paths. Remove at WABA cutover (switch back to /sign-in phone OTP).

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buildConsentPayload, identity } from "@nagarsetu/shared";
import { createClient } from "@/lib/supabase/client";
import { isDisposableEmail } from "@/lib/email/disposable";
import { welcomeAfterSignIn } from "./actions";

// Diaspora-aware list — India first, then alphabetical by country name. The
// "Other" sentinel lets a member type their own dial code so we never reject
// a Nagar from an uncovered country. (Surname-style: be permissive, not
// restrictive — Hard Constraint #5 ethos.)
const COUNTRY_CODES = [
  { dial: "+91", label: "India (+91)" },
  { dial: "+61", label: "Australia (+61)" },
  { dial: "+973", label: "Bahrain (+973)" },
  { dial: "+880", label: "Bangladesh (+880)" },
  { dial: "+33", label: "France (+33)" },
  { dial: "+49", label: "Germany (+49)" },
  { dial: "+852", label: "Hong Kong (+852)" },
  { dial: "+81", label: "Japan (+81)" },
  { dial: "+254", label: "Kenya (+254)" },
  { dial: "+965", label: "Kuwait (+965)" },
  { dial: "+60", label: "Malaysia (+60)" },
  { dial: "+977", label: "Nepal (+977)" },
  { dial: "+31", label: "Netherlands (+31)" },
  { dial: "+64", label: "New Zealand (+64)" },
  { dial: "+968", label: "Oman (+968)" },
  { dial: "+974", label: "Qatar (+974)" },
  { dial: "+966", label: "Saudi Arabia (+966)" },
  { dial: "+65", label: "Singapore (+65)" },
  { dial: "+27", label: "South Africa (+27)" },
  { dial: "+94", label: "Sri Lanka (+94)" },
  { dial: "+41", label: "Switzerland (+41)" },
  { dial: "+255", label: "Tanzania (+255)" },
  { dial: "+66", label: "Thailand (+66)" },
  { dial: "+971", label: "UAE (+971)" },
  { dial: "+44", label: "UK (+44)" },
  { dial: "+1", label: "USA / Canada (+1)" },
] as const;

const OTHER_DIAL = "__other__";

const inputClass =
  "w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-base focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary";

type Step = "email" | "code";

export default function JoinPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [dialCode, setDialCode] = useState<string>("+91");
  const [customDial, setCustomDial] = useState("");
  const [national, setNational] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [optInWhatsapp, setOptInWhatsapp] = useState(true);
  const [optInEmail, setOptInEmail] = useState(true);
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveDial =
    dialCode === OTHER_DIAL ? customDial.trim() : dialCode;
  const fullPhone = `${effectiveDial}${national.replace(/\D/g, "")}`;

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!termsAccepted) {
      setError("Please accept the Terms to continue.");
      return;
    }
    if (dialCode === OTHER_DIAL && !/^\+\d{1,4}$/.test(customDial.trim())) {
      setError("Please enter your country code starting with + (e.g. +65).");
      return;
    }
    if (isDisposableEmail(email.trim())) {
      setError(
        "Please use a regular email address — temporary / disposable inboxes aren't accepted.",
      );
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
        // emailRedirectTo kept so the magic link (in the same email) still
        // works for users who tap it. The code path is the recommended one.
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: true,
        // phone + consent persist to the auth bootstrap trigger (0030).
        data: {
          ...buildConsentPayload(optInWhatsapp, optInEmail),
          phone: fullPhone,
        },
      },
    });
    setPending(false);
    if (otpError) {
      setError(otpError.message);
      return;
    }
    setStep("code");
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (code.replace(/\D/g, "").length < 4) {
      setError("Please enter the code from your email.");
      return;
    }
    setPending(true);
    const { error: vErr } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    if (vErr) {
      setPending(false);
      setError(vErr.message);
      return;
    }
    // Fire-and-forget welcome — don't make the user wait. Awaiting this added
    // ~5s of "Verifying…" stall because welcomeIfNeeded does 2 DB roundtrips
    // + a Resend send. The action runs in the background; Resend is typically
    // sub-second so the email goes out before the navigation cancels it.
    void welcomeAfterSignIn().catch(() => {});
    router.replace("/profile");
    router.refresh();
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

        {step === "email" ? (
          <>
            <p className="mb-5 rounded-lg border border-brand-gold/40 bg-brand-surface/40 px-3 py-2 text-xs text-brand-text-muted">
              We&apos;re finalising WhatsApp sign-in — for now, join with your
              email. We use your WhatsApp number so fellow Nagars can reach you.
            </p>

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
                    <option value={OTHER_DIAL}>Other — type below</option>
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
                {dialCode === OTHER_DIAL ? (
                  <input
                    type="text"
                    inputMode="tel"
                    aria-label="Custom country code"
                    placeholder="e.g. +65"
                    value={customDial}
                    onChange={(e) => setCustomDial(e.target.value)}
                    className={`${inputClass} mt-2 max-w-[10rem]`}
                  />
                ) : null}
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
                <label className="flex items-start gap-2 text-sm text-brand-text">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary"
                    checked={optInEmail}
                    onChange={(e) => setOptInEmail(e.target.checked)}
                  />
                  <span>
                    Email me important community updates — blood / emergency
                    drives, announcements. (One-tap unsubscribe in every email.)
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
                {pending ? "Sending…" : "Send sign-in code"}
              </button>
            </form>
          </>
        ) : (
          <form onSubmit={handleVerify} className="space-y-5">
            <p className="text-sm text-brand-text-muted">
              We sent a sign-in code to{" "}
              <span className="font-medium text-brand-text">{email}</span>. Open
              your email, copy the code, and type it here.
            </p>

            <div>
              <label htmlFor="code" className="mb-1 block text-sm font-medium text-brand-text">
                Sign-in code
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={10}
                className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-center text-2xl tracking-[0.4em] focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                placeholder="Paste your code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                autoFocus
              />
            </div>

            {error ? (
              <p className="text-sm text-brand-danger" role="alert">
                {error}
              </p>
            ) : null}

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
                  setStep("email");
                  setCode("");
                  setError(null);
                }}
                className="text-brand-primary underline"
              >
                Change email
              </button>
              <span>
                The same email also has a sign-in link — either works.
              </span>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
