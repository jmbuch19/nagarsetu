"use client";

// "Continue with Google" — shared by /join and /sign-in. Starts the Supabase
// Google OAuth flow; the provider redirects back to /auth/callback, which
// exchanges the code and routes new (consent-pending) users to /welcome and
// returning members to their destination.
//
// Note: Google returns an email but NO phone and NO Terms acceptance, so the
// consent + WhatsApp-number step happens on /welcome after sign-in (founder
// decision 2026-06-19). This button therefore does NOT gate on a Terms
// checkbox — consent is captured on the completion screen.

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function GoogleSignInButton({ disabled }: { disabled?: boolean }) {
  const supabase = createClient();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setPending(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // The callback decides /welcome vs the member's destination based on
        // whether Terms have been accepted yet.
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    // On success the browser navigates away to Google; we only land here on
    // error (e.g. provider not configured).
    if (oauthError) {
      setPending(false);
      setError(oauthError.message);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending || disabled}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-brand-border bg-white px-4 py-2.5 text-base font-medium text-brand-text transition hover:bg-brand-surface/60 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <GoogleGlyph />
        {pending ? "Redirecting…" : "Continue with Google"}
      </button>
      {error ? (
        <p className="mt-2 text-sm text-brand-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

// Inline SVG so we don't pull an icon dependency. Google brand mark.
function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}
