// Signed-in home — the intent-based CTA hub (SPEC §7.05 / hard constraint #9:
// intent-based UI shown to everyone, always). Replaces the marketing landing
// for signed-in members. Live destinations link out; not-yet-built intents
// (listings/matrimony/jobs = §4/Phase 2) are shown as "coming soon" rather
// than hidden, so the shape of the product is visible.

import Link from "next/link";

type Pulse = {
  total_members: number;
  total_cities_represented: number;
  total_professionals: number;
} | null;

const cardClass =
  "flex flex-col rounded-2xl border border-brand-border bg-white p-6 shadow-sm";
const liveLink =
  "mt-3 inline-block rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-primary-dark";

export function SignedInHome({
  name,
  pulse,
  profileComplete,
}: {
  name: string | null;
  pulse: Pulse;
  profileComplete: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-light text-brand-primary">
          Welcome{name ? `, ${name}` : ""}
        </h1>
        <p className="mt-1 text-sm text-brand-text-muted">
          What would you like to do today?
        </p>
      </header>

      {!profileComplete ? (
        <div className="mb-6 flex flex-col gap-2 rounded-2xl border border-brand-gold/40 bg-brand-gold/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-brand-text">
            Complete your profile so fellow Nagars can find you in the
            directory.
          </p>
          <Link
            href="/profile"
            className="shrink-0 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-primary-dark"
          >
            Complete profile →
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        {/* CONNECT — find & reach people */}
        <div className={cardClass}>
          <h2 className="text-lg font-medium text-brand-primary">Connect</h2>
          <p className="mt-1 flex-1 text-sm text-brand-text-muted">
            Find and reach fellow Nagars — by profession, city, or what they
            offer.
          </p>
          <Link href="/directory" className={liveLink}>
            Browse the directory
          </Link>
          <p className="mt-2 text-xs text-brand-text-muted">
            Matrimony &amp; mentor matching — coming soon.
          </p>
        </div>

        {/* FIND — find offers & help */}
        <div className={cardClass}>
          <h2 className="text-lg font-medium text-brand-primary">Find</h2>
          <p className="mt-1 flex-1 text-sm text-brand-text-muted">
            Browse rooms, rides, goods and services on offer — or find a doctor,
            mentor, or blood donor in the directory.
          </p>
          <Link href="/feed" className={liveLink}>
            Browse the feed
          </Link>
          <p className="mt-2 text-xs text-brand-text-muted">
            Can&apos;t find it?{" "}
            <Link href="/requests/new" className="underline">
              Post a request
            </Link>{" "}
            · people are in the{" "}
            <Link href="/directory" className="underline">
              directory
            </Link>
            .
          </p>
        </div>

        {/* OFFER — give to the circle */}
        <div className={cardClass}>
          <h2 className="text-lg font-medium text-brand-primary">Offer</h2>
          <p className="mt-1 flex-1 text-sm text-brand-text-muted">
            List a room, ride, service or business — or share your expertise
            and time from your profile.
          </p>
          <Link href="/listings/new" className={liveLink}>
            Create a listing
          </Link>
          <p className="mt-2 text-xs text-brand-text-muted">
            Expertise &amp; સેવા offers live on your profile.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link href="/feed" className="text-brand-primary underline">
          Community feed
        </Link>
        <Link href="/listings" className="text-brand-primary underline">
          Your listings
        </Link>
        <Link href="/requests" className="text-brand-primary underline">
          Your requests
        </Link>
        <Link href="/listings/leads" className="text-brand-primary underline">
          Your leads
        </Link>
        <Link href="/connections" className="text-brand-primary underline">
          Your connections
        </Link>
        <Link href="/intelligence" className="text-brand-primary underline">
          Community insights
        </Link>
        <Link href="/profile" className="text-brand-primary underline">
          Edit your profile
        </Link>
      </div>

      {pulse && pulse.total_members > 0 ? (
        <p className="mt-8 border-t border-brand-border pt-6 text-sm text-brand-text-muted">
          Our community so far: <strong>{pulse.total_members}</strong>{" "}
          {pulse.total_members === 1 ? "member" : "members"}
          {pulse.total_cities_represented > 0
            ? ` across ${pulse.total_cities_represented} ${pulse.total_cities_represented === 1 ? "city" : "cities"}`
            : ""}
          {pulse.total_professionals > 0
            ? ` · ${pulse.total_professionals} sharing their profession`
            : ""}
          .
        </p>
      ) : null}
    </div>
  );
}
