# MEMORY.md — Nagarsetu Durable Memory

Persistent decisions and context. Claude Code reads this every session.
Add new locked decisions here; move items out of "Open Decisions" once resolved.

---

## Locked decisions

- **Name:** Nagarsetu (નાગર + સેતુ = bridge of the community).
- **Audience:** the Nagar samaj.
- **Ethos:** સેવા · સહકાર · શિસ્ત.
- **Thesis:** a closed-loop community economy — value circulates among Nagars.
- **App is a connector, not a cashier.** Phase 1: no member-to-member money in-app.
- **No commission, ever** on member-to-member transactions.
- **Only in-app money = listing fee** (charged on publishing a commercial listing).
- **Listing fee is admin-managed config**, editable anytime (example: ₹199 / 30 days). Price + term are **snapshotted at purchase** — admin price changes never retroactively affect active listings.
- **Expiry policy (admin-configurable):** auto-expire, OR member self-renew (pay current amount), OR admin manual extend. Pre-expiry reminders ~day 25 & 28.
- **Professional activation perk:** while a paid listing is active, the professional is featured **weekly** in the community Email digest and WhatsApp broadcast. Requires member **opt-in** + **approved WhatsApp templates** + email unsubscribe.
- **Belonging free, selling paid.** Directory + Community Intelligence free for all members.
- **Open membership.** Anyone can sign up and build a profile; no hard Nagar gate. Nagar identity self-declared via indicators (surname, city, geo, gender, age).
- **Auth = Meta WhatsApp OTP** via Supabase Auth Hook (approved authentication template); Supabase manages sessions.
- **Trust is earned, not gated at entry.** High-risk actions (hosting a stay, renting a vehicle) require ID verification + reviews via the trust ladder (L0 browse → L1 participate → L2 ID-verified hosting).
- **Availability = coordination aid, not a booking.** No hard locks, no adjudication.
- **App is never a party to disputes** (see `DISPUTE.md`).
- **Gujarati is first-class.** Magazine render must reproduce the Setusarjan look.
- **Stack:** Next.js (web, **hosted on Vercel**), Expo/RN (mobile via EAS, Android-first OK), Supabase, phone OTP, Claude API, Razorpay (listing fee only), WhatsApp/FB share. Scheduler via Vercel Cron (protected by `CRON_SECRET`) or Supabase pg_cron.
- **Phasing:** Phase 1 = directory + intelligence + feed + listings/availability + magazine engine + listing-fee payment. Matrimony + audio editions + mentorship → Phase 2.
- **Education pillar — full Phase-1 scope (four sub-flows).** Education is not one field: (a) **Scholarships** — member/trust offers ↔ family applies (both sides FREE — સેવા); (b) **Career guidance** — reuses `member_capabilities` (expert_guidance / mentor) + mentorship matching, no new tables; (c) **Education listings** — tutors/coaching/courses via the `education` listing category (paid, like Business); (d) **Student profiles** — `member_professions.status = studying` members are the recipients.
  Scholarship policy (locked):
  - **L2 ID-verified required to publish a scholarship offer** — same gate as hosting a stay / renting a vehicle. Reason: fake scholarships raise false hope and damage community trust even though no money flows through the app.
  - **Offering member is the sole adjudicator** of shortlisting / awarding / rejecting. Nagarsetu never adjudicates; admin only via the standard `reports` flow.
  - **WhatsApp scholarship notifications use Utility templates** and go **only** to opted-in members with matching `scholarship_alerts`. The broader city + studying-status fan-out is in-app + email only (protects WABA quality).
  - **Connector disclaimer** on every scholarship surface — the offering party decides; verify directly with them.
  - **Lifecycle:** cron flips `status = open → closed` after `deadline + 24h grace`; no late applications.
  See `SPEC.md` §7.2 and `AGENDA.md` §7b.
- **Community Event Announcements — member-published, NO admin pre-approval (Phase 1).** Any member can broadcast a *significant* Nagar community event (religious, ritual, cultural, annual gathering, medical camp, or other). Spam-protected by four guards instead of an editorial gate: (1) required `event_type` from a controlled list; (2) member-affirmed significance checkbox at publish (`significance_confirmed_at`); (3) hard per-member rate limit (default **1 announcement per 7 days**, admin-tunable via `settings.community_event_rate_limit_*`); (4) reactive moderation via the existing `reports` flow (admin removes post-hoc; repeat abuse tightens the creator's rate limit + trust level). WhatsApp uses pre-approved templates only (Marketing for the initial blast, Utility for cancellations) + `opt_in_whatsapp = true`; in-app + email fallback always. Connector disclaimer on every announcement surface. See `SPEC.md` §7.3 and `AGENDA.md` §7c.

## Context

- The community already publishes *Setusarjan* (87+ issues), hand-typeset monthly; a volunteer types Gujarati for members who can't. The app automates this labour while preserving the look.
- Submission norms (from the magazine): text only; deadline the 15th; name + city + passport photo; not pre-published on WhatsApp/FB.
- Closing salutation: **જય હાટકેશ**.
- **Color palette** (derived from the Setusarjan cover; full tokens in SPEC §9): peacock teal `#0E6B6B` primary · saffron `#E97C1F` accent · heritage gold `#C9A24B` · ivory `#FBFAF5` bg · soft sage `#EAF1E7` surface · ink `#1E2A2A` text. Flat and warm; saffron used sparingly for the primary action.
- **Onboarding:** guest browse → Meta OTP → profile (with the "why" + recognised-surname welcome) → intent CTA hub (Connect / Find / Offer).
- **Unified "Create a Listing" hub** — Business is ONE category among several (Business · Room · Vehicle · PG · Goods · Tour · Service). Rentals are **not** nested under Business; intent drives the category.
- **Verification per listing category:** open (goods/tour/service/expert) · ID-verified L2 (room/vehicle/PG — high-risk hosting) · admin-reviewed (business = the "Gate-2" anti-scam check).
- **Offers vs Requests:** Offers (supply) carry the listing fee; **Requests** (seeker posts — PG Seeker, "looking for a room/ride/tutor") are **free**, demand-side. PG is two-sided (Provider listing + Seeker request).
- **Role fluidity (core principle):** every member is both provider AND seeker — never lock roles. A member holds any mix of offers, requests, and professions at once; "professional" = a state (active promoted listing), not a class. Intent-based UI for all. Onboarding/profile invite everyone to "offer something to the circle". The economy is circular, not one-way.
- **Connect mechanism:** "I'm interested" tap → records a **lead** (provider Lead Inbox + notification) AND fires a **dual WhatsApp nudge** to BOTH parties (seller: "X from city is interested"; buyer: "we passed it to seller") AND offers the buyer a `wa.me` deep link. Deal completes offline.
- **WhatsApp nudges = business-initiated → pre-approved Utility templates + opt-in** (captured at signup → `opt_in_whatsapp`). Distinct from the weekly digest (Marketing templates). Small per-conversation cost, funded by the ₹199. Fire only on real interest events to protect WABA quality. No opt-in → in-app + email fallback.
- **Listing fee promises reach + visibility + delivered leads, NOT sales.** Pre-listing screen shows a *real* reach estimate ("~1,095 Nagars across India/USA/Dubai…"). Keep listings free/token while community is small; ₹199 kicks in once reach justifies it (admin-managed). Never charge a real fee for trivial reach.
- **Receiver nudges:** feed/search, seasonal/festival push, saved alerts ("notify me when X listed"), social proof (reviews/ratings). Provider dashboard shows views · reach · leads.
- **Smart progressive profiling:** branching + consent-first. Profession → specialty (cascading, auto-appears) → status (current/retired/studying) → opt-in expert guidance → opt-in other offers (mentor/other). Retired expertise still counts; studying = mentee candidate. Capabilities stored in `member_capabilities` (non-paid સેવા offers), editable anytime, with later contextual nudges. System matches contribution to need — never ranks people.
- **Education pillar** (SPEC §7.2): Scholarships (offer ↔ apply, FREE — સેવા), Career guidance (reuses member_capabilities + mentorship), Education listings (tutors/coaching/courses = `education` listing category, paid), Student profiles (status=studying recipients).
- **Community Event Announcements** (SPEC §7.3): any member broadcasts a *significant* community event, **no admin pre-approval** (frictionless). Significance guard: event_type required + significance confirmation + per-member rate-limit. **Reactive moderation** (flag + post-hoc removal), not a pre-gate. Notifications respect WhatsApp opt-in + approved templates.
- **Public landing-page "Community Pulse" counters** are the public face of Community Intelligence (aggregate only). Activity metrics use a connector-safe proxy (reviews and/or a "did you connect?" confirmation) and are worded "facilitated", never "booked", because the app never processes a booking. Counters are gated by a per-metric minimum threshold.

---

## Open Decisions (resolve before/at the relevant build step)

1. ~~**Verification method**~~ → **RESOLVED:** *Open membership.* Anyone signs up via Meta WhatsApp OTP and builds a profile — no hard "are you a Nagar" gate. Surname, city, geolocation, gender, age are self-declared **indicators + profile data** (power directory, intelligence, matrimony, discovery). Trust is **earned**, not gated: high-risk actions (hosting a stay, renting a vehicle) require ID verification + reviews. Trust ladder: L0 OTP (browse/profile) → L1 active (inquire/list/participate) → L2 ID-verified (host stay / rent vehicle). Optional "recognised Nagar surname" soft badge — never a gate.
2. ~~**Listing fee** — amount + structure~~ → **RESOLVED:** admin-managed config (example ₹199/30 days), changeable anytime, price/term snapshotted at purchase; renewal via self-renew or admin extend.
3. **Free/paid boundary** — confirm exactly which listing categories are free vs paid.
4. **Geography** — Nagars everywhere, or Gujarat-first then expand?
5. **Phase-1 scope** — confirm the MVP cut in `AGENDA.md` is the right starting line.
6. **Governance** — who are the admins/editors (e.g. the Setusarjan team) and their exact powers?

> If a build step needs one of these and it's unresolved, STOP and ask the founder.
> Implementation details (naming, file structure, library choices) are within Claude Code's authority.

---

## Decision log
*(append dated entries as decisions get made)*

- _YYYY-MM-DD_ — _decision_ — _rationale_
