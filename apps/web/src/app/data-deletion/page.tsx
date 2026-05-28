// /data-deletion — Data & Account Deletion instructions (DRAFT)
//
// This is the page to give Meta as the "User Data Deletion → Data Deletion
// Instructions URL" during app setup, and it backs the DPDP erasure right.
// Public (no auth) so Meta reviewers + members can read it.
//
// Contact address is the shared `contact.email` (dedicated project inbox).

import Link from "next/link";
import { contact, identity } from "@nagarsetu/shared";

const CONTACT_EMAIL = contact.email;

export const metadata = {
  title: "Data & Account Deletion — Jay Hatkesh",
  description:
    "How to delete your Jay Hatkesh account and personal data, what is removed, and what is retained. Draft pending legal review.",
};

export default function DataDeletionPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-12">
      <header className="mb-8">
        <Link
          href="/"
          className="text-xs tracking-[0.3em] text-brand-text-muted uppercase hover:text-brand-primary"
        >
          ← {identity.name.en}
        </Link>
        <h1 className="mt-4 text-4xl font-light text-brand-primary">
          Data &amp; Account Deletion
        </h1>
        <p className="mt-2 text-sm text-brand-text-muted">
          Last updated 2026-05-28
        </p>
      </header>

      <div
        className="mb-8 rounded-lg border border-brand-warning/30 bg-brand-warning/10 p-4 text-sm text-brand-text"
        role="note"
      >
        <strong>Draft.</strong> The posture is final — you can delete your
        account and personal data at any time. Exact wording and the
        self-serve in-app flow are being finalised; until then the email route
        below works.
      </div>

      <section className="space-y-8 text-brand-text">
        <div>
          <h2 className="text-xl font-medium text-brand-primary-dark">
            How to delete your account &amp; data
          </h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed">
            <li>
              <strong>In the app (self-serve):</strong> sign in →{" "}
              <em>Your profile</em> → <em>Delete account</em> → confirm. Your
              account is deactivated immediately and permanently erased after a
              short grace period. <em>(Rolling out — if you don&apos;t see it
              yet, use the email route below.)</em>
            </li>
            <li>
              <strong>By request:</strong> email{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-brand-primary underline"
              >
                {CONTACT_EMAIL}
              </a>{" "}
              from the phone number or email on your account, with the subject
              &ldquo;Delete my account&rdquo;. We verify it&apos;s you and erase
              your data within 30 days.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-medium text-brand-primary-dark">
            What gets deleted
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            Your profile (name, city + PIN, gender, date of birth, photo, bio,
            blood group), your professions and the things you offer, your
            connection requests, any listings, inquiries and reviews you
            authored, and your WhatsApp / email contact details and opt-in
            preferences.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-medium text-brand-primary-dark">
            What we retain (and why)
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            Records we must keep for legal or accounting reasons — chiefly
            payment receipts for any listing fee — are{" "}
            <strong>anonymised</strong> rather than deleted, so they can no
            longer be linked to you. Moderation records (e.g. reports involving
            other members) are likewise anonymised to keep the community audit
            trail honest. See the{" "}
            <Link href="/privacy" className="text-brand-primary underline">
              Privacy Policy
            </Link>{" "}
            for detail.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-medium text-brand-primary-dark">
            WhatsApp &amp; Meta data
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            If you opted in to WhatsApp messages, deleting your account removes
            your number from all of our send lists immediately. Message-delivery
            metadata held by Meta (WhatsApp) is governed by Meta&apos;s own data
            policies; deleting your Jay Hatkesh account stops us from sending you
            any further messages.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-medium text-brand-primary-dark">
            Contact &amp; grievance
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            For any data, deletion, or privacy request, contact{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-brand-primary underline"
            >
              {CONTACT_EMAIL}
            </a>
            . Under India&apos;s Digital Personal Data Protection Act, 2023 you
            may also request access, correction, or export of your data through
            the same address.
          </p>
        </div>
      </section>

      <footer className="mt-12 border-t border-brand-border pt-6 text-xs text-brand-text-muted">
        <p>
          See also our{" "}
          <Link href="/privacy" className="text-brand-primary underline">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className="text-brand-primary underline">
            Terms of Service
          </Link>
          .
        </p>
      </footer>
    </main>
  );
}
