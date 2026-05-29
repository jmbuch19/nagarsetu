// /faq — Community-voiced FAQ (public). Mirrors FAQ.md, rendered as
// collapsible accordions. Carries a "submit a query" navigation CTA → /contact,
// so a reader whose question isn't answered can reach a real Nagar.

import Link from "next/link";
import { identity } from "@nagarsetu/shared";
import { FAQ_INTRO, FAQ_CLOSING, FAQ_SECTIONS } from "./faq-content";

export const metadata = {
  title: `FAQ — ${identity.name.en}`,
  description:
    "Answers, in a fellow Nagar's voice — what Jay Hatkesh is, how connecting works, the listing fee, privacy, and more. Can't find your question? Write to us.",
};

export default function FaqPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <header className="mb-8">
        <Link
          href="/"
          className="text-xs tracking-[0.3em] text-brand-text-muted uppercase hover:text-brand-primary"
        >
          ← {identity.name.en}
        </Link>
        <h1 className="mt-4 text-3xl font-light text-brand-primary">
          Questions, answered
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-brand-text-muted">
          {FAQ_INTRO}
        </p>
      </header>

      <div className="space-y-10">
        {FAQ_SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="mb-3 text-xs font-semibold tracking-[0.2em] text-brand-text-muted uppercase">
              {section.title}
            </h2>
            <div className="divide-y divide-brand-border overflow-hidden rounded-2xl border border-brand-border bg-white">
              {section.items.map((item) => (
                <details key={item.q} className="group">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-base font-medium text-brand-text marker:content-none hover:bg-brand-surface">
                    <span>{item.q}</span>
                    <span
                      aria-hidden
                      className="shrink-0 text-brand-text-muted transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="px-5 pb-5 text-sm leading-relaxed text-brand-text-muted">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-10 text-center text-sm leading-relaxed text-brand-text-muted">
        {FAQ_CLOSING}
      </p>

      <div className="mt-8 rounded-2xl border border-brand-border bg-brand-surface p-6 text-center sm:p-8">
        <h2 className="text-lg font-medium text-brand-primary">
          Didn&apos;t find your question?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-brand-text-muted">
          Write to us — a real fellow Nagar reads every message and tries to
          reply within a working day.
        </p>
        <Link
          href="/contact"
          className="mt-5 inline-block rounded-lg bg-brand-primary px-8 py-2.5 text-base font-medium text-white transition hover:bg-brand-primary-dark"
        >
          Submit a query
        </Link>
      </div>
    </main>
  );
}
