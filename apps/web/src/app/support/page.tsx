// /support — "Support the portal": voluntary cash support to keep Jay Hatkesh
// running. Deliberately framed as SUPPORT, not "donation": until the portal has
// formal 80G tax-exemption registration, support is treated as ordinary income
// to run the platform — NOT a tax-deductible donation, no donation receipts.
// Once 80G is in place we switch the language to proper donations. Offered in
// the spirit of સેવા (CONCEPT §3 & §12); distinct from Help Drives (member-to-
// family giving the app never touches). Payment (Razorpay) wired in a follow-up;
// for now this routes would-be supporters to contact us.

import Link from "next/link";
import { identity, motto, salutation } from "@nagarsetu/shared";

export const metadata = {
  title: `Support the portal — ${identity.name.en}`,
  description:
    "Support Jay Hatkesh with any amount — even ₹1 helps. Until we have formal 80G registration, support is income used to run the portal, not a tax-deductible donation.",
};

const sectionH = "text-xl font-medium text-brand-primary-dark";

export default function SupportPage() {
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
          Help keep {identity.name.en} running and free to belong — owned by the
          community, not by outside investors.
        </p>
      </header>

      <article className="flex flex-col gap-8 text-brand-text">
        <section>
          <h2 className={sectionH}>Why your support matters</h2>
          <p className="mt-2 leading-relaxed">
            {identity.name.en} is self-sustaining, not investor-driven. A modest
            listing fee — charged only when a member posts a commercial offer —
            is meant to cover our running costs. While the community is still
            young, your support keeps the lights on: it keeps the directory and
            Community Intelligence free for every Nagar, powers the magazine, and
            keeps the samaj&apos;s tools owned by the community.
          </p>
        </section>

        <section>
          <h2 className={sectionH}>Every rupee counts</h2>
          <p className="mt-2 leading-relaxed">
            Any amount helps — <strong>even ₹1</strong>. It is offered in the
            spirit of <span lang="gu">સેવા</span>: give if it is in your heart
            and within your means; never an obligation. Belonging will always be
            free.
          </p>
        </section>

        <section className="rounded-2xl border border-brand-border bg-brand-surface/40 px-6 py-6">
          <h2 className={sectionH}>How we treat your support</h2>
          <p className="mt-2 leading-relaxed">
            We want to be fully transparent. {identity.name.en} does not yet have
            formal <strong>80G</strong> tax-exemption registration. For now, any
            support you give is treated as ordinary <strong>income</strong> used
            to run the portal — it is <strong>not</strong> a tax-deductible
            donation, and we do not issue donation receipts. Once we obtain
            formal 80G registration, we will invite proper donations, with the
            tax benefits that come with them. Until then, support in the form of
            cash is what keeps the portal going.
          </p>
        </section>

        <section className="rounded-2xl border border-brand-border bg-brand-surface/40 px-6 py-6">
          <h2 className={sectionH}>This is not a Help Drive</h2>
          <p className="mt-2 leading-relaxed">
            Support here keeps the <em>platform</em> running. It is different from
            a community Help Drive, where Nagars rally around a family in genuine
            need — in those, the money goes directly to the family and{" "}
            {identity.name.en} never touches or holds the funds.
          </p>
        </section>

        <section>
          <h2 className={sectionH}>How to support</h2>
          <p className="mt-2 leading-relaxed">
            We&apos;re setting up secure online options. In the meantime, if
            you&apos;d like to support the portal, please reach out and
            we&apos;ll guide you personally.
          </p>
          <Link
            href="/contact"
            className="mt-4 inline-block rounded-lg bg-brand-primary px-8 py-3 text-base font-medium text-white shadow-sm transition hover:bg-brand-primary-dark"
          >
            Get in touch
          </Link>
          <p className="mt-4 text-xs text-brand-text-muted">
            Support is voluntary and non-refundable.
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
