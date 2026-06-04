// Slim top header for the guest marketing landing. Brand left; About Us +
// Donate CTAs right. Guests have no MemberNav (that renders only for signed-in
// members), so this gives the landing a real header carrying the two public
// CTAs. Static — no client JS needed.

import Link from "next/link";
import { identity } from "@nagarsetu/shared";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-brand-border bg-background">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-6 py-3">
        <Link
          href="/"
          className="text-sm font-medium tracking-tight text-brand-primary"
        >
          {identity.name.en}
        </Link>
        <nav className="flex items-center gap-x-5">
          <Link
            href="/about"
            className="text-sm text-brand-text-muted transition hover:text-brand-primary"
          >
            About Us
          </Link>
          <Link
            href="/donate"
            className="rounded-lg bg-brand-accent px-4 py-1.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
          >
            Donate
          </Link>
        </nav>
      </div>
    </header>
  );
}
