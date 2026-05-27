// /terms — Terms of Service (DRAFT)
//
// Linked from the sign-up gate (web + mobile) and from the page footer. The
// posture mirrors `LEGAL.md`'s connector-only thesis and the hard
// constraints in `CLAUDE.md`. Content here is a starting point — a real
// lawyer-reviewed Terms goes in before public launch. Until then the
// in-page banner makes the draft state unmistakable to any visitor.
//
// `TERMS_VERSION` from @nagarsetu/shared/consent is the same string the
// auth bootstrap trigger persists to `members.terms_version` at signup —
// bumping it forces a re-acceptance flow (deferred until first version
// bump per migration 0014).

import Link from "next/link";
import { identity, TERMS_VERSION } from "@nagarsetu/shared";

export const metadata = {
  title: "Terms of Service — Jay Hatkesh",
  description:
    "Connector-only community platform. Jay Hatkesh introduces members; the deal happens offline between them. Draft pending legal review.",
};

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-brand-text-muted">
          Version {TERMS_VERSION} · Last updated 2026-05-27
        </p>
      </header>

      <div
        className="mb-8 rounded-lg border border-brand-warning/30 bg-brand-warning/10 p-4 text-sm text-brand-text"
        role="note"
      >
        <strong>Draft.</strong> This is a working version. The final Terms
        will be reviewed by a lawyer before Jay Hatkesh opens to the public.
        Posture and substance will not change between this draft and the
        final — Jay Hatkesh will remain a connector and never a party to
        member-to-member transactions.
      </div>

      <section className="space-y-8 text-brand-text">
        <div>
          <h2 className="text-xl font-medium text-brand-primary-dark">
            1. Who we are
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            Jay Hatkesh (also known as Nagarsetu) is a community platform for
            members of the Nagar samaj. The platform helps members find each
            other for hospitality, mobility, goods, services, professional
            knowledge, and cultural exchange. Membership is open to anyone who
            self-identifies with the community; we do not gate membership at
            entry. By signing up, you accept these Terms.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-medium text-brand-primary-dark">
            2. Connector — not a party (core clause)
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            Jay Hatkesh only <strong>introduces</strong> members to each
            other. We are <strong>not a party</strong> to any arrangement,
            payment, stay, ride, sale, rental, service, donation, or any
            other dealing between members. We do not guarantee availability,
            quality, safety, or outcome. Members deal with each other at
            their own discretion and responsibility. No money moves between
            members through Jay Hatkesh — every member-to-member payment
            happens directly, offline, between the people involved.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-medium text-brand-primary-dark">
            3. The only money we handle: the listing fee
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            The only payment Jay Hatkesh ever collects is a small{" "}
            <strong>listing fee</strong> charged when a member publishes a
            commercial listing (e.g. a room, a vehicle, a paid service). The
            fee is admin-configured and may change over time; the price and
            term applicable at the moment of purchase are snapshotted onto
            the listing and the payment record, and admin price changes
            never retroactively affect listings already published.
          </p>
          <p className="mt-2 text-sm leading-relaxed">
            Jay Hatkesh takes <strong>no commission</strong> on any
            member-to-member transaction. Belonging to the community —
            including the directory and the Community Intelligence views —
            is free for all members. The fee applies only at the moment of
            publishing a commercial offer.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-medium text-brand-primary-dark">
            4. Trust is earned, not gated
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            Anyone can sign up. Surname, city, gender, age, and sub-community
            are self-declared indicators that power directory and Community
            Intelligence features — they are <strong>not</strong> hard gates
            at entry. Higher-risk actions (hosting a stay, renting a vehicle)
            require identity verification and a track record before they
            become available. This is the trust ladder.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-medium text-brand-primary-dark">
            5. Availability is coordination, not booking
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            Where Jay Hatkesh shows availability windows (e.g. for a room or
            a vehicle), they are <strong>indicative</strong>. The platform
            does not hard-lock slots and does not adjudicate conflicts. If
            two members both reach out, they coordinate between themselves;
            Jay Hatkesh is not responsible for the outcome.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-medium text-brand-primary-dark">
            6. Acceptable use
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            Honest listings, respectful conduct, no spam. Community
            announcements are for genuinely significant events; misuse leads
            to removal under reactive moderation. The full norms live in our
            Community Guidelines (forthcoming). Jay Hatkesh reserves the
            right to remove content, suspend listings, and adjust trust
            levels in response to reports.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-medium text-brand-primary-dark">
            7. No professional advice
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            Guidance, second opinions, mentorship, and recommendations
            shared by members on Jay Hatkesh are{" "}
            <strong>not a substitute</strong> for professional medical,
            legal, financial, or other expert advice. Members are
            individuals offering their own perspective in good faith. Always
            consult a qualified professional for decisions that matter.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-medium text-brand-primary-dark">
            8. We are never a party to disputes
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            If members disagree about an offline arrangement (a payment, a
            stay, a service), Jay Hatkesh does not mediate, does not
            adjudicate, and does not hold funds. We may, where appropriate,
            adjust the trust level or remove a listing in response to
            substantiated reports — but the dispute itself is between the
            members.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-medium text-brand-primary-dark">
            9. Account suspension & termination
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            We may suspend or terminate accounts that violate these Terms or
            the Community Guidelines, with or without notice depending on
            severity. Listings published while an account is in good
            standing remain visible until they expire or are removed.
            Listing fees are non-refundable once the listing has gone live
            (the reach is delivered immediately).
          </p>
        </div>

        <div>
          <h2 className="text-xl font-medium text-brand-primary-dark">
            10. Limitation of liability
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            To the maximum extent permitted by law, Jay Hatkesh and its
            operators are not liable for any loss, harm, damage, or claim
            arising out of any member-to-member arrangement, the inability
            to reach another member, decisions made on the basis of
            community guidance, or the unavailability of the platform.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-medium text-brand-primary-dark">
            11. Changes to these Terms
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            We may update these Terms as the platform evolves. Material
            changes will trigger a re-acceptance flow at next sign-in. The
            version you accepted is stored on your member record.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-medium text-brand-primary-dark">
            12. Governing law
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            These Terms are governed by the laws of India. Any dispute
            arising under them is subject to the exclusive jurisdiction of
            the courts at Gujarat (to be confirmed during legal review).
          </p>
        </div>
      </section>

      <footer className="mt-12 border-t border-brand-border pt-6 text-xs text-brand-text-muted">
        <p>
          Questions about these Terms? See{" "}
          <Link href="/privacy" className="text-brand-primary underline">
            Privacy Policy
          </Link>{" "}
          for the data side, or contact us (page forthcoming).
        </p>
      </footer>
    </main>
  );
}
