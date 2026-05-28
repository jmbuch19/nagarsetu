# DPDP.md — Data Protection Compliance (India DPDP Act, 2023)

How Jay Hatkesh complies with India's **Digital Personal Data Protection Act, 2023**. Build to this.
Cross-references: `LEGAL.md` (public pages), `SPEC.md` (data model), `AUDIT.md` (security), `DISPUTE.md`.

> **Not legal advice.** DPDP subordinate Rules were still finalising as of early 2026 — confirm exact
> timelines, Data Protection Board procedures, and child-consent mechanics with an Indian
> data-protection lawyer before launch. This is a build-ready framework, not a legal opinion.

**Roles:** Jay Hatkesh = **Data Fiduciary**. Members = **Data Principals**. Supabase/Razorpay/Meta/Resend = **Data Processors**.

---

## 1. Consent (clear, specific, purpose-bound, withdrawable)
- **Granular, unbundled consents** — separate toggle per purpose; none pre-ticked:
  - Account/identity (required to use the service)
  - Directory visibility (profile discoverable by members)
  - WhatsApp messaging — interest/lead nudges (Utility)
  - WhatsApp fortnightly community digest (Marketing)
  - Help-drive participation (case-specific)
- **Withdrawal as easy as giving** — every consent reversible in Settings; withdrawing stops that processing going forward.
- **Consent record** — store what was consented, when, and the notice version shown.
- **Data model:** `consents` — `member_id, purpose, granted bool, notice_version, granted_at, withdrawn_at`.

## 2. Notice (plain language, multilingual)
- Clear privacy notice **at/before collection**, in plain language.
- **Gujarati notice available** (DPDP right to notice in any scheduled Indian language) — fits the audience anyway. English + Gujarati at minimum.
- Notice states: what's collected, purposes, processors, rights, contact, withdrawal.

## 3. Purpose limitation & data minimisation (already strong — keep)
- Collect only what a purpose needs. Current good choices to preserve: **city + PIN, not home address**; **optional email**; **phone-only login**; aggregate-only intelligence; permission-gated contact.
- No repurposing data beyond the consented purpose without fresh consent.

## 4. Children's data (under 18) — STRICTEST area
DPDP: **verifiable parental/guardian consent** required; **no targeted advertising or behavioural tracking/monitoring of children.**
- **Age capture:** DOB is collected → flag `is_minor` server-side. (Membership stays open, but minors get protections.)
- **No behavioural targeting of minors** — minors excluded from interest-based targeting/profiling; digests to minors only with guardian consent or kept non-behavioural.
- **Help drives for a child beneficiary:** the **guardian is the consenting Data Principal** (raises the drive, consents to processing the child's data). Capture guardian consent explicitly. Child's medical docs are sensitive → see §7.
- **Students (status=studying) who are minors:** mentorship/guidance matching must not become behavioural profiling of a child; keep it consent-based and minimal.

## 5. Data Principal rights — self-serve rights centre at `/data`
- **Access** — view all data held.
- **Correction** — edit profile/listings.
- **Erasure** — delete account + data (with lawful-retention carve-outs, e.g. payment records).
- **Portability/export** — export own data.
- **Grievance** — reach the Data Protection Officer / grievance contact.
- **Nomination** — nominate someone to exercise rights (e.g. on death/incapacity).
- SLA: act on requests within the statutory window (confirm exact days with counsel).

## 6. Security safeguards (see AUDIT.md)
- RLS on every table; encryption in transit; secrets server-side; least-privilege access.
- Access logging for sensitive views (esp. help-drive documents).
- **Breach notification:** on a personal-data breach, notify the **Data Protection Board** and affected members per the Rules (confirm format/timeline with counsel). Keep an incident log.

## 7. Retention & deletion
- Retain personal data only while the purpose lasts; then delete/anonymise.
- **Help-drive documents: delete/securely archive when the drive closes** — do NOT keep a child's medical records indefinitely. Set a defined retention window post-closure.
- Closed/expired listings: retain minimally; purge contact-level data on account deletion.
- **Data model:** retention notes per sensitive table; scheduled purge job.

## 8. Processors & cross-border
- **Processors:** Supabase (DB/auth/storage), Razorpay (listing-fee payments), Meta (WhatsApp), Resend (receipts). Each is a Data Processor — execute data-processing terms; Jay Hatkesh stays accountable.
- **Data residency:** prefer a Supabase **India/Asia region**; document where personal data rests. DPDP permits cross-border transfer except to restricted countries (confirm current list with counsel).
- **NRI members (USA/Dubai):** their data may sit/transfer cross-border; note in the privacy notice. (Also interacts with help-drive donations — see LEGAL.md FCRA note.)

## 9. Consent Manager / DPO
- Appoint a **grievance/contact person** (and a DPO if/when thresholds require). Publish contact on `/privacy` and `/contact`.
- If Jay Hatkesh is later classed a **Significant Data Fiduciary** (volume/sensitivity), additional duties apply (DPO, audits, DPIA) — revisit as the community scales.

---

## Build checklist (add to AGENDA Phase-1 hardening)
- [ ] `consents` table + granular unbundled consent UI; withdrawal in Settings
- [ ] Privacy notice in English **and Gujarati**, versioned
- [ ] `is_minor` flag from DOB; exclude minors from behavioural targeting
- [ ] Guardian-consent capture on child-beneficiary help drives
- [ ] `/data` self-serve rights centre (access, correct, erase, export, nominate, grievance)
- [ ] Help-drive document retention/auto-purge on drive closure + access logging
- [ ] Processor data-terms noted; Supabase India region; cross-border noted in notice
- [ ] Breach-response runbook + incident log; grievance/DPO contact published
