# MEMORY.md — Nagarsetu Durable Memory

Persistent decisions and context. Claude Code reads this every session.
Add new locked decisions here; move items out of "Open Decisions" once resolved.

---

## Locked decisions

- **Brand:** **Jay Hatkesh** (community salutation to kuldevta Hatkeshwar). **Tagline/subtitle:** Nagarsetu (નાગર + સેતુ = bridge of the community). **Domain:** jayhatkesh.in. Use "Jay Hatkesh" as the product name everywhere; "Nagarsetu" as the descriptive tagline (and for secular/onboarding contexts like Meta/Razorpay/search). Repo folder may remain `nagarsetu` (cosmetic only).
- **Audience:** the Nagar samaj.
- **Ethos:** સેવા · સહકાર · શિસ્ત.
- **Thesis:** a closed-loop community economy — value circulates among Nagars.
- **App is a connector, not a cashier.** Phase 1: no member-to-member money in-app.
- **No commission, ever** on member-to-member transactions.
- **Only in-app money = listing fee** (charged on publishing a commercial listing).
- **Channel strategy (audience = WhatsApp-first; email largely unread):** Email = receipts/OTP only, NOT discovery. In-app feed + push = bulk browsing discovery. WhatsApp = high-signal only: (a) personal "about you now" (lead/reply/renewal, Utility templates, instant) + (b) ONE **fortnightly (15-day, admin-adjustable) community digest** (opt-in, Marketing template). **One message per member per cycle — never split.** Heavy feed → curate to highlights + "see all in app", divide by relevance not by message count. Protecting WhatsApp quality protects the lead pings.
- **Listing fee is admin-managed config**, editable anytime (example: ₹199 / 30 days). Price + term are **snapshotted at purchase** — admin price changes never retroactively affect active listings.
- **Expiry policy (admin-configurable):** auto-expire, OR member self-renew (pay current amount), OR admin manual extend. Pre-expiry reminders ~day 25 & 28.
- **Professional activation perk:** while a paid listing is active, the member is featured in the **fortnightly community WhatsApp digest** + **in-app feed prominence**. Requires member **opt-in** + **approved templates**. Email NOT used (receipts/OTP only).
- **Belonging free, selling paid.** Directory + Community Intelligence free for all members.
- **Open membership.** Anyone can sign up and build a profile; no hard Nagar gate. Nagar identity self-declared via indicators (surname, city, geo, gender, age).
- **Sign-up = tiny.** Login collects ONLY mobile number + OTP + consent (Terms + WhatsApp opt-in). No profile fields at the gate. Profile is a separate, progressive step.
- **Profile fields:** required = full name, surname, city, **PIN code**, gender, DOB. Encouraged/skippable = email (OPTIONAL — receipts/OTP fallback only, NOT discovery), photo, sub-community, bio. Then smart profiling (profession→specialty→status→opt-ins). Fully usable with just a verified phone.
- **Minimal location:** personal profile is **city + PIN only — NO home/full address** (friction + privacy). Address is **listing-level**: business/service listings carry full address/hours/service-area (must be findable); room/PG/vehicle give area+city+PIN, exact location shared member-to-member when they connect, not published.
- **Auth = Meta WhatsApp OTP** via Supabase Auth Hook (approved authentication template); Supabase manages sessions.
- **Trust is earned, not gated at entry.** High-risk actions (hosting a stay, renting a vehicle) require ID verification + reviews via the trust ladder (L0 browse → L1 participate → L2 ID-verified hosting).
- **Availability = coordination aid, not a booking.** No hard locks, no adjudication.
- **App is never a party to disputes** (see `DISPUTE.md`).
- **Gujarati is first-class.** Magazine render must reproduce the Setusarjan look.
- **DPDP compliance mandatory** (India DPDP Act 2023; see `DPDP.md`). Jay Hatkesh = Data Fiduciary. Granular unbundled withdrawable consent (`consents` table); data minimisation (already: city+PIN, optional email, phone login); notice in English + **Gujarati**; Data Principal rights centre at `/data` (access/correct/erase/export/nominate/grievance); **children strict** — `is_minor` from DOB, no behavioural targeting of minors, guardian consent for child help-drive beneficiaries; retention limits (help-drive medical docs purged on closure); processors (Supabase/Razorpay/Meta/Resend) under data terms, prefer Supabase India region; breach response + grievance/DPO contact. Lawyer review before launch (Rules still finalising early 2026).
- **Stack:** Next.js (web, **hosted on Vercel**), Expo/RN (mobile via EAS, Android-first OK), Supabase, phone OTP, Claude API, Razorpay (listing fee only), WhatsApp/FB share. Scheduler via Vercel Cron (protected by `CRON_SECRET`) or Supabase pg_cron.
- **Phasing:** Phase 1 = directory + intelligence + feed + listings/availability + magazine engine + listing-fee payment. Matrimony + audio editions + mentorship → Phase 2.

## Context

- The community already publishes *Setusarjan* (87+ issues), hand-typeset monthly; a volunteer types Gujarati for members who can't. The app automates this labour while preserving the look.
- Submission norms (from the magazine): text only; deadline the 15th; name + city + passport photo; not pre-published on WhatsApp/FB.
- Closing salutation: **જય હાટકેશ**.
- **Color palette** (derived from the Setusarjan cover; full tokens in SPEC §9): peacock teal `#0E6B6B` primary · saffron `#E97C1F` accent · heritage gold `#C9A24B` · ivory `#FBFAF5` bg · soft sage `#EAF1E7` surface · ink `#1E2A2A` text. Flat and warm; saffron used sparingly for the primary action.
- **Onboarding:** guest browse → Meta OTP → profile (with the "why" + recognised-surname welcome) → intent CTA hub (Connect / Find / Offer).
- **Landing page must (first second):** (1) signal Nagar belonging explicitly ("digital home of the Nagar samaj — worldwide"); (1a) a warm **"why now" mission/soul statement** (scattered samaj, elders alone as children move abroad, turning to strangers when a Nagar could help → Jay Hatkesh is the bridge) flowing into the CTA — honest (connection/belonging, never guaranteed outcomes); (2) show WHY/benefits before the gate (find a Nagar doctor/lawyer/mentor; homes/rooms/rides; buy-sell within community; verified help drives); (3) **peep-not-transact** — guests SEE Community Pulse + teaser feed + magazine cover, sign-in only to ACT (no hard gate); (4) **Gujarati sized ≥ English** (first-class, critical for elders), never a subtitle. A bare "Sign in" gate fails all four.
- **Landing mission copy = Option A (warm/rooted), LOCKED:** "Once, our community was a phone call away. Today we're scattered across cities and continents — yet a fellow Nagar's help, trust, and warmth is still the most valuable thing we have. Jay Hatkesh brings the samaj back within reach: to find each other, help each other, and grow together — wherever in the world we are." (Consider a co-equal Gujarati rendering.)
- **Offer-side persuasion (at "Create a Listing"/Offer entry — distinct from the landing join-pitch):** convince members to offer. Four levers: **Earning** (idle room/car/skill earns instead of sitting), **Security** (dealing with a verified Nagar, not a stranger), **Safety** (reviews + community accountability; home/keys go to someone the samaj knows), **Service/સેવા** (helping a fellow Nagar in need). Compete on **trust + belonging, not price** (a Nagar might earn more on a stranger-platform, but gains a trusted guest + goodwill + pride of seva).
- **Unified "Create a Listing" hub** — Business is ONE category among several (Business · Room · Vehicle · PG · Goods · Tour · Service). Rentals are **not** nested under Business; intent drives the category.
- **Verification per listing category:** open (goods/tour/service/expert) · ID-verified L2 (room/vehicle/PG — high-risk hosting) · admin-reviewed (business = the "Gate-2" anti-scam check).
- **Offers vs Requests:** Offers (supply) carry the listing fee; **Requests** (seeker posts — PG Seeker, "looking for a room/ride/tutor") are **free**, demand-side. PG is two-sided (Provider listing + Seeker request).
- **Role fluidity (core principle):** every member is both provider AND seeker — never lock roles. A member holds any mix of offers, requests, and professions at once; "professional" = a state (active promoted listing), not a class. Intent-based UI for all. Onboarding/profile invite everyone to "offer something to the circle". The economy is circular, not one-way.
- **Connect mechanism:** "I'm interested" tap → records a **lead** (provider Lead Inbox + notification) AND fires a **dual WhatsApp nudge** to BOTH parties (seller: "X from city is interested"; buyer: "we passed it to seller") AND offers the buyer a `wa.me` deep link. Deal completes offline.
- **WhatsApp nudges = business-initiated → pre-approved Utility templates + opt-in** (captured at signup → `opt_in_whatsapp`). Distinct from the fortnightly digest (Marketing template). Small per-conversation cost, funded by the ₹199. Fire only on real interest events to protect WABA quality. No opt-in → in-app notification fallback (email largely unread).
- **Listing fee promises reach + visibility + delivered leads, NOT sales.** Pre-listing screen shows a *real* reach estimate ("~1,095 Nagars across India/USA/Dubai…"). Keep listings free/token while community is small; ₹199 kicks in once reach justifies it (admin-managed). Never charge a real fee for trivial reach.
- **Receiver nudges:** feed/search, seasonal/festival push, saved alerts ("notify me when X listed"), social proof (reviews/ratings). Provider dashboard shows views · reach · leads.
- **Smart progressive profiling:** branching + consent-first. Profession → specialty (cascading, auto-appears) → status (current/retired/studying) → opt-in expert guidance → opt-in other offers (mentor/other). Retired expertise still counts; studying = mentee candidate. Capabilities stored in `member_capabilities` (non-paid સેવા offers), editable anytime, with later contextual nudges. System matches contribution to need — never ranks people.
- **Expertise step runs in ONE continuous flow (NOT defer-and-edit)** — deferring kills supply. Place a warm **encouragement screen** BEFORE the expertise opt-ins, framing them as સેવા ("you could be the answer to a Nagar's need"). **Honesty rule:** promise opportunity/possibility of connection, NEVER guaranteed outcomes (connector, not liable). Skippable via "later" but contextually re-surfaced, never forgotten.
- **Education pillar** (SPEC §7.2): Scholarships (offer ↔ apply, FREE — સેવા), Career guidance (reuses member_capabilities + mentorship), Education listings (tutors/coaching/courses = `education` listing category, paid), Student profiles (status=studying recipients).
- **Community Event Announcements** (SPEC §7.3): any member broadcasts a *significant* community event, **no admin pre-approval** (frictionless). Significance guard: event_type required + significance confirmation + per-member rate-limit. **Reactive moderation** (flag + post-hoc removal), not a pre-gate. Notifications respect WhatsApp opt-in + approved templates.
- **Donation/Help Drives** (SPEC §7.4 — most sensitive): admin-VERIFIED (mandatory gate, unlike broadcasts), document-backed, genuine need only (medical/education/other). **Money flows directly donor→family; app never touches/pools/commissions funds** (also keeps clear of fundraising/80G/FCRA — lawyer review needed, NRI donations sharpen this). Landing-page header CTA "Verified Help Drives". **Docs visible only after donor taps "I want to help"** (not public). **Family UPI/bank is ADMIN-ONLY, never public/broadcast — admin relays privately** to donor on request (no clone/account-swap risk). Verification claim = "documents submitted appear legitimate", NOT outcome/usage guarantee. Privacy+dignity: family helped without exposing itself to the whole community.
- **Deceased members** (SPEC §7.5): `account_state = memorialised`. Report → admin **verify** (reversible; false reports are cruel) → freeze: listings/offers/requests auto-deactivated, login off, contact hidden, removed from matching + active counts + intelligence. **Optional "In loving memory" tribute — family chooses** (or quiet close). DPDP: **nominee** decides (memorialise/export/delete); else verified next-of-kin; memorialised is default but **deletable on family request**. **Setusarjan contributions endure** (attributed, "in memory") — account frozen, creative legacy kept. Suppress all automated nudges to family; pause any help drive for the deceased.
- **Community Intelligence = multi-dimensional drill-down ("scoop")** over structured fields (the reason controlled lists are mandatory): country → city/PIN → profession → specialty, plus job/role, **expertise/capability** (member_capabilities), status, sub-community, age-band, gender. Composable filters (e.g. Rajkot + Doctors → 26 → 3 neurophysicians · 6 MDs · 10 GPs; of those, 9 open to second opinions, 4 to mentor). Counts public to members; contact permission-gated; materialized views refreshed on schedule.
- **Public landing-page "Community Pulse" counters** are the public face of Community Intelligence (aggregate only). Activity metrics use a connector-safe proxy (reviews and/or a "did you connect?" confirmation) and are worded "facilitated", never "booked". Counters gated by a per-metric minimum threshold.

---

## Open Decisions (resolve before/at the relevant build step)

1. ~~**Verification method**~~ → **RESOLVED:** *Open membership.* Anyone signs up via Meta WhatsApp OTP and builds a profile — no hard "are you a Nagar" gate. Surname, city, PIN, gender, age are self-declared **indicators + profile data** (power directory, intelligence, matrimony, discovery); personal profile is city + PIN only, no home address. Trust is **earned**, not gated: high-risk actions (hosting a stay, renting a vehicle) require ID verification + reviews. Trust ladder: L0 OTP (browse/profile) → L1 active (inquire/list/participate) → L2 ID-verified (host stay / rent vehicle). Optional "recognised Nagar surname" soft badge — never a gate.
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
