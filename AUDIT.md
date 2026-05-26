# AUDIT.md — Nagarsetu Build & Security Log

Append an entry whenever a unit of work is completed. Run the security checklist
before any wider release and re-run it after touching auth, data, or payments.

---

## Security checklist (Supabase + Next.js + Expo)

**Data access**
- [ ] RLS enabled on **every** table (no table left open by default)
- [ ] Policies tested: a member cannot read another member's gated contact details
- [ ] Aggregate intelligence exposed via read-only views only (no row leakage)
- [ ] Admin/editor powers gated by role, server-side

**Auth**
- [ ] Phone OTP rate-limited (prevent OTP abuse/enumeration)
- [ ] Session handling correct on web + mobile; no token leakage
- [ ] Role checks enforced server-side, never trusted from client

**Input & endpoints**
- [ ] All inputs validated/sanitised server-side
- [ ] Public/listing/inquiry endpoints rate-limited
- [ ] File uploads (photos) type/size-checked; stored in scoped Storage buckets
- [ ] Cron/scheduler routes protected by `CRON_SECRET` (reject unauthenticated triggers)

**Money (listing fee only)**
- [ ] Payment verified **server-side** against the gateway (never trust client success)
- [ ] No code path moves member-to-member money through the app
- [ ] No commission logic exists anywhere

**Connector integrity**
- [ ] Connector disclaimer present on every transaction-implying surface
- [ ] Availability is soft status only — no hard lock / no booking guarantee in code
- [ ] App does not store or adjudicate member-to-member payment outcomes

**Secrets & config**
- [ ] All secrets in env, none committed
- [ ] Supabase service-role key never shipped to client
- [ ] Claude / gateway / WhatsApp keys server-only

**Localisation**
- [ ] Gujarati glyphs render correctly across app screens
- [ ] Gujarati fonts embedded in the rendered magazine PDF

---

## Build log
*(append newest at top: date — area — what changed — checks run)*

- 2026-05-26 — Feature — Added **Community Event Announcements** (broadcast, no admin pre-approval). SPEC §2 gained `community_events` + `community_event_alerts` tables and added `community_event_id (nullable)` to `reports`. SPEC §7.3 fully fleshed out (publish flow, notification fan-out, lifecycle, reactive moderation, WhatsApp template requirements). AGENDA §7c expanded from 3 placeholder bullets into the full buildable set. MEMORY locked the policy alongside the existing context note. — **Security & connector checks:** rate-limit enforced server-side (count member's announcements in trailing `community_event_rate_limit_days` window; reject at the API, never trust client); `significance_confirmed_at` is required on insert (DB-level NOT NULL); reactive moderation path wired on day 1 (`reports.community_event_id`), not retrofitted; WhatsApp opt-in respected (proactive blasts only to `opt_in_whatsapp = true`; pre-approved Marketing template required before broadcast channel can go live; non-opted members get in-app + email only); connector disclaimer mandatory on every announcement card + notification body (organising body + creator-supplied contact named; Nagarsetu is the bridge, not the organiser); RLS — `community_events` writable only by `created_by` (and admins for moderation); `community_event_alerts` writable only by owning member; Gujarati typesetting discipline applies to title/description rendering.
- 2026-05-26 — Scope — Resolved Open Decision #5 (Phase-1 cut, full): promoted four more Phase 2 items to Phase 1 — Matrimony (AGENDA §3a, SPEC matrimony_profiles + matrimony_interests), Mentorship matching (§3b, mentor_offers + mentee_requests + mentorships), Member blogs (§3c, blogs), Magazine audio + searchable archive (§6a, submission_audio + Postgres FTS). Heritage authorship locked: **member-contributed with admin review** (AGENDA §7, SPEC heritage_articles schema finalised). Phase 2 trimmed to a single deferred item — optional in-app member-to-member payments, explicitly held back to protect Hard Constraint #1 (logged in MEMORY as a re-affirmation; promotion requires an explicit override). — Checks: connector ethos preserved (no money flows added); matrimony has restricted visibility by default (privacy-first); all new features have a connector disclaimer requirement; scope expansion noted — solo-dev Phase 1 just roughly doubled in size, plan accordingly.
- 2026-05-26 — Scope — Re-scoped Open Decision #5 (Phase-1 cut, partial): **Events & heritage modules moved from Phase 2 → Phase 1.** New AGENDA §7 with bullets for events table + RSVPs + feed integration + heritage articles (schema sketched in SPEC §2 Community, full authorship policy TBD before build). Renumbered AGENDA §7-9 → §8-10; updated MEMORY ref to §9 Hardening. Phase 2 list trimmed (events, event_rsvps removed; matrimony/mentorship/blogs/audio-magazine/optional-payments still Phase 2). — Checks: connector disclaimer required on event surfaces; events are member-organised, not Nagarsetu-organised.
- 2026-05-26 — Policy — Partially resolved Open Decision #6 (Governance): user-facing label "Nagarsetu Admins" applies to both Editor and Admin roles everywhere — UI copy, disclaimers, magazine credits, notifications. Schema's `members.role (member|editor|admin)` enum stays for technical routing of magazine vs moderation flows. Specific powers per role + assignment of first humans deferred to launch hardening (added to `AGENDA.md` §8). Gujarati equivalent of label TBD at i18n. — Checks: connector ethos preserved (no escalation of admin power claims); deferral is explicit, not silent.
- 2026-05-26 — Policy — Resolved Open Decision #4 (Geography): global from day one — Nagars everywhere; diaspora is Phase 1, not "expand later". Added `SPEC.md` §1.5 (Geography & diaspora) with examples (Tokyo welcome / Utah PG / Nairobi Masai Mara assistance); added `members.timezone` (IANA) for member-local reminders; updated AGENDA seed-cities task to "global from day one" and ID-verification task to accept any government-issued ID. New Open Decision #7 added: listing fee currency for international Business listings (working assumption: INR globally for Phase 1 via Razorpay international cards). — Checks: connector ethos preserved cross-border (offline deals only); ID-verification scope-creep avoided (still only required for L2 hosting/rentals, not for joining).
- 2026-05-26 — Policy — Resolved Open Decision #3 (Free/paid boundary): only Business listings are paid; every other category (Room/Vehicle/PG/Goods/Tour/Service) and all Requests are free. Free listings get a soft expiry with one-tap refresh (default 60–90 days, admin-configurable). Propagated through `MEMORY.md`, `SPEC.md` (added §7.1a Free listing lifecycle; added `is_paid` to listing_categories), and `AGENDA.md`. — Checks: no schema split (same `listings` table for both lifecycles); pricing/settings flow unchanged for Business; connector philosophy preserved (free for community sharing, paid only for commercial reach).
- 2026-05-26 — Foundations — GitHub repo initialised at github.com/jmbuch19/nagarsetu; all 8 root docs committed (`CLAUDE.md`, `CONCEPT.md`, `SPEC.md`, `AGENDA.md`, `MEMORY.md`, `AUDIT.md`, `DISPUTE.md`, `IDEAS.md`) plus `.env.example` (placeholders only — no real secrets) and `.gitignore`. Supabase CLI installed via Scoop; `supabase init` ran; project linked to ref `wfkeyjukkoktubeqvjch` (Tokyo region) under account `jambuch@gmail.com`. — Checks: verified `.env.example` contains no live credentials before pushing; fixed a `.gitignore` bug where an inline comment on `!.env.example` would have caused the template to be ignored; `supabase/.gitignore` ignores `.temp/` and `.env*.local` so project-ref + local secrets stay out of git.
- _YYYY-MM-DD_ — _area_ — _what was built_ — _security items verified_
