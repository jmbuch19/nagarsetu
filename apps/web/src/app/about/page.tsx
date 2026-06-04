// /about — the Jay Hatkesh / Nagarsetu story (public, no auth). Narrative drawn
// from CONCEPT.md in the warm fellow-Nagar voice. Linked from the landing
// header. Gujarati co-equal per the §9 typography rule.

import Link from "next/link";
import { identity, motto, salutation } from "@nagarsetu/shared";

export const metadata = {
  title: `About — ${identity.name.en}`,
  description:
    "Why Jay Hatkesh exists — the bridge of the Nagar samaj. A community platform where Nagars find each other, help each other, and circulate value among themselves.",
};

const sectionH = "text-xl font-medium text-brand-primary-dark";

export default function AboutPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-12">
      <header className="mb-10">
        <Link
          href="/"
          className="text-xs tracking-[0.3em] text-brand-text-muted uppercase hover:text-brand-primary"
        >
          ← {identity.name.en}
        </Link>
        <h1 className="mt-4 text-4xl font-light text-brand-primary">About us</h1>
        <p className="mt-3 text-lg leading-relaxed text-brand-text">
          {identity.tagline.en} — <span lang="gu">નાગર</span> (our community){" "}
          + <span lang="gu">સેતુ</span> (a bridge). A digital home for the Nagar
          samaj, worldwide.
        </p>
      </header>

      <article className="flex flex-col gap-8 text-brand-text">
        <section>
          <h2 className={sectionH}>Why we exist</h2>
          <p className="mt-2 leading-relaxed">
            Once, our community was a phone call away. Today we are scattered
            across cities and continents — yet a fellow Nagar&apos;s help,
            trust, and warmth is still the most valuable thing we have.{" "}
            {identity.name.en} brings the samaj back within reach: to find each
            other, help each other, and grow together — wherever in the world we
            are.
          </p>
          <p className="mt-3 leading-relaxed">
            The promise is simple:{" "}
            <em>
              a Nagar, anywhere, should be able to say — &ldquo;I need not worry,
              my community is there.&rdquo;
            </em>
          </p>
        </section>

        <section>
          <h2 className={sectionH}>A circle, not a marketplace</h2>
          <p className="mt-2 leading-relaxed">
            Every rupee a Nagar would have spent on a stranger — a costly hotel,
            a cab, an outside consultant, an online seller — can instead stay
            inside the community and strengthen it. Knowledge, hospitality,
            mobility, goods, services, and culture circulate among members. That
            circulation is the whole idea.
          </p>
          <p className="mt-3 leading-relaxed">
            And everyone is on both sides of it. There is no class of
            &ldquo;providers&rdquo; serving a class of &ldquo;consumers&rdquo; —
            the same doctor who answers a second-opinion request also needs a
            room for her son in another city. Roles are fluid; the flow is
            circular, never one-way. Hand in hand, shoulder to shoulder.
          </p>
        </section>

        <section>
          <h2 className={sectionH}>Built on a living legacy</h2>
          <p className="mt-2 leading-relaxed">
            The community already produces <em>Setusarjan</em>, an e-magazine 87
            issues deep, lovingly typeset by hand each month. {identity.name.en}{" "}
            doesn&apos;t replace that spirit — it gives it an engine, and
            surrounds it with everything else a modern community needs.
          </p>
        </section>

        <section>
          <h2 className={sectionH}>How we work</h2>
          <ul className="mt-3 flex flex-col gap-3 leading-relaxed">
            <li>
              <strong>Belonging is free.</strong> Anyone can join, build a
              profile, and be counted. A small fee applies only when a member
              publishes a commercial offer.
            </li>
            <li>
              <strong>A connector, not a cashier.</strong> We make the
              introduction; the deal happens directly between members.
            </li>
            <li>
              <strong>No commission, ever.</strong> The app never takes a cut of
              what members exchange. Value stays fully inside the circle.
            </li>
            <li>
              <strong>Open membership, earned trust.</strong> Anyone can join;
              trust is built through reputation, and verified only where safety
              truly needs it.
            </li>
            <li>
              <strong>Self-sustaining, not investor-driven.</strong> Modest
              listing fees cover our costs. No outside investor, no pressure —
              the community owns its own platform.
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-brand-border bg-brand-surface/40 px-6 py-8 text-center">
          <p className="text-2xl font-normal leading-[1.6] text-brand-text" lang="gu">
            {motto.gu}
          </p>
          <p className="mt-1 text-sm text-brand-text-muted">{motto.en}</p>
        </section>

        <section className="flex flex-col items-center gap-3 py-2 text-center">
          <p className="text-lg text-brand-text">
            Find your people. Be found by them.
          </p>
          <Link
            href="/join"
            className="inline-block rounded-lg bg-brand-primary px-8 py-3 text-base font-medium text-white shadow-sm transition hover:bg-brand-primary-dark"
          >
            Join the community
          </Link>
        </section>
      </article>

      <footer className="mt-10 border-t border-brand-border pt-6 text-center">
        <p className="text-base text-[#FF5000] sm:text-lg" lang="gu">
          {salutation.gu}!
        </p>
      </footer>
    </main>
  );
}
