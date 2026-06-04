// /donate — "Support the portal": voluntary patron contributions to the
// platform, in the spirit of સેવા (CONCEPT §3 & §12). Explicitly distinct from
// the listing fee AND from Help Drives (member-to-family giving the app never
// touches). Payment wiring (Razorpay) lands in a follow-up slice; for now this
// page introduces the cause and routes would-be patrons to contact us.

import Link from "next/link";
import { identity, motto, salutation } from "@nagarsetu/shared";

export const metadata = {
  title: `Support the portal — ${identity.name.en}`,
  description:
    "Voluntary patron contributions help keep Jay Hatkesh free to belong and owned by the community — not by outside investors. Offered in the spirit of seva.",
};

const sectionH = "text-xl font-medium text-brand-primary-dark";

export default function DonatePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-12">
      <header className="mb-10">
        <Link
          href="/"
          className="text-xs tracking-[0.3em] text-brand-text-muted uppercase hover:text-brand-primary"
        >
          ← {identity.name.en}
        </Link>
        <h1 className="mt-4 text-4xl font-light text-brand-primary">
          Support the portal
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-brand-text">
          Help keep {identity.name.en} free to belong — and owned by the
          community, not by outside investors.
        </p>
      </header>

      <article className="flex flex-col gap-8 text-brand-text">
        <section>
          <h2 className={sectionH}>Why contribute</h2>
          <p className="mt-2 leading-relaxed">
            {identity.name.en} is self-sustaining, not investor-driven. A modest
            listing fee — charged only when a member posts a commercial offer —
            covers our running costs. Voluntary contributions from members who
            believe in the mission let us do more: keep the directory and
            Community Intelligence free for every Nagar, power the magazine, and
            keep the samaj&apos;s tools owned by the community.
          </p>
          <p className="mt-3 leading-relaxed">
            It is offered in the spirit of <span lang="gu">સેવા</span> — give if
            it is in your heart and within your means; never an obligation.
            Belonging will always be free.
          </p>
        </section>

        <section className="rounded-2xl border border-brand-border bg-brand-surface/40 px-6 py-6">
          <h2 className={sectionH}>This is not a Help Drive</h2>
          <p className="mt-2 leading-relaxed">
            A contribution here supports the <em>platform</em>. It is different
            from a community Help Drive, where Nagars rally around a family in
            genuine need — in those, the money goes directly to the family and{" "}
            {identity.name.en} never touches or holds the funds.
          </p>
        </section>

        <section>
          <h2 className={sectionH}>How to contribute</h2>
          <p className="mt-2 leading-relaxed">
            We&apos;re setting up secure online contributions. In the meantime,
            if you&apos;d like to support the portal, please reach out and
            we&apos;ll guide you personally.
          </p>
          <Link
            href="/contact"
            className="mt-4 inline-block rounded-lg bg-brand-primary px-8 py-3 text-base font-medium text-white shadow-sm transition hover:bg-brand-primary-dark"
          >
            Get in touch
          </Link>
          <p className="mt-4 text-xs text-brand-text-muted">
            Contributions to the platform are voluntary and non-refundable.
          </p>
        </section>

        <section className="rounded-2xl border border-brand-border bg-brand-surface/40 px-6 py-8 text-center">
          <p className="text-2xl font-normal leading-[1.6] text-brand-text" lang="gu">
            {motto.gu}
          </p>
          <p className="mt-1 text-sm text-brand-text-muted">{motto.en}</p>
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
