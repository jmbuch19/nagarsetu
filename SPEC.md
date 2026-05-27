# SPEC.md — Jay Hatkesh (Nagarsetu) Functional & Technical Spec

Source of truth for *what* to build. Constraints live in `CLAUDE.md`. Roadmap in `AGENDA.md`.

---

## 1. Roles

- **Member** — anyone who signs up (open; Meta WhatsApp OTP). Nagar identity is self-declared. Can build a profile, browse the directory + intelligence, post in the feed, publish listings (with fee), submit to the magazine, inquire on listings. High-risk hosting (stay/vehicle) requires ID verification.
- **Editor** — manages the magazine (curate submissions, render, publish). E.g. the Setusarjan team.
- **Admin** — verification, moderation, reports/disputes, listing oversight, issue config.

---

## 2. Data Model (Phase 1 first cut)

> All tables get `id uuid pk`, `created_at`, `updated_at`. RLS on every table.
> Controlled-list tables exist so Community Intelligence can aggregate reliably.

### Controlled lists (lookups)
- **cities** — `name, state, country`
- **sub_communities** — `name` (Nagar sub-groups, e.g. Vadnagara, Visnagara, Sathodara…)
- **professions** — `name`
- **specialties** — `profession_id → professions, name`
- **listing_categories** — `name, time_binding` (`business | room | vehicle | pg | goods | tour | service | expert | education`)
  - **Verification per category:** *open* (any member) for goods/tour/service/expert · *ID-verified L2* for room/vehicle/pg (high-risk hosting) · *admin-reviewed* for business (the "Gate-2" quality/anti-scam check before publish).
  - All **offers** (supply listings) carry the listing fee; **requests** (below) are free.
- **genres** — `name` (magazine: લેખ, ચિંતન, લઘુવાર્તા, કવિતા, ગઝલ, ગીત, અછાંદસ, ગરબો, બાળગીત, હાસ્ય)

### Core
- **members** — `full_name, surname, phone (unique), email (optional), city_id, pincode, sub_community_id, gender, date_of_birth, photo_url, bio, role (member|editor|admin), trust_level (0–3), id_verification (none|pending|verified), recognised_surname bool, opt_in_email bool, opt_in_whatsapp bool`
  - Membership is **open** (OTP only). `surname / city / pincode / gender / date_of_birth` are self-declared indicators + profile data (power directory, intelligence, matrimony, PIN-level nearby discovery).
  - **No full/home address on the personal profile** — city + PIN only (lower friction, better privacy). Exact address, if ever needed, lives on a *listing*, not the person.
  - **`email` is optional** — used for the weekly Email digest, renewal reminders, and listing-fee receipts. Members without email ride on WhatsApp + in-app; never block on it.
  - `id_verification = verified` is required to **host a stay or rent out a vehicle** (Level 2) — not to join.
  - `recognised_surname` is an optional soft badge from a reference list of common Nagar surnames; a warm signal only, never a gate.
- **member_professions** — `member_id, profession_id, specialty_id, years_experience, status (current|retired|studying), is_verified bool` — *retired and studying still count*: retired expertise is surfaced as a resource; `studying` marks an aspiring member (a mentee candidate).
- **member_capabilities** — `member_id, kind (expert_guidance|mentor|other), domain, description, is_offered bool` — non-paid community offers (સેવા): willingness to give guidance, mentor aspirants, or other help. **Consent-first, editable anytime.** Feeds Community Intelligence ("38 doctors open to second opinions"), discovery, and mentorship matching.
- **verifications** — `member_id, method (referral|document|vouch), voucher_member_id, status, reviewed_by, notes`

### Trust economy
- **listings** — `member_id, category_id, title, description, time_binding, price_text (free text — money is offline), location_city_id, pincode, area_text, address (listing-level, optional), service_area, hours, contact_whatsapp, contact_phone, view_count, fee_paid bool, status (draft|active|paused|expired)`
  - **Address is listing-level, scoped to what the listing needs:** business/service listings provide full address, hours, contact, service area (they must be findable). Room/PG/vehicle give area + city + PIN to be useful; exact location is shared member-to-member once they're talking — not published by default.
- **availability** — `listing_id, start_date, end_date, status (available|tentative|blocked)` — *indicative only*
- **inquiries** — `listing_id, seeker_id, requested_start, requested_end, requested_qty, message, channel (in_app|whatsapp|phone), status (open|connected|closed)` — *an inquiry is the seeker's expression of interest and the provider's **lead**; the provider's Lead Inbox is their inquiries.*
- **saved_alerts** — `member_id, category_id, city_id, keyword` — "notify me when X is listed" (receiver-side nudge).
- **reviews** — `listing_id (nullable), author_id, subject_id, rating (1–5), body` — two-way
- **reports** — `reporter_id, subject_member_id, listing_id (nullable), reason, details, status (open|reviewing|actioned|dismissed), action_taken` — see `DISPUTE.md`
- **requests** — *demand / "wanted" posts (the seeker side, e.g. PG Seeker)* — `member_id, category_id, area_text, city_id, budget_text, needed_from, needed_to, gender_pref, food_pref, details, status (open|fulfilled|closed)`. **Free** (no listing fee); providers browse and reach out. Generalises to "looking for a room/ride/tutor".

### Magazine
- **magazine_issues** — `issue_number, publish_date, status (open|curating|rendered|published), rendered_pdf_url`
- **submissions** — `issue_id, author_id, genre_id, title, body, image_url, city_text, pull_quote, status (submitted|approved|rejected)`

### Money (listing fee ONLY)
- **payments** — `member_id, listing_id, amount, currency, gateway_ref, status` — never used for member-to-member transactions

### Phase 2 (define later, do not build yet)
`matrimony_profiles`, `mentorships (mentor_id, mentee_id, domain, status)`, `blogs`, `events`, `event_rsvps`

---

## 3. Community Intelligence

Aggregate views (SQL views / materialized views) over structured fields — **this is why controlled
lists, not free text, were mandatory.** "Doctor / Dr. / M.D." typed freely could never roll up;
`profession_id` + `specialty_id` can.

**Multi-dimensional drill-down (the "scoop").** Members slice the community along any combination of:
- **country** → **city** (and PIN) → **profession** → **specialty**
- **job / role**, **expertise/capability** (from `member_capabilities`), **status** (current/retired/studying), **sub-community**, **age-band**, **gender**

**Drill-down example (the target behaviour):**
> India → **Rajkot** → **Doctors (26)** → 3 neurophysicians · 6 MDs · 10 GPs · …
> …and of those 26: **9 open to second opinions**, **4 willing to mentor** (capability layer).

Each level shows a **count** and expands to the next; any node can reveal the member list
(contact still permission-gated). The capability layer makes it *actionable* — not just "who exists"
but "who is reachable for help".

**Implementation:** read-only aggregate views over `members ⋈ member_professions ⋈ member_capabilities ⋈
lookups`, grouped by the dimensions above; filterable/composable (e.g. country=USA + profession=Lawyer;
city=Rajkot + capability=mentor). Materialize + refresh on a schedule as counts grow.

**Rules:** aggregate counts visible to members; **individual contact details permission-gated**; verified
badge distinguishes self-declared from confirmed; respect `status` (retired/current/studying) so counts
are honest.

### 3.1 Public landing-page stats ("Community Pulse")

The public face of the intelligence layer — headline counters on the landing page that
showcase the community's vitality and pull newcomers in. **Aggregate only** (no individual
data), so it's safe to show publicly.

**Two kinds of metric, two data sources:**

- **State counts** (direct, from existing aggregate views): Total Members · Total Doctors ·
  Total Professionals (by category) · Total Cities Represented · Total Businesses Listed ·
  Total Rooms/Vehicles Listed · Articles Published (approved `submissions` across issues).
- **Activity counts** (the app is a connector and never processes a booking, so use an
  observable proxy event — **never** infer money):
  - *Reviews-as-proxy:* "stays facilitated" ≈ count of stay-category reviews; "rides
    facilitated" ≈ vehicle-category reviews.
  - *or* a one-tap **"did you connect?"** confirmation after an inquiry, recording that a
    connection bore fruit (not the money).

**Wording:** prefer **"stays facilitated" / "connections made"** over "rooms booked" — accurate
to the connector model and safer (the app facilitated the meeting; it did not book anything).

**Threshold guard:** a counter only goes live once it crosses a minimum (config per metric), so
the landing page never shows embarrassing low/empty numbers. Show curated metrics only until
there's "ample data". Back these with cached/materialized views — the landing page is public
and hot.

---

## 4. Availability & Coordination (connector-safe)

The single most important non-obvious design. The app helps two members find each other for a time-bound resource **without booking or holding money**.

| Time-binding | Examples | Coordination field |
|---|---|---|
| `date_range` | room, vehicle | availability windows |
| `slot` | second opinion, tutoring | a requested time slot |
| `departure` | tour, event | fixed dates + seats remaining |
| `inventory` | mangoes, goods | quantity + season window |
| `always` | business, service | none |

**Flow:**
1. Owner marks **indicative** availability windows (not a hard ledger).
2. Seeker submits a **date-aware inquiry** ("need the room June 12–15"); the dates ride along with the message.
3. App opens a **channel** — in-app chat, or reveals WhatsApp/phone — so the two confirm directly.
4. Owner may mark a window **tentative/blocked** so others stop inquiring (soft status, not a lock).
5. **Conflict rule:** first to confirm offline wins; owner updates the calendar. The app never adjudicates or guarantees.

The app's job ends at *"you two have found each other and know each other's availability."*

---

## 5. The Living Feed

One running stream of everything on offer: goods, stays, rides, tours, guidance, services. Drives the loop:

> see → inquire → (agree & pay offline) → participate → share experience → encourage → someone else sees

- Filterable by category, city, time-binding.
- Each card: title, category, member (+ trust level), city, indicative availability, price text, "Inquire" / "Connect".
- Reviews + encouragement surface on cards (social proof is the fuel).

---

## 6. The Auto-Magazine Engine

Digitises *Setusarjan* (87+ issues, currently hand-typeset). Two flows.

**Submission (member):** type in-app or submit by voice → clean Gujarati set automatically → Claude auto-classifies genre, suggests a pull-quote, runs a gentle જોડણી check → duplicate-guard enforces "not pre-published on WhatsApp/FB".

**Render & distribute (editor):** approved submissions flow into a **fixed template** → editor sets issue number + date → **render once** → polished PDF → share in-app + WhatsApp + Facebook.

**Template DNA (must reproduce, from Ank-87):** themed cover (નાગર સેતુ masthead, globe-and-handshake emblem, motto, અંક + date); editorial/acknowledgements page; submission-rules page; અનુક્રમણિકા with author/city/page; per-piece frame with title, ➢ author, (city), passport photo top-right, body, coloured **pull-quote box**; genre tags; દૃશ્ય શ્રાવ્ય વિભાગ (audio-visual section) with clickable thumbnails; close on જય હાટકેશ.

**Extensions (Phase 2):** ElevenLabs audio editions into the AV section; searchable archive of all issues.

> Treat the render as its own focused build. Freeze the layout spec first. Gujarati font embedding is mandatory.

---

## 7. Other Phase-1 surfaces

- **Directory** — search/filter members by profession, specialty, city, sub-community.
- **Profile** — member detail with permissioned contact reveal.
- **Listings management** — create/edit/pause; fee charged on first publish of a commercial listing.
- **Verification** — submit for verification; admin reviews; trust level set.

## 7.04 Smart progressive profiling

A consent-first, branching profiling flow — not a flat form. It captures *what each member can offer
the circle* at entry, and keeps growing over time.

**Branching flow:**
1. **Profession** (dropdown, controlled list).
2. **Specialty** — a cascading field that *auto-appears based on profession* (e.g. Doctor → Cardiology).
3. **Status** — current / retired / studying. Retired expertise still counts; `studying` = aspiring (mentee candidate).
4. **Consent — expert guidance:** "Open to guiding fellow Nagars in your field?" → Yes writes `member_capabilities(expert_guidance, domain=specialty)`; No is respected and re-offered later.
5. **Beyond expertise:** "Can you offer anything more?" → Yes → `member_capabilities(mentor|other, …)` (e.g. "mentor aspiring Nagar doctors"); No → move on.
6. **Registered** — minimal and warm.

**Progressive + consent-first:** nothing is forced. Every offer is an opt-in the member controls and
can edit anytime. The system **nudges contextually later** ("3 students seek a medical mentor — open
to it now?"). A member who said No today can opt in next month.

**Do the expertise step in ONE continuous flow — do not defer it.** "Submit first, edit later" kills the
supply side: members rarely return to edit, so a deferred opt-in leaves most invisible as resources.
Keep profiling continuous (basics → encouragement → expertise opt-ins) while motivation is high.

**Encouragement screen — placed BEFORE the expertise opt-ins as the motivating moment (not a dry label):**
frame the questions as an act of સેવા, e.g. *"This is where Nagarsetu comes alive. Somewhere a Nagar
student is anxious about a choice you've mastered; a family is frightened by a medical report you could
explain; someone needs a professional they can trust. By sharing what you know, you could be the answer
to a fellow Nagar's need. It takes two minutes — and you control everything, editable anytime."*

**Honesty rule (protects the moat):** promise the **opportunity to help / possibility of connection**,
never a guaranteed **outcome**. The app is a connector — it cannot guarantee a diagnosis, a legal win, or
a solved problem. Never imply guaranteed results (avoids implied liability per DISPUTE.md; preserves trust).
Full emotional pull ("you could be someone's answer") with an honest claim.

**Skippable but not invisible:** a soft "I'll do this later" is allowed, but skipping triggers contextual
re-surfacing later. Default is do-it-now via encouragement; nobody is trapped; skippers are followed up.

**Value recognition (contribution, not rank):** the system reads the profession (current *or* past) to
suggest *how this person can contribute* and match it to who needs it — a retired principal → guiding
Class-12 students; a cardiologist → a worried family. It connects value; it does not rank people.
Aspiring members (status = studying) are captured as mentees and matched to mentors.

## 7.05 Onboarding & information architecture

**Guest browse (pre-auth):** show Community Pulse counters, a teaser feed, and the latest magazine
cover before sign-up. Acting (inquire, list, contact, message) prompts sign-up.

**Flow:**
1. **Welcome** — જય હાટકેશ + સેવા · સહકાર · શિસ્ત + emblem.
2. **Sign up (keep tiny)** — Meta WhatsApp OTP. Collect ONLY: **mobile number** (WhatsApp number = unique account key), **OTP**, and **consent** (Terms + WhatsApp opt-in line). No name/profile fields at this gate.
3. **Profile + the "why"** — explain that a complete profile strengthens the samaj. Field tiers:
   - **Required:** full name + surname (triggers recognised-Nagar badge), city, **PIN code**, gender, date of birth.
   - **Encouraged / skippable:** email *(optional — for weekly digest, reminders, receipts)*, photo, sub-community, bio. *(No home/full address — city + PIN only.)*
   - Then the smart branching profiling (§7.04): profession → specialty → status → consent opt-ins.
   - A member is fully signed in with just a verified phone; profile can be completed/enriched anytime.
4. **CTA hub — "What would you like to do?"** organised by intent (scales as features grow):
   - **Connect:** Browse Members · Matrimony · Find a Mentor
   - **Find:** Find a Room/PG · Find a Ride · Seek Guidance · Buy from Nagars · Jobs
   - **Offer / Earn:** the unified "Create a Listing" hub (below)

**Create a Listing (unified):** one entry point → pick a category (Business · Room · Vehicle · PG ·
Goods · Tour · Service) → category-specific form (rentals include Day/Week/Month + availability) →
verification per category (open / ID-verified / admin) → listing fee → publish. **Rentals are NOT
nested under "Business"** — Business is one category among several; the member's intent drives the
choice, not a business framing.

**Offers vs Requests:** supply listings are **Offers** (carry the fee); seeker posts (PG Seeker,
"looking for a room/ride/tutor") are **Requests** (free, demand-side).

**Empty-state:** early on, lead with Community Pulse + "be the first to list"; respect the per-metric
threshold guard. Nudge profile completion after the first action.

**Role fluidity (core):** every member is both provider and seeker — never bucket users into
provider-only/consumer-only. A member may hold any mix of offers, requests, and professions at once;
"professional" is a state (an active promoted listing), not a class. The intent hub is shown to
everyone, always. The profile surfaces both sides — what a member *offers* and what they're *seeking*.

**"What can you offer the circle?"** — onboarding (and the profile) gently invite every member to add
at least one offer, even a small one (e.g. "15 min of career guidance to a Nagar student"). This is
how the supply side fills from *everyone*, not just obvious professionals — the circle actually closing.

## 7.06 Connection, leads & the value of a listing

**Connect mechanism (universal, all categories):**
1. Interested member taps **"I'm interested"** + a quick line (qty / dates / question).
2. This (a) records a **lead** → in-app notification + provider's **Lead Inbox**, (b) fires a **dual WhatsApp nudge** (below), and (c) offers the buyer a one-tap **"Continue on WhatsApp"** (`wa.me` deep link, pre-filled — user-initiated, no template needed).
3. Price, payment, delivery/pickup happen **offline** (connector). Either party can review afterward.

**Dual WhatsApp nudge on every interest event (the heart of lead delivery):**
- **→ Seller:** "Interest on your listing! {{buyer_name}} from {{city}} wants {{listing_title}}. Tap to talk: {{link}}"
- **→ Buyer:** "We've shared your interest in {{listing_title}} with {{seller_name}}. Message them now: {{link}}"
- Both are **business-initiated → require pre-approved Utility templates** (each message concerns an interaction the recipient is party to → easier approval, cheaper, exempt from marketing limits). Separate from the weekly digest, which uses Marketing templates.
- **Opt-in required**, captured at signup ("Nagarsetu will WhatsApp you about interest in your listings and your inquiries") → `members.opt_in_whatsapp`. No opt-in → fall back to in-app + email.
- **Cost:** a small per-conversation fee, **funded by the ₹199** (delivered WA leads are the value). Fire only on genuine interest events (never blasts) to protect the WABA quality rating.

**Provider gets leads via:** Living Feed placement + targeted push (category/city interest + relevant diaspora) + the weekly Email/WhatsApp digest. The provider sees a **Lead Inbox** + a dashboard (**views · reach · leads**) so accumulating interest is visible — the assurance made tangible.

**Receiver nudges:** discovery (feed/search/category) · timely seasonal/festival pushes ("mango season — Nagars near you are selling") · **saved alerts** ("notify me when pickles are listed") · social proof (review counts + ratings on cards).

**What the listing fee promises (honesty protects the moat):**
- **Promise (controllable):** reach + visibility + delivered leads. The **pre-listing screen shows a real reach estimate** — e.g. *"reaches ~1,095 Nagars across India, USA & Dubai, appears in this week's e-magazine digest, notifies your category."*
- **Do NOT promise sales** — that's member-to-member; the app is a connector.
- **Tie the fee to real reach:** keep listings free/token while the community is small; ₹199 kicks in once reach genuinely justifies it (admin-managed). Never charge a meaningful fee to reach a trivial audience.

## 7.1 Listings: pricing, lifecycle & professional perks

**Pricing (admin-managed):**
- Listing price and term are **config, editable by admin anytime** (e.g. ₹199 / 30 days) via an admin settings screen. Store in a `settings`/`pricing` table — never hard-code.
- **Price snapshot at purchase:** the amount + term paid are locked onto the listing/payment at purchase. Later admin price changes do **not** retroactively affect already-active listings (same discipline as the per-invoice forex lock).

**Lifecycle:**
- A paid listing is active for its term: `published_at`, `expires_at = published_at + term_days_paid`.
- **On expiry — admin-configurable policy:**
  - auto-expire (hide/delete), **or**
  - **member self-renew** — pays the *current* designated amount → `expires_at` extended by the term, **or**
  - **admin manual extend** — sets `expires_at` (e.g. against an offline payment), with or without an in-app charge.
- **Pre-expiry reminders** (~day 25 & 28) prompting renewal so listings don't lapse silently.

**Professional activation perks (the value behind the fee):**
- *"Professional" = any member with an active paid listing* (a consultant, a business, a PG provider, a seller) — a state, not a class.
- While a listing is **active**, the member is featured **weekly** in:
  - the **community Email** digest, and
  - the **WhatsApp** broadcast.
- Cadence: weekly, for the full activation duration. Track each send.
- **Compliance (mandatory):** proactive WhatsApp requires **approved message templates** + member **opt-in**; email requires unsubscribe. Respect both; record opt-in state per member.

**Scheduler (Vercel Cron on protected routes, or Supabase pg_cron) — four jobs:**
1. Expire listings past `expires_at` per policy.
2. Send pre-expiry renewal reminders.
3. Assemble + send the **weekly Email** batch (active professionals).
4. Assemble + send the **weekly WhatsApp** batch (opted-in, approved templates).

**Data additions:**
- `pricing` / `settings` — `listing_price, currency, term_days, expiry_policy (auto|self_renew|admin), self_renew_enabled`
- `listings` gains — `published_at, expires_at, price_paid, term_days_paid`
- `promo_sends` — `listing_id, channel (email|whatsapp), sent_at, status` (audit of weekly features)


---

## 7.2 Education pillar

Education is a full pillar (not one field), with two-sided flows. Recipients are naturally the
`status = studying` members captured in profiling.

- **Scholarships** — a member/trust **offers** a scholarship with criteria; eligible families **apply**.
  - `scholarships` — `offered_by_member_id, title, description, criteria (course, merit, income_cap, city_id, gender, other), amount_text, deadline, contact, status (open|closed)`
  - `scholarship_applications` — `scholarship_id, applicant_member_id, student_name, details, status (submitted|shortlisted|awarded|rejected)`
  - Offering a scholarship is **free** (it's સેવા, not selling). Applications are free.
- **Career guidance** — counselling, college admissions, study-abroad help. Reuses `member_capabilities` (expert_guidance / mentor) + mentorship matching; no new mechanism.
- **Education listings** — tutors, coaching, courses → a **listing category** (`education`) under the unified Create-a-Listing hub (carries the listing fee like other offers).
- **Student profiles** — `status = studying` members are the recipients/mentees; surface them for scholarships, mentorship, and guidance.

## 7.3 Community Event Announcements (broadcast, no pre-approval)

Any member can announce a **significant** Nagar community event (religious or otherwise) that
broadcasts to the member base. **No admin approval before publishing** (frictionless), guarded by
significance rules + reactive moderation instead of a pre-gate.

- `community_events` — `created_by, title, description, event_type (annual_gathering|ritual|medical_camp|religious|cultural|other), organising_body, city_id, venue, start_datetime, end_datetime, contact_member_id, contact_whatsapp, cover_image_url, status (active|past|cancelled)`
- **Publish flow:** member creates → goes live immediately → added to Living Feed + relevant notifications (city + diaspora + interest; WhatsApp only with opt-in + approved template).
- **Significance guard (no admin gate):** event_type required · a "this is a significant community-wide event" confirmation · per-member rate-limit on announcements.
- **Reactive moderation:** existing report/flag path applies; admin can remove **post-hoc**. Not pre-approval.

- **Privacy:** contact details permission-gated; aggregate-only intelligence; clear data controls. **Minimal location** — personal profile is city + PIN only (no home address). Exact address lives on a listing, scoped to that listing, and precise location for room/PG/vehicle is shared member-to-member, not published.
- **i18n:** Gujarati + English; never break Gujarati glyphs; magazine fonts embedded in PDF.
- **Security:** RLS everywhere; server-side payment verification (listing fee); rate-limit public/auth endpoints; secrets in env. Track in `AUDIT.md`.
- **Connector disclaimers:** present on every transaction-implying surface (stay, mobility, goods, tours). See `DISPUTE.md`.
- **Performance:** intelligence views materialized + refreshed on a schedule if counts grow large.

---

## 9. Design language

Palette derived from the *Setusarjan* magazine cover, so the app feels like its digital home.

| Token | Hex | Use |
|---|---|---|
| `--brand-primary` | `#0E6B6B` | Peacock teal — primary brand, headers, links (the "bridge") |
| `--brand-primary-dark` | `#0A4F4F` | Deep teal — pressed states, dark surfaces |
| `--brand-accent` | `#E97C1F` | Saffron marigold — CTAs, key actions (from the motto boxes) |
| `--brand-gold` | `#C9A24B` | Heritage gold — badges, magazine, premium accents (the halo) |
| `--bg` | `#FBFAF5` | Ivory — app background |
| `--surface` | `#EAF1E7` | Soft sage — cards, surfaces |
| `--text` | `#1E2A2A` | Ink — primary text |
| `--text-muted` | `#5B6B6B` | Slate — secondary text |
| `--border` | `#DCE6DD` | Hairline borders |
| `--success` | `#2E7D52` | Confirmations, verified |
| `--warning` | `#D99100` | Expiry reminders, cautions |
| `--danger` | `#C2492E` | Errors, disputes, suspensions |

**Principles:** flat and warm, not flashy; teal leads, saffron punctuates (use sparingly for the
one primary action per screen); gold reserved for heritage/badge moments; generous ivory/sage
space. Provide a dark theme later (Phase 2). Fonts: a clean sans for UI; the magazine render
keeps its own Gujarati display fonts.
