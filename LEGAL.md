# LEGAL.md — Legal & Policy Pages (Jay Hatkesh · jayhatkesh.in)

The public pages Jay Hatkesh must host, the routes for each, and **where the link is required**
(Meta WhatsApp / Razorpay / in-app). These are drafting *starting points* — have them reviewed by
a lawyer before launch. They must stay consistent with the connector-only model (see `DISPUTE.md`).

> Founder is not a lawyer; Claude is not a lawyer. This is scaffolding, not legal advice.

---

## Pages required & where they're linked

| Page | Route | Required by |
|---|---|---|
| Terms of Service | `/terms` | Razorpay, Meta, app signup consent |
| Privacy Policy | `/privacy` | **Meta (mandatory)**, Razorpay, app signup |
| Refund / Cancellation Policy | `/refunds` | **Razorpay (mandatory)** |
| Shipping / Delivery Policy | `/shipping` | Razorpay (often required even if "digital/no shipping") |
| Contact Us | `/contact` | **Razorpay (mandatory)**, Meta |
| About Us | `/about` | Razorpay (commonly checked) |
| Pricing | `/pricing` | Razorpay (what the fee buys), app |
| Community Guidelines | `/guidelines` | app (broadcasts, listings, conduct) |
| Connector Disclaimer | `/disclaimer` (or within Terms) | app (every transaction-implying surface) |
| Data Deletion / Manage My Data | `/data` | **Meta (mandatory for app review)** |
| WhatsApp Opt-in & Messaging Policy | section in `/privacy` | **Meta (mandatory)** |

---

## Footer CTAs (every public page)
Terms · Privacy · Refunds · Contact · About · Community Guidelines · Pricing

## Signup consent CTAs (at the OTP gate)
- ☑ "I agree to the [Terms](/terms) and [Privacy Policy](/privacy)."
- ☑ "I agree to receive WhatsApp messages from Jay Hatkesh about interest in my listings and my inquiries." → sets `opt_in_whatsapp`.

---

## Razorpay activation checklist (what they verify)
Razorpay account approval typically requires live, reachable links to:
- Terms of Service, Privacy Policy, **Refund/Cancellation**, **Contact Us** (with a real email + address), Pricing, and **Shipping** (state "digital service / listing fee — no physical shipping" if that's the case).
- Make the **listing fee** explicit on `/pricing` and `/refunds` (what ₹X buys; whether the listing fee is refundable — recommended: non-refundable once the listing is published & live, since reach is delivered immediately).

## Meta WhatsApp (Cloud API) checklist (what they verify)
- Public **Privacy Policy** URL (mandatory in the app/business setup).
- **Opt-in evidence** — describe in the privacy policy how/where users consent to WhatsApp messages.
- **Data deletion** instructions/URL (`/data`).
- Message templates pre-approved (see `EMAILS.md` for copy parity; WhatsApp templates are registered in Meta Business Manager — Utility category for interest nudges, Marketing for the weekly digest).

---

## Page content outlines (starting points — lawyer to finalise)

### /terms — Terms of Service
- Who we are; eligibility (open membership).
- **Connector clause (core):** Jay Hatkesh only connects members; it is **not a party** to any arrangement, payment, stay, ride, sale, or service, and does **not** guarantee availability, quality, safety, or outcome. Members deal at their own discretion and responsibility.
- Listing fee terms; admin may change pricing; price/term snapshotted at purchase.
- Acceptable use; prohibited content; broadcast/announcement rules; reactive moderation & removal rights.
- No professional advice: guidance/second opinions shared by members are **not** a substitute for professional/medical/legal advice.
- Account suspension/termination; trust-level actions.
- Limitation of liability; indemnity; governing law (India / Gujarat jurisdiction — confirm).

### /privacy — Privacy Policy
- What we collect: phone, optional email, name, surname, city + PIN, gender, DOB, profession/specialty, capabilities, listings, inquiries. **No home address on profile.**
- How used: directory, Community Intelligence (aggregate), matching, notifications.
- **Aggregate vs individual:** counts are shown; contact details are permission-gated.
- **WhatsApp messaging & opt-in:** what we send, the opt-in, how to opt out.
- Email: optional; unsubscribe in every email.
- Sharing: not sold; processors (Supabase, Razorpay, Meta, Resend) named.
- **Data deletion / Manage My Data:** how to request deletion → `/data`.
- Cookies/analytics; children (not directed at under-18 / per local law); contact for privacy.

### /refunds — Refund & Cancellation
- Listing fee: recommended **non-refundable once the listing is live** (reach delivered immediately); state clearly.
- How to cancel a listing (stops renewal; no refund of active term).
- No member-to-member refunds handled by Jay Hatkesh (connector — money is offline).

### /shipping — Shipping/Delivery
- State plainly: Jay Hatkesh sells a **digital listing service**; no physical goods are shipped by Jay Hatkesh. Any goods (e.g. mangoes) are arranged and delivered **member-to-member, offline.**

### /contact — Contact Us
- Real support email, response window, and a registered address/city (Razorpay needs a genuine contact). Optional support WhatsApp.

### /guidelines — Community Guidelines
- Be respectful; સેવા spirit; honest listings; no spam.
- **Broadcasts:** only significant community-wide events; rate-limited; misuse → removal.
- Reporting & consequences; trust ladder.

### /disclaimer — Connector Disclaimer (shown on transaction surfaces)
> *Jay Hatkesh only connects members of the community. We are not a party to any arrangement, payment, stay, ride, sale, or service between members, and we do not guarantee the availability, quality, safety, or outcome of any such arrangement. Members deal with each other at their own discretion and responsibility.*

### /data — Data Deletion / Manage My Data
- Self-serve delete + email request path; what's removed; retention notes. (Meta app-review needs this reachable.)
