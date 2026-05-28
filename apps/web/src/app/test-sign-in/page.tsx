"use client";

// ⚠ TEMPORARY TEST AFFORDANCE — REMOVE BEFORE LAUNCH ⚠
// Email magic-link sign-in so the authenticated pages can be exercised before
// the Meta WhatsApp OTP path is live. Not linked from the main sign-in flow.
// Requires: email provider enabled in Supabase + this origin's /auth/callback
// added to the Auth redirect-URL allowlist.

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TestSignInPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: true,
      },
    });
    setPending(false);
    if (otpError) setError(otpError.message);
    else setSent(true);
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-brand-border bg-white p-8 shadow-sm">
        <p className="mb-4 rounded-lg border border-brand-warning/40 bg-brand-warning/10 px-3 py-2 text-xs text-brand-warning">
          ⚠ Temporary test sign-in (email). For previewing the app before
          WhatsApp OTP is live. Not for production.
        </p>

        {sent ? (
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-light text-brand-primary">
              Check your email
            </h1>
            <p className="text-sm text-brand-text-muted">
              We sent a sign-in link to{" "}
              <span className="font-medium text-brand-text">{email}</span>. Open
              it in this browser to continue.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-5">
            <h1 className="text-2xl font-light text-brand-primary">
              Test sign-in
            </h1>
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-brand-text"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-base focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                placeholder="you@example.com"
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
              {pending ? "Sending…" : "Send sign-in link"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
