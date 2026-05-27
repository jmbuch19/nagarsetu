# DISPUTE.md — Member Dispute Handling (Connector-Safe)

Because **Jay Hatkesh is a connector, not a party** to any member-to-member deal, it cannot
and must not act as judge, escrow, or guarantor. But trust still has to be protected. This
document defines how disputes are handled — socially and through reputation, not legally.

---

## First principle

> The app introduced two members. What happened between them — the rent, the ride, the
> mangoes, the money — is theirs. Jay Hatkesh does not hold the money, does not guarantee the
> outcome, and does not decide who is right.

This must be stated plainly in the **Terms** and shown as a **disclaimer** on every surface
where a transaction could be implied (stay, mobility, goods, tours, paid guidance).

---

## What the app DOES do

1. **Reputation, not refunds.** The two-way review system is the primary remedy. A bad
   experience becomes a visible review and affects the other party's standing.
2. **Reporting.** Any member can file a `report` against a member or listing (reason + details).
3. **Admin review.** An admin reviews reports for *platform conduct* — fraud, misrepresentation,
   harassment, fake listings, repeated complaints — NOT for who owes whom money.
4. **Proportionate action** (platform-side only):
   - Warning
   - Listing removal / suspension of listing privileges
   - Trust-level reduction
   - Account suspension (repeat / serious)
5. **Trust ladder feedback.** Confirmed misconduct lowers trust level; clean history raises it.

## What the app does NOT do

- Does **not** refund, reverse, or hold money (it never had it).
- Does **not** adjudicate the financial merits of a disagreement.
- Does **not** guarantee availability, quality, safety, or delivery.
- Does **not** take sides in a private dispute.

---

## Escalation flow

```
member files report
        │
        ▼
admin triage  ──►  not a conduct issue  ──►  close + point parties to reviews / their own resolution
        │
        ▼
conduct issue confirmed
        │
        ▼
proportionate action (warn / suspend listing / lower trust / suspend account)
        │
        ▼
log outcome in reports.action_taken  +  AUDIT.md
```

## Data

Uses `reports` (see `SPEC.md`): `reporter_id, subject_member_id, listing_id?, reason, details,
status (open|reviewing|actioned|dismissed), action_taken`.

## Safety carve-outs

For reports alleging a **safety threat** (especially in stay/mobility), prioritise member
safety: act fast on suspension, preserve the report record, and — where appropriate — advise
the reporting member to contact local authorities. The app supports the member's own action;
it does not replace it.

---

## Disclaimer text (starting point — founder to finalise/legal-review)

> *Jay Hatkesh only connects members of the community. We are not a party to any arrangement,
> payment, stay, ride, sale, or service between members, and we do not guarantee the
> availability, quality, safety, or outcome of any such arrangement. Members deal with each
> other at their own discretion and responsibility.*
