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

- 2026-05-26 — Foundations — GitHub repo initialised at github.com/jmbuch19/nagarsetu; all 8 root docs committed (`CLAUDE.md`, `CONCEPT.md`, `SPEC.md`, `AGENDA.md`, `MEMORY.md`, `AUDIT.md`, `DISPUTE.md`, `IDEAS.md`) plus `.env.example` (placeholders only — no real secrets) and `.gitignore`. Supabase CLI installed via Scoop; `supabase init` ran; project linked to ref `wfkeyjukkoktubeqvjch` (Tokyo region) under account `jambuch@gmail.com`. — Checks: verified `.env.example` contains no live credentials before pushing; fixed a `.gitignore` bug where an inline comment on `!.env.example` would have caused the template to be ignored; `supabase/.gitignore` ignores `.temp/` and `.env*.local` so project-ref + local secrets stay out of git.
- _YYYY-MM-DD_ — _area_ — _what was built_ — _security items verified_
