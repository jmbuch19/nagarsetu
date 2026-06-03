// /privacy — Privacy Policy (DRAFT)
//
// Linked from the sign-up gate (web + mobile) and required by Meta WhatsApp
// (mandatory for app submission) + Razorpay activation. Content is a
// starting point per `LEGAL.md`; a lawyer review pass is required before
// public launch. The WhatsApp-opt-in section is Meta-mandatory wording —
// keep that section accurate as the actual opt-in flow ships.

import Link from "next/link";
import { contact, identity, TERMS_VERSION } from "@nagarsetu/shared";

export const metadata = {
  title: "Privacy Policy — Jay Hatkesh",
  description:
    "What we collect, how we use it, and how to control your data on Jay Hatkesh. Draft pending legal review.",
};

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-brand-text-muted">
          Version {TERMS_VERSION} · Last updated 2026-05-27
        </p>
      </header>

      <div
        className="mb-8 rounded-lg border border-brand-warning/30 bg-brand-warning/10 p-4 text-sm text-brand-text"
        role="note"
      >
        <strong>Draft.</strong> The substantive posture is final — Jay
        Hatkesh collects the minimum needed to power the directory and
        community matching, and sells no member data. Exact wording will be
        reviewed by a lawyer before public launch.
      </div>

      <section className="space-y-8 text-brand-text">
        <div>
          <h2 className="text-xl font-medium text-brand-primary-dark">
            1. What we collect
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            When you sign up, we collect your <strong>phone number</strong>{" "}
            (the only required field — it powers your account). When you
            fill in your profile, we additionally collect: name, surname,
            city + PIN code, gender, date of birth, and optionally an email
            address, profile photo, sub-community, and short bio. If you
            list a profession, we record the profession, specialty, and your
            description of what you do.
          </p>
          <p className="mt-2 text-sm leading-relaxed">
            We <strong>do not collect your home address</strong>. Listings
            for things like a room, a vehicle, or a PG carry only the
            area/city/PIN; the exact location is shared directly between
            members when they connect, never published. Business and
            service listings carry full address and hours because the whole
            point of those is to be findable.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-medium text-brand-primary-dark">
            2. How we use it
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            Your profile powers the member directory, the cross-community
            search (Community Intelligence), and the matching that lets
            seekers find offers and vice versa. Contact details are{" "}
            <strong>gated</strong> — counts are visible; phone and email
            are revealed only when a member actively connects with you, or
            when you have an active listing where contact is the whole
            point.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-medium text-brand-primary-dark">
            3. Aggregate vs individual
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            Community Intelligence shows counts — e.g. &ldquo;12 doctors
            across Mumbai&rdquo; — not lists of names. Drill-downs reveal
            individuals
            only after a member opts to contact, and only the contact
            details that member has chosen to expose. Phone numbers,
            emails, and dates of birth are never shown in aggregate views;
            year-of-birth bands are derived server-side so the raw DOB is
            never returned to the browser.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-medium text-brand-primary-dark">
            4. WhatsApp messaging & opt-in (Meta-required clause)
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            At sign-up you can opt in to receive WhatsApp messages from Jay
            Hatkesh. We send two types of WhatsApp messages, both via Meta
            WhatsApp Cloud API using pre-approved templates:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed">
            <li>
              <strong>Utility notifications</strong> — e.g. when another
              member expresses interest in your listing, or when your
              listing is about to expire. Triggered by your own activity.
            </li>
            <li>
              <strong>The fortnightly community digest</strong> — at most
              one curated WhatsApp message every 15 days, with new
              listings, professional spotlights, and community events.
              Marketing-category template.
            </li>
          </ul>
          <p className="mt-2 text-sm leading-relaxed">
            You can <strong>opt out at any time</strong> from your profile
            settings; the next sync will exclude you from any further
            WhatsApp sends. The sign-in OTP itself is delivered over
            WhatsApp using an Authentication-category template and is not
            subject to the opt-in — without it you cannot sign in.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-medium text-brand-primary-dark">
            5. Email
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            Email is <strong>optional</strong>. We only ever send: payment
            receipts for the listing fee, and an OTP fallback if WhatsApp
            delivery fails. Every email carries an unsubscribe link. We do
            not use email for discovery or marketing.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-medium text-brand-primary-dark">
            6. Who else sees your data
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            We do not sell member data. We use the following service
            providers strictly to operate the platform, and only the
            minimum data they need for their function:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed">
            <li>
              <strong>Supabase</strong> — database, authentication,
              storage.
            </li>
            <li>
              <strong>Meta</strong> — WhatsApp message delivery via the
              Cloud API.
            </li>
            <li>
              <strong>Razorpay</strong> — payment processing for the
              listing fee.
            </li>
            <li>
              <strong>Resend</strong> — transactional email delivery
              (receipts, OTP fallback).
            </li>
            <li>
              <strong>Vercel</strong> — web hosting + edge delivery.
            </li>
            <li>
              <strong>Anthropic (Claude API)</strong> — Gujarati spelling
              checks and editorial assistance for the magazine; member
              text only, no personal data sent.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-medium text-brand-primary-dark">
            7. Data deletion
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            You can request deletion of your account and personal data at
            any time — see{" "}
            <Link
              href="/data-deletion"
              className="text-brand-primary underline"
            >
              Data &amp; Account Deletion
            </Link>{" "}
            for how. Deletion removes your profile, listings, inquiries, and
            reviews you authored. Records that are part of a community audit
            trail (e.g. reports about other members you filed, or payments you
            made) are anonymised rather than deleted, to keep the connector
            audit honest.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-medium text-brand-primary-dark">
            8. Security
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            Database access is row-level-secured: a member cannot read
            another member&apos;s gated contact details unless they have
            connected. Server-only secrets (payment keys, message-delivery
            tokens, signing secrets) are never shipped to the browser.
            Sessions are short-lived access tokens auto-refreshed by the
            client; refresh tokens are stored in platform-secure storage
            (httpOnly cookies on web, device keychain on mobile).
          </p>
        </div>

        <div>
          <h2 className="text-xl font-medium text-brand-primary-dark">
            9. Children
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            Jay Hatkesh is not directed at users under 18. If you believe a
            minor has signed up, contact us and we will remove the
            account.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-medium text-brand-primary-dark">
            10. Changes to this policy
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            Material changes trigger a re-acceptance flow at next sign-in.
            The version you accepted is stored on your member record.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-medium text-brand-primary-dark">
            11. Contact
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            For privacy questions or data-deletion requests, contact us at{" "}
            <a
              href={`mailto:${contact.legal}`}
              className="text-brand-primary underline"
            >
              {contact.legal}
            </a>
            .
          </p>
        </div>
      </section>

      <footer className="mt-12 border-t border-brand-border pt-6 text-xs text-brand-text-muted">
        <p>
          See also our{" "}
          <Link href="/terms" className="text-brand-primary underline">
            Terms of Service
          </Link>
          .
        </p>
      </footer>
    </main>
  );
}
