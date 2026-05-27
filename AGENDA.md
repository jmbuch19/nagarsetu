# AGENDA.md — Nagarsetu Build Board

Work top to bottom. Don't start Phase 2 until Phase 1 is done. Check items off as you go,
and log each completed unit in `AUDIT.md`. Decisions needed → see `MEMORY.md`.

---

## Phase 0 — Foundations
- [ ] Initialise repo; add `CLAUDE.md`, `SPEC.md`, `MEMORY.md`, `AUDIT.md`, `DISPUTE.md`, `IDEAS.md` at root
- [ ] Set up Supabase project; wire env/secrets
- [ ] Set up Next.js (web) and Expo (mobile) shells
- [ ] Confirm the 6 Open Decisions in `MEMORY.md` are resolved (or flag blockers)

## Phase 1 — The Core Loop (MVP)

### 1. Data model (do this first — schema before screens)
- [ ] Lookup tables: cities, sub_communities, professions, specialties, listing_categories, genres
- [ ] Seed lookups (initial cities, Nagar sub-communities, profession/specialty lists, genres)
- [ ] Core: members, member_professions, verifications
- [ ] Trust economy: listings, availability, inquiries, reviews, reports
- [ ] Magazine: magazine_issues, submissions
- [ ] Money: payments (listing fee only)
- [ ] RLS policies on every table
- [ ] Community Intelligence aggregate views

### 2. Auth & identity
- [ ] Meta WhatsApp OTP via Supabase Auth Hook (approved authentication template); sessions in Supabase
- [ ] Sign-up gate = mobile + OTP + consent only (Terms + WhatsApp opt-in); NO profile fields here
- [ ] Profile create/edit — required: name, surname, city, PIN, gender, DOB; optional: email, photo, sub-community, bio (NO home address)
- [ ] Onboarding nudge: "What can you offer the circle?" — invite at least one offer from every member
- [ ] Profile surfaces both sides: what the member offers + what they're seeking
- [ ] member_professions UI (controlled lists only) — cascading profession → specialty (auto-appears), with status (current/retired/studying)
- [ ] Smart progressive profiling: consent-first opt-ins → `member_capabilities` (expert_guidance / mentor / other); editable anytime; "No" re-offered later
- [ ] Encouragement screen BEFORE expertise opt-ins (સેવા framing; promise connection/possibility, never guaranteed outcomes)
- [ ] Continuous flow (basics → encouragement → expertise); "I'll do this later" allowed but re-surfaced contextually
- [ ] Contextual opt-in nudges (e.g. "students seek a mentor in your field")
- [ ] "Recognised Nagar surname" soft badge from a reference surname list (signal only, never a gate)
- [ ] ID verification flow (photo ID) — **only required to host a stay / rent out a vehicle (L2)**; admin reviews; sets trust level

### 3. Directory & Intelligence
- [ ] Landing page: explicit Nagar-belonging line + "why now" mission/soul statement + benefit/why lines + "peep-not-transact" (guests see Pulse + teaser feed + magazine cover; sign-in only to act)
- [ ] Gujarati typography pass: Gujarati sized ≥ English everywhere; mobile glyph QA
- [ ] Guest browse (pre-auth): Community Pulse teaser + sample feed + latest magazine cover
- [ ] Onboarding CTA hub by intent (Connect / Find / Offer) with short descriptions
- [ ] Directory search/filter (profession, specialty, city, sub-community)
- [ ] Permissioned contact reveal
- [ ] Community Intelligence: multi-dimensional drill-down (country → city/PIN → profession → specialty; + job, capability, status, sub-community, age, gender), composable filters, member-list reveal (contact permission-gated). Materialized views.

### 4. Listings + Availability + Inquiry
- [ ] **Unified "Create a Listing" hub** → category picker (business/room/vehicle/pg/goods/tour/service); rentals NOT under business
- [ ] Offer-side persuasion at the Offer entry: Earning · Security · Safety · Service/સેવા (trust+belonging, not price)
- [ ] Category-specific forms (rentals: Day/Week/Month + availability; business/service: full address, hours, service area, contact; room/PG/vehicle: area+city+PIN, exact location shared on connect)
- [ ] Verification routing per category: open / ID-verified (room·vehicle·pg) / admin-reviewed (business)
- [ ] **Requests (seeker side):** PG Seeker + generalised "looking for room/ride/tutor" — free, demand-side
- [ ] Create/edit/pause listing; time-binding per category
- [ ] Admin pricing/settings: listing price + term + expiry policy + self-renew toggle (editable anytime)
- [ ] Listing-fee payment on first publish (server-verified); **snapshot price + term onto the listing/payment**
- [ ] Lifecycle: `published_at` / `expires_at`; expiry job; pre-expiry reminders (~day 25 & 28)
- [ ] Renewal paths: member self-renew (pay current amount) + admin manual extend
- [ ] Indicative availability windows (soft status: available/tentative/blocked)
- [ ] Date-aware inquiry → connect channel (in-app chat or reveal WhatsApp/phone)
- [ ] "I'm interested" → lead capture + provider Lead Inbox + notification
- [ ] Dual WhatsApp nudge on interest (seller + buyer) via approved Utility templates; opt-in checked; in-app notification fallback if no WA opt-in
- [ ] WhatsApp opt-in consent captured at signup
- [ ] "Continue on WhatsApp" `wa.me` deep link with pre-filled message
- [ ] Pre-listing reach estimate ("reaches ~N Nagars across India/USA/Dubai…")
- [ ] Provider dashboard: views · reach · leads
- [ ] Receiver nudges: saved alerts ("notify me when X listed") + targeted/seasonal push
- [ ] Social proof on cards (review count + rating)
- [ ] Connector disclaimer on all transaction-implying surfaces

### 4a. Professional promotion (the paid value)
- [ ] Member opt-in flags (email / WhatsApp)
- [ ] In-app feed prominence + push for active professionals (bulk discovery)
- [ ] Fortnightly (15-day, admin-adjustable) community WhatsApp digest — opt-in, curated per member by interest+city, ONE message per member per cycle (never split), approved Marketing template
- [ ] `promo_sends` + `last_digest_sent_at` to enforce one-per-cycle; pg_cron/Vercel Cron jobs (expire, reminders, fortnightly digest, feed/views refresh)

### 5. The Living Feed
- [ ] Unified feed of active listings; filters by category/city/time-binding
- [ ] Listing cards with trust level + indicative availability
- [ ] Two-way reviews + encouragement surfaced on cards

### 6. Auto-Magazine Engine
- [ ] **Freeze the layout spec** from the Setusarjan Ank-87 DNA (cover, index, per-piece frame, pull-quote box, AV section)
- [ ] Submission flow: in-app text/voice → clean Gujarati; genre auto-tag; pull-quote suggest; જોડણી check; duplicate-guard
- [ ] Editor curation (approve/reject) + issue config (number + date)
- [ ] One-click PDF render against fixed template (Gujarati fonts embedded)
- [ ] Share to in-app + WhatsApp + Facebook

### 7. Moderation & disputes
- [ ] Reports flow (member → admin); actions per `DISPUTE.md`
- [ ] Trust-level impact + listing suspension
- [ ] Reactive moderation for broadcasts (flag + post-hoc removal) + per-member rate-limits

### 7b. Education pillar
- [ ] Scholarships: offer (with criteria) ↔ application flow (free)
- [ ] `education` listing category (tutors/coaching/courses)
- [ ] Career guidance via existing member_capabilities + mentorship matching
- [ ] Surface `status = studying` students as recipients/mentees

### 7c. Community Event Announcements
- [ ] `community_events` create → live (no pre-approval) → feed + notifications
- [ ] Significance guard: event_type + significance confirmation + rate-limit
- [ ] WhatsApp/email notify (opt-in + approved templates only)

### 7d. Donation / Help Drives (admin-verified, connector-only — sensitive)
- [ ] Raise-a-need form (patient/guardian, gap amount, story, document upload, private UPI/bank for admin)
- [ ] Mandatory admin verification gate (approve/reject + notes); verified badge + precise citation
- [ ] Landing-page header CTA "Verified Help Drives"
- [ ] Docs access-gated: visible only after "I want to help" tap (`help_intents`)
- [ ] Payment details ADMIN-ONLY, never public/broadcast; admin relays privately to donor
- [ ] Admin amplification (in-app + WhatsApp + rare email) citing verification
- [ ] Report/flag + admin pull-anytime; connector disclaimer (no funds through app)
- [ ] LEGAL.md page for drives + precise verification-claim disclaimer

### 8. Hardening (before any wider release)
- [ ] Legal/policy pages per `LEGAL.md` (/terms /privacy /refunds /shipping /contact /about /pricing /guidelines /disclaimer /data) + footer & consent CTAs
- [ ] Razorpay activation links verified; Meta privacy + data-deletion + opt-in links verified
- [ ] Email templates per `EMAILS.md` (receipts + OTP fallback ONLY; not a discovery channel)
- [ ] WhatsApp templates registered + approved (Utility: interest/renewal; Marketing: fortnightly digest; Auth: OTP)
- [ ] Security pass per `AUDIT.md` checklist (RLS, validation, rate limits, secrets, payment verification)
- [ ] Gujarati glyph QA across app + rendered PDF
- [ ] Privacy controls + connector disclaimers verified

### 9. Launch polish (data-gated — turn on once there's ample data)
- [ ] Public "Community Pulse" counters on the landing page (state counts: members, doctors, professionals, articles published, listings…)
- [ ] Activity counters via connector-safe proxy (reviews and/or "did you connect?" confirmation) — labelled "facilitated", never "booked"
- [ ] Per-metric threshold guard so low/empty numbers never show
- [ ] Cached/materialized views behind the public page

---

## Phase 2 — Depth (do not build yet)
- [ ] Matrimony
- [ ] Mentorship matching (mentor/mentee)
- [ ] Member blogs
- [ ] Events & heritage modules
- [ ] Magazine audio editions (ElevenLabs) + searchable archive
- [ ] *Optional:* in-app payments as a convenience (still no commission)

> New ideas that arise mid-build → park them in `IDEAS.md`, don't inline them here.
