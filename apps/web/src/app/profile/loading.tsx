// Instant skeleton shown the moment a member lands on /profile — most
// importantly right after OTP verification, while the server component does
// its auth round-trip + lookups. Without this, the previous screen (the
// "Verifying…" sign-in card) stays frozen on-screen for the whole server
// render, which read as "it hung". This gives immediate visual feedback that
// the profile is loading. Mirrors the real page's header + stacked cards.

import { identity } from "@nagarsetu/shared";

function Bar({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-brand-border/60 ${className}`} />
  );
}

function CardSkeleton() {
  return (
    <div className="mt-6 rounded-2xl border border-brand-border bg-white p-6 shadow-sm sm:p-8">
      <Bar className="h-4 w-40" />
      <div className="mt-4 space-y-3">
        <Bar className="h-10 w-full" />
        <Bar className="h-10 w-full" />
        <Bar className="h-10 w-2/3" />
      </div>
    </div>
  );
}

export default function ProfileLoading() {
  return (
    <main className="flex flex-1 justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <header className="mb-6">
          <p className="text-xs tracking-[0.3em] text-brand-text-muted uppercase">
            {identity.tagline.en}
          </p>
          <h1 className="mt-2 text-3xl font-light text-brand-primary">
            Your profile
          </h1>
          <p className="mt-2 text-sm text-brand-text-muted">
            Signing you in and loading your profile…
          </p>
        </header>

        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </main>
  );
}
