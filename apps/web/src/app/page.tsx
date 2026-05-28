// Landing page — Phase 1 §3, AGENDA "Landing page".
//
// Spec is locked in SPEC §7.05 + MEMORY ("Landing page must (first second)"
// + "Landing mission copy = Option A, LOCKED"). The four jobs this page
// must do in the first second:
//   1. Signal Nagar belonging unmistakably (the belonging line).
//   2. Show the mission/soul (the locked Option A copy) + the four benefit
//      lines so a visitor knows WHY before the gate.
//   3. Peep-not-transact — guests SEE Pulse + teaser feed + latest magazine
//      cover. DEFERRED in this slice (community has 0 members / 0 listings
//      / 0 magazine issues today; rendering zeros is the opposite of "peep
//      at a living community"). Ships in a follow-up slice once content
//      exists.
//   4. Gujarati typography ≥ English everywhere — co-equal title sizes,
//      Gujarati motto ≥ English translation. SPEC §9 codifies the rule.
//
// CTA copy is "Join the community" (warmer than "Sign in") per the locked
// mission framing. Signed-in members see a small banner + sign-out form
// at the top and the same landing below.

import Link from "next/link";
import { identity, motto, salutation } from "@nagarsetu/shared";
import { createClient } from "@/lib/supabase/server";

const BELONGING_LINE = "The digital home of the Nagar samaj — worldwide.";

// LOCKED mission copy (Option A — warm/rooted). See MEMORY.md.
const MISSION_EN =
  "Once, our community was a phone call away. Today we're scattered across cities and continents — yet a fellow Nagar's help, trust, and warmth is still the most valuable thing we have. Jay Hatkesh brings the samaj back within reach: to find each other, help each other, and grow together — wherever in the world we are.";

const BENEFITS = [
  "Find a Nagar doctor, lawyer, or mentor — anywhere in the world.",
  "Discover homes, rooms & rides within the community.",
  "Buy from and sell to your own people.",
  "Stand together in genuine need — verified help drives.",
] as const;

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex flex-1 flex-col">
      {/* Signed-in banner — minimal, top-anchored. Members get the rest
          of the landing as informational context until the in-app home
          screen ships. */}
      {user ? (
        <div className="flex items-center justify-between border-b border-brand-border bg-brand-surface/40 px-6 py-3 text-sm">
          <span className="text-brand-text-muted">
            Signed in as{" "}
            <span className="font-medium text-brand-text">{user.phone}</span>
          </span>
          <div className="flex items-center gap-2">
            <Link
              href="/directory"
              className="rounded-md border border-brand-border bg-white px-3 py-1.5 text-xs text-brand-text transition hover:border-brand-primary hover:text-brand-primary"
            >
              Directory
            </Link>
            <Link
              href="/profile"
              className="rounded-md border border-brand-border bg-white px-3 py-1.5 text-xs text-brand-text transition hover:border-brand-primary hover:text-brand-primary"
            >
              Your profile
            </Link>
            <form action="/auth/sign-out" method="post">
              <button
                type="submit"
                className="rounded-md border border-brand-border bg-white px-3 py-1.5 text-xs text-brand-text transition hover:border-brand-primary hover:text-brand-primary"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {/* HERO — job #1: signal belonging. Gujarati title co-equal with
          English (same font-size class, slightly different weight for
          visual rhythm). */}
      <section className="flex flex-col items-center px-6 pt-20 pb-12 text-center sm:pt-28">
        <p className="text-xs tracking-[0.4em] text-brand-text-muted uppercase">
          {identity.tagline.en}
        </p>
        <h1 className="mt-6 text-5xl font-light tracking-tight text-brand-primary sm:text-6xl">
          {identity.name.en}
        </h1>
        <p
          className="mt-2 text-5xl font-normal leading-[1.15] text-brand-primary-dark sm:text-6xl"
          lang="gu"
        >
          {identity.name.gu}
        </p>
        <p className="mt-10 max-w-xl text-lg leading-relaxed text-brand-text sm:text-xl">
          {BELONGING_LINE}
        </p>
      </section>

      {/* MISSION — job #2 (soul). Locked Option A copy. Treated as a
          quiet pulled-quote so the words have room to land. */}
      <section className="flex justify-center px-6 py-12">
        <blockquote className="max-w-2xl border-l-4 border-brand-gold/60 pl-6 text-lg leading-[1.8] text-brand-text sm:text-xl">
          {MISSION_EN}
        </blockquote>
      </section>

      {/* BENEFITS — job #2 (the WHY). Four lines as a clean list. */}
      <section className="flex flex-col items-center px-6 py-12">
        <h2 className="text-sm tracking-[0.3em] text-brand-text-muted uppercase">
          What Jay Hatkesh brings to your phone
        </h2>
        <ul className="mt-8 grid max-w-2xl gap-4 text-base text-brand-text sm:text-lg">
          {BENEFITS.map((line) => (
            <li key={line} className="flex gap-3">
              <span
                aria-hidden="true"
                className="mt-2 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-primary"
              />
              <span className="leading-relaxed">{line}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA — "Join the community" (warmer than "Sign in") per the
          locked landing framing. Hidden when already signed in. */}
      {!user ? (
        <section className="flex flex-col items-center px-6 py-12">
          <Link
            href="/sign-in"
            className="inline-block rounded-lg bg-brand-primary px-8 py-3 text-base font-medium text-white shadow-sm transition hover:bg-brand-primary-dark sm:text-lg"
          >
            Join the community
          </Link>
          <p className="mt-4 text-xs text-brand-text-muted">
            Free to belong · listing fee only when you post a commercial
            offer
          </p>
        </section>
      ) : null}

      {/* MOTTO — Gujarati larger than English per the §9 typography rule.
          Salutation closes the page. */}
      <footer className="mt-auto flex flex-col items-center gap-1 border-t border-brand-border px-6 pt-12 pb-8 text-center">
        <p
          className="text-xl font-normal leading-[1.6] text-brand-text sm:text-2xl"
          lang="gu"
        >
          {motto.gu}
        </p>
        <p className="text-sm text-brand-text-muted">{motto.en}</p>
        <p className="mt-6 text-base text-brand-primary-dark sm:text-lg" lang="gu">
          {salutation.gu}
        </p>
      </footer>
    </main>
  );
}
