"use client";

// Completion form for Google sign-ups. Terms acceptance is REQUIRED; the
// WhatsApp number is requested but skippable (leave blank → added later in
// /profile). Mirrors the consent UI on /join so the two paths feel identical.

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { identity, salutation } from "@nagarsetu/shared";
import { completeOnboarding } from "./actions";

// Same diaspora-aware list as /join. India first, then alphabetical; "Other"
// lets a member from an uncovered country type their own dial code.
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

export function WelcomeForm({ firstName }: { firstName: string | null }) {
  const router = useRouter();
  const [dialCode, setDialCode] = useState<string>("+91");
  const [customDial, setCustomDial] = useState("");
  const [national, setNational] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [optInWhatsapp, setOptInWhatsapp] = useState(true);
  const [optInEmail, setOptInEmail] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const effectiveDial = dialCode === OTHER_DIAL ? customDial.trim() : dialCode;
  const digits = national.replace(/\D/g, "");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!termsAccepted) {
      setError("Please accept the Terms to continue.");
      return;
    }

    // Phone is optional. Only validate when the member started entering one.
    let phone: string | null = null;
    if (digits.length > 0) {
      if (dialCode === OTHER_DIAL && !/^\+\d{1,4}$/.test(customDial.trim())) {
        setError("Please enter your country code starting with + (e.g. +65).");
        return;
      }
      if (digits.length < 6) {
        setError("Please enter a valid WhatsApp number, or leave it blank to add later.");
        return;
      }
      phone = `${effectiveDial}${digits}`;
    }

    setPending(true);
    const result = await completeOnboarding({
      phone,
      optInWhatsapp,
      optInEmail,
      termsAccepted,
    });
    setPending(false);

    if (!result.ok) {
      setError(result.message ?? "Something went wrong — please try again.");
      return;
    }

    if (result.phoneTaken) {
      // Accept-don't-reject: account is saved; the number just couldn't be
      // attached. Let them continue and add a different one later.
      setNotice(
        "That WhatsApp number is already registered to another member. We've saved your account — you can add a different number anytime from Your profile.",
      );
      return;
    }

    router.replace("/profile");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-brand-border bg-white p-8 shadow-sm">
        <header className="mb-5 text-center">
          <p className="text-xs tracking-[0.3em] text-brand-text-muted uppercase">
            {identity.tagline.en}
          </p>
          <h1 className="mt-1 text-3xl font-light text-brand-primary">
            {firstName ? `Welcome, ${firstName}` : "One last step"}
          </h1>
          <p className="mt-1 text-lg font-light text-brand-primary-dark" lang="gu">
            {identity.name.gu}
          </p>
        </header>

        {notice ? (
          <div className="space-y-4">
            <p className="rounded-lg border border-brand-gold/40 bg-brand-surface/40 px-3 py-3 text-sm text-brand-text">
              {notice}
            </p>
            <button
              type="button"
              onClick={() => router.replace("/profile")}
              className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-base font-medium text-white transition hover:bg-brand-primary-dark"
            >
              Continue to your profile
            </button>
          </div>
        ) : (
          <>
            <p className="mb-5 rounded-lg border border-brand-gold/40 bg-brand-surface/40 px-3 py-2 text-xs text-brand-text-muted">
              Just one quick step. Add your WhatsApp number so fellow Nagars can
              reach you — or skip it and add it later.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="phone" className="mb-1 block text-sm font-medium text-brand-text">
                  WhatsApp number{" "}
                  <span className="font-normal text-brand-text-muted">(optional)</span>
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
                  Never shown publicly — revealed only when you connect with a
                  fellow Nagar.
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
                {pending ? "Saving…" : "Enter the community"}
              </button>

              <p className="text-center text-xs text-brand-text-muted" lang="gu">
                {salutation.gu}
              </p>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
