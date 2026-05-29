// /contact — Contact / suggestion form (public). Name + email + phone +
// message + a simple server-checked math captcha. Submissions email the
// project inbox (reply-to the submitter). Linked from the landing + the FAQ.

import Link from "next/link";
import { contact, identity } from "@nagarsetu/shared";
import { ContactForm } from "./contact-form";
import { makeCaptcha } from "./captcha";

export const metadata = {
  title: `Contact — ${identity.name.en}`,
  description:
    "Send a question, suggestion, or feedback to the Jay Hatkesh team. A real fellow Nagar reads every message.",
};

export default function ContactPage() {
  // Server-generated captcha numbers (new each load) — verified in the action.
  const { a: captchaA, b: captchaB } = makeCaptcha();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <header className="mb-6">
        <Link
          href="/"
          className="text-xs tracking-[0.3em] text-brand-text-muted uppercase hover:text-brand-primary"
        >
          ← {identity.name.en}
        </Link>
        <h1 className="mt-4 text-3xl font-light text-brand-primary">
          Contact us
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-text-muted">
          A question, a suggestion, an idea for a feature, or a bug — write to
          us. A real fellow Nagar reads every message and tries to reply within
          a working day. You can also email{" "}
          <a
            href={`mailto:${contact.email}`}
            className="text-brand-primary underline"
          >
            {contact.email}
          </a>
          .
        </p>
      </header>

      <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm sm:p-8">
        <ContactForm captchaA={captchaA} captchaB={captchaB} />
      </div>
    </main>
  );
}
