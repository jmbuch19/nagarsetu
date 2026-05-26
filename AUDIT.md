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

- 2026-05-26 — Policy — Partially resolved Open Decision #6 (Governance): user-facing label "Nagarsetu Admins" applies to both Editor and Admin roles everywhere — UI copy, disclaimers, magazine credits, notifications. Schema's `members.role (member|editor|admin)` enum stays for technical routing of magazine vs moderation flows. Specific powers per role + assignment of first humans deferred to launch hardening (added to `AGENDA.md` §8). Gujarati equivalent of label TBD at i18n. — Checks: connector ethos preserved (no escalation of admin power claims); deferral is explicit, not silent.
- 2026-05-26 — Policy — Resolved Open Decision #4 (Geography): global from day one — Nagars everywhere; diaspora is Phase 1, not "expand later". Added `SPEC.md` §1.5 (Geography & diaspora) with examples (Tokyo welcome / Utah PG / Nairobi Masai Mara assistance); added `members.timezone` (IANA) for member-local reminders; updated AGENDA seed-cities task to "global from day one" and ID-verification task to accept any government-issued ID. New Open Decision #7 added: listing fee currency for international Business listings (working assumption: INR globally for Phase 1 via Razorpay international cards). — Checks: connector ethos preserved cross-border (offline deals only); ID-verification scope-creep avoided (still only required for L2 hosting/rentals, not for joining).
- 2026-05-26 — Policy — Resolved Open Decision #3 (Free/paid boundary): only Business listings are paid; every other category (Room/Vehicle/PG/Goods/Tour/Service) and all Requests are free. Free listings get a soft expiry with one-tap refresh (default 60–90 days, admin-configurable). Propagated through `MEMORY.md`, `SPEC.md` (added §7.1a Free listing lifecycle; added `is_paid` to listing_categories), and `AGENDA.md`. — Checks: no schema split (same `listings` table for both lifecycles); pricing/settings flow unchanged for Business; connector philosophy preserved (free for community sharing, paid only for commercial reach).
- 2026-05-26 — Foundations — GitHub repo initialised at github.com/jmbuch19/nagarsetu; all 8 root docs committed (`CLAUDE.md`, `CONCEPT.md`, `SPEC.md`, `AGENDA.md`, `MEMORY.md`, `AUDIT.md`, `DISPUTE.md`, `IDEAS.md`) plus `.env.example` (placeholders only — no real secrets) and `.gitignore`. Supabase CLI installed via Scoop; `supabase init` ran; project linked to ref `wfkeyjukkoktubeqvjch` (Tokyo region) under account `jambuch@gmail.com`. — Checks: verified `.env.example` contains no live credentials before pushing; fixed a `.gitignore` bug where an inline comment on `!.env.example` would have caused the template to be ignored; `supabase/.gitignore` ignores `.temp/` and `.env*.local` so project-ref + local secrets stay out of git.
- _YYYY-MM-DD_ — _area_ — _what was built_ — _security items verified_
