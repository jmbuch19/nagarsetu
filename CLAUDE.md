# CLAUDE.md — Nagarsetu

> Read this file at the start of **every** session. It is the operating manual.
> Then read `MEMORY.md` (durable decisions) and `AGENDA.md` (what to build next).
> When you finish a unit of work, update `AGENDA.md` (check off) and `AUDIT.md` (log it).

---

## What Nagarsetu is

A community platform for the **Nagar samaj**. Name = નાગર (community identity) + સેતુ (bridge).
Ethos: **સેવા · સહકાર · શિસ્ત** (Service · Cooperation · Discipline).

**The thesis:** a closed-loop economy where value circulates *among Nagars* instead of leaking out — knowledge, hospitality, mobility, goods, services, and culture, all flowing through one verified community.

Full functional detail is in `SPEC.md`. Background narrative is in `CONCEPT.md`.

---

## Hard constraints (never violate without an explicit decision logged in MEMORY.md)

1. **The app is a connector, not a cashier.** In Phase 1, no member-to-member money moves through the app. The app introduces members; the deal (rent, ride, mango money) happens offline between them.
2. **No commission, ever.** The app never takes a cut of any member-to-member transaction.
3. **The only money the app handles is the listing fee.** A small fee charged when a member publishes a *commercial* listing. That's it.
4. **Belonging is free; selling carries a fee.** Directory profile + Community Intelligence are free for all members (the data must be complete to be useful). The listing fee applies only at the moment of publishing a commercial offer.
5. **Open membership; trust is earned, not gated at entry.** Anyone can sign up (Meta WhatsApp OTP) and build a profile. Nagar identity is self-declared — surname, city, PIN, gender, age are *indicators and profile data*, never a hard gate. Personal profile asks city + PIN only, never a home address. The high-risk actions (hosting a stay, renting out a vehicle) require identity verification + reputation via the trust ladder; that is where safety is enforced.
6. **Availability is a coordination aid, not a booking.** The app never hard-locks a slot or adjudicates a conflict. See `SPEC.md` §"Availability & Coordination".
7. **The app is never a party to disputes.** See `DISPUTE.md`.
8. **Gujarati is a first-class language.** Content, fonts, and the magazine render must handle Gujarati cleanly. Never ship a layout that breaks Gujarati glyphs.
9. **Roles are fluid — every member is both provider and seeker.** Never lock a member into a provider-only or consumer-only role. The same member may hold any mix of offers, requests, and professions at once (a cardiologist who answers second-opinion requests *and* seeks a PG for his son). "Professional" is a *state* — having an active promoted listing — not a permanent class. UI is **intent-based** (Connect / Find / Offer shown to everyone, always), never role-based. The economy is circular: value flows through every member in all directions, not one-way.

---

## Tech stack

- **Web:** Next.js — **hosted on Vercel**
- **Mobile:** Expo / React Native (Android-first OK for MVP); ships via EAS, **not** Vercel
- **Backend + DB:** Supabase (Postgres, Auth, Storage, RLS)
- **Auth:** Meta WhatsApp OTP, delivered via a Supabase Auth Hook (approved *authentication* template); Supabase manages sessions
- **AI layer:** Claude API — Gujarati typesetting help, magazine genre tagging + pull-quote suggestion + spelling (જોડણી) check, mentorship/second-opinion routing, archive search
- **Magazine render:** server-side PDF generation against a fixed template
- **Distribution:** WhatsApp + Facebook share
- **Payments (listing fee ONLY):** standard gateway (e.g. Razorpay)
- **Scheduler:** Vercel Cron (protected API routes via `CRON_SECRET`) **or** Supabase pg_cron + Edge Functions — for expiry, reminders, and the weekly email/WhatsApp batches

---

## How to work in this repo

- **Schema before screens.** The structured data model is the foundation for the directory, Community Intelligence, listings, and the feed all at once. Get tables + controlled-list lookups + RLS right before building UI.
- **One slice at a time.** Follow `AGENDA.md` top to bottom. Don't jump ahead into Phase 2.
- **Build against decisions, not guesses.** If a needed decision is missing, check `MEMORY.md` → "Open Decisions". If still unresolved, STOP and ask the founder; do not silently invent product policy. Implementation details (naming, structure) you may decide yourself — that's your authority.
- **Controlled lists, not free text.** Profession, specialty, city, sub-community, genre, listing category must come from lookup tables/enums so Community Intelligence can aggregate them.
- **Security is not optional.** RLS on every table, input validation, secrets in env, rate-limit public endpoints, listing-fee payment verified server-side. Track it in `AUDIT.md`.
- **Keep the connector disclaimers present** anywhere a transaction could be implied (stay, mobility, goods, tours).

## Session ritual

1. Read `CLAUDE.md`, `MEMORY.md`, `AGENDA.md`.
2. Pick the next unchecked task in `AGENDA.md`.
3. Build it.
4. Check it off in `AGENDA.md`; log what changed + any security checks in `AUDIT.md`.
5. Record any new durable decision in `MEMORY.md`. Park any out-of-scope idea in `IDEAS.md`.

---

## Document map

| File | Purpose |
|---|---|
| `CLAUDE.md` | This file. Operating manual + constraints. |
| `CONCEPT.md` | The vision narrative (the "why"). |
| `SPEC.md` | Source of truth: features, data model, flows. |
| `AGENDA.md` | The phased build board (the "what next"). |
| `MEMORY.md` | Durable decisions + open decisions. Persists across sessions. |
| `AUDIT.md` | Running build + security log. |
| `DISPUTE.md` | Member-dispute handling (connector-safe). |
| `LEGAL.md` | Required legal/policy pages, footer/consent CTAs, Meta + Razorpay link checklists. |
| `EMAILS.md` | Email templates (transactional + digest) + WhatsApp template parity. |
| `IDEAS.md` | Parking lot for deferred ideas. |
