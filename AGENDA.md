# AGENDA.md — Nagarsetu Build Board

Work top to bottom. Don't start Phase 2 until Phase 1 is done. Check items off as you go,
and log each completed unit in `AUDIT.md`. Decisions needed → see `MEMORY.md`.

---

## Phase 0 — Foundations
- [x] Initialise repo; add `CLAUDE.md`, `SPEC.md`, `MEMORY.md`, `AUDIT.md`, `DISPUTE.md`, `IDEAS.md` at root
- [x] Set up Supabase project; wire env/secrets
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
- [ ] Open sign-up + member profile create/edit (name, surname, city, sub-community, geolocation, gender, DOB, photo, bio)
- [ ] Onboarding nudge: "What can you offer the circle?" — invite at least one offer from every member
- [ ] Profile surfaces both sides: what the member offers + what they're seeking
- [ ] member_professions UI (controlled lists only) — cascading profession → specialty (auto-appears), with status (current/retired/studying)
- [ ] Smart progressive profiling: consent-first opt-ins → `member_capabilities` (expert_guidance / mentor / other); editable anytime; "No" re-offered later
- [ ] Contextual opt-in nudges (e.g. "students seek a mentor in your field")
- [ ] "Recognised Nagar surname" soft badge from a reference surname list (signal only, never a gate)
- [ ] ID verification flow (photo ID) — **only required to host a stay / rent out a vehicle (L2)**; admin reviews; sets trust level

### 3. Directory & Intelligence
- [ ] Guest browse (pre-auth): Community Pulse teaser + sample feed + latest magazine cover
- [ ] Onboarding CTA hub by intent (Connect / Find / Offer) with short descriptions
- [ ] Directory search/filter (profession, specialty, city, sub-community)
- [ ] Permissioned contact reveal
- [ ] Community Intelligence dashboard ("347 doctors… 41 cardiologists… city-wise")

### 4. Listings + Availability + Inquiry
- [ ] **Unified "Create a Listing" hub** → category picker (business/room/vehicle/pg/goods/tour/service); rentals NOT under business
- [ ] Category-specific forms (rentals: Day/Week/Month + availability)
- [ ] Verification routing per category: open / ID-verified (room·vehicle·pg) / admin-reviewed (business)
- [ ] **Requests (seeker side):** PG Seeker + generalised "looking for room/ride/tutor" — free, demand-side
- [ ] Create/edit/pause listing; time-binding per category
- [ ] Admin pricing/settings: listing price + term + expiry policy + self-renew toggle (Business); `free_default_days` for non-Business; all editable anytime
- [ ] **Business only:** Listing-fee payment on first publish (server-verified); **snapshot price + term onto the listing/payment**
- [ ] Lifecycle: `published_at` / `expires_at`; expiry jobs; pre-expiry reminders — **Business: ~day 25 & 28 (paid renewal); Free: ~day -7 & -2 (one-tap refresh)**
- [ ] Renewal paths: **Business** — member self-renew (pay current amount) + admin manual extend; **Free** — one-tap free refresh (no payment)
- [ ] Indicative availability windows (soft status: available/tentative/blocked)
- [ ] Date-aware inquiry → connect channel (in-app chat or reveal WhatsApp/phone)
- [ ] "I'm interested" → lead capture + provider Lead Inbox + notification
- [ ] Dual WhatsApp nudge on interest (seller + buyer) via approved Utility templates; opt-in checked; in-app+email fallback
- [ ] WhatsApp opt-in consent captured at signup
- [ ] "Continue on WhatsApp" `wa.me` deep link with pre-filled message
- [ ] Pre-listing reach estimate ("reaches ~N Nagars across India/USA/Dubai…")
- [ ] Provider dashboard: views · reach · leads
- [ ] Receiver nudges: saved alerts ("notify me when X listed") + targeted/seasonal push
- [ ] Social proof on cards (review count + rating)
- [ ] Connector disclaimer on all transaction-implying surfaces

### 4a. Professional promotion (the paid value)
- [ ] Member opt-in flags (email / WhatsApp)
- [ ] Weekly Email digest of active professionals
- [ ] Weekly WhatsApp broadcast (approved templates, opted-in members only)
- [ ] `promo_sends` tracking + pg_cron jobs (expire, reminders, weekly email, weekly WhatsApp)

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

### 8. Hardening (before any wider release)
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
