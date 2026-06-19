# WHATSAPP.md — Meta WhatsApp Cloud API operations

How Jay Hatkesh uses Meta WhatsApp: who sends, what they send, and how to
prepare the account so the code already in this repo starts working.

The code paths that depend on this account:

| Flow                          | Template category | Lives in                                                  |
|-------------------------------|-------------------|-----------------------------------------------------------|
| Sign-in OTP                   | Authentication    | `apps/web/src/app/api/auth-hooks/send-otp/route.ts`       |
| Lead "I'm interested" nudge   | Utility           | (later — AGENDA §4)                                       |
| Fortnightly community digest  | Marketing         | (later — AGENDA §4a)                                      |

Everything below is operational setup. Code is already written and waiting
on these credentials.

---

## Phase A — Meta Business Manager + WABA

One-time. Owned by the founder. Allow 1–3 business days for Meta review at
each gate.

1. **Meta Business Manager account.** business.facebook.com → create
   business. Use the legal entity that will own the Razorpay account too
   (consistency matters for verification).
2. **Business verification.** Settings → Business Info → Start verification.
   Required for production access at any scale (sandboxes work without it,
   but the sandbox phone-number quota is tiny). Submit: registration cert /
   GST cert / utility bill at the registered address.
3. **WhatsApp Business Account (WABA).** Accounts → WhatsApp Accounts →
   Create. Display name = **Jay Hatkesh**. Category = Community /
   Non-profit (matches the actual nature of the platform).
4. **Phone number.** Add a sender number under the WABA. Choices:
   - **A new number** dedicated to the platform (recommended — keeps the
     founder's personal WhatsApp untouched).
   - **An existing number that is NOT on personal WhatsApp** — Meta
     refuses numbers actively registered in regular WhatsApp.
   Verify via SMS/voice OTP during onboarding.
5. **Display name approval.** Submitted with the phone number — Meta will
   approve "Jay Hatkesh" if it matches the verified business name.

After Phase A the WABA + phone number are live but no templates exist yet.

---

## Phase B — System User + permanent access token

Avoid using a personal access token in production (it expires and is tied
to a single human). System Users are the right primitive.

1. **Business Manager → Settings → Users → System Users → Add.**
   - Name: `nagarsetu-server`
   - Role: **Admin** (needed to send messages; Employee role can't).
2. **Add assets.** Click the System User → Add Assets → WhatsApp accounts
   → pick the Jay Hatkesh WABA → **Full control**.
3. **Generate token.**
   - Click "Generate New Token" on the System User.
   - App = the Meta App attached to the WABA (create one if absent:
     developers.facebook.com → My Apps → Create App → Type "Business").
   - **Permissions** required: `whatsapp_business_messaging` +
     `whatsapp_business_management`.
   - **Expiration: Never** (this is the whole point of using a System
     User).
   - **Copy the token immediately** — Meta shows it once. Save to a
     password manager.

Populate the env vars (Vercel → Project → Settings → Environment Variables;
Production environment):

| Env var                          | Source                                        |
|----------------------------------|-----------------------------------------------|
| `WHATSAPP_ACCESS_TOKEN`          | The System User token from step B-3           |
| `WHATSAPP_PHONE_NUMBER_ID`       | WhatsApp Manager → API Setup → "Phone number ID" (numeric) |
| `WHATSAPP_BUSINESS_ACCOUNT_ID`   | WhatsApp Manager → Overview → "WhatsApp Business Account ID" |
| `WHATSAPP_GRAPH_API_VERSION`     | Pin to current — e.g. `v21.0`. Bump deliberately, never blindly. |

---

## Phase C — Approve the Authentication template

This is the one Meta rule the OTP flow can't ship without.

1. **WhatsApp Manager → Account Tools → Message Templates → Create
   template.**
2. **Category = Authentication.** Critical — Meta's other categories
   (Marketing, Utility) cannot carry OTPs.
3. **Name = `nagarsetu_otp`** (must match `WHATSAPP_AUTH_TEMPLATE_NAME`).
4. **Language = English** (`en` — matches `WHATSAPP_AUTH_TEMPLATE_LANG`).
   Gujarati template is a planned follow-up; English approves fastest.
5. **Format:**
   - Body: Use Meta's standard Authentication-category body. There is
     only one variable: `{{1}}` = the OTP code. The full canned text
     Meta enforces:
     `*{{1}}* is your verification code. For your security, do not share
     this code.`
   - Button: **Copy code** button (one button only). The button
     parameter is also the OTP.
   - No header, no footer, no media.
6. **Submit.** Meta review for Auth templates is typically 1–24 hours;
   sometimes 1–3 days.
7. Once status = Approved, the sign-in flow works end-to-end.

> **⚠️ Reality check (discovered 2026-06-18) — the Authentication category is gated, and we don't qualify yet.**
> Creating an Authentication template currently fails with error code 10 /
> subcode **2388185** ("does not have permission to create message template")
> in **both** the WhatsApp Manager UI and the Graph API. This is **not** an
> account bug, propagation lag, or something Meta support will switch on —
> and it is **not** fixable by "warming up" with a Marketing template (no
> such category-unlock exists). It is an **Authentication-category-specific
> gate**. Proven by: a Utility template (`welcome_jayhatkesh`) was created
> successfully on this same WABA while the auth template stayed blocked.
> Meta requires **two** things to create Auth templates: (1) business
> verification — ✅ done; AND (2) **demonstrated messaging activity (~1000
> business-initiated dialogs/day per number)** — ❌ we've sent 0. The exact
> threshold is a third-party (BSP) figure and may vary, but the shape —
> verification + sustained real volume — matches the symptom exactly.
>
> **Consequence:** WhatsApp native OTP is effectively **unreachable at pilot
> scale**. **Google Auth is the primary sign-in path** until one of these
> lands: (a) route OTP through a Meta-partner BSP (Gupshup/Twilio/MSG91) —
> partner status + aggregated volume can bypass the self-serve gate; (b) use
> a plain SMS-OTP provider for phone verification (no WhatsApp volume gate);
> or (c) grow Utility-message volume until the Authentication category
> unlocks. The Utility templates below are the vehicle for (c) — every
> approved one and every real send is a brick toward that activity history.

After Phase C, populate:

| Env var                          | Value                          |
|----------------------------------|--------------------------------|
| `WHATSAPP_AUTH_TEMPLATE_NAME`    | `nagarsetu_otp`                |
| `WHATSAPP_AUTH_TEMPLATE_LANG`    | `en`                           |

---

## Phase D — Wire the Supabase Send-SMS hook

Tells Supabase to deliver every phone-OTP through our endpoint instead of
the default SMS provider.

1. **Supabase dashboard → Authentication → Hooks → Send SMS hook → Enable.**
2. **Hook URL** = `https://jayhatkesh.in/api/auth-hooks/send-otp`
   (or your current Vercel production URL).
3. **Method** = POST.
4. **Generate a hook secret.** Supabase produces a `v1,whsec_<base64>`
   string. Copy it.
5. Set Vercel env var `SUPABASE_AUTH_HOOK_SECRET` to that string. Redeploy
   the web app (Vercel auto-redeploys on env-var change).
6. **Authentication → Phone provider → enable Phone Sign-in.** Provider
   choice does not matter (the hook intercepts), but Supabase requires one
   to be selected. Pick anything; leave its credentials blank.

Verify by signing in with a real phone number. Supabase logs the hook
call; Vercel logs the route. If signature verification fails you'll see
`[send-otp hook] signature rejected:` in the Vercel function logs.

---

## Dev workflow when Meta isn't ready yet

`supabase/config.toml`'s `[auth.sms.test_otp]` block declares three dev
phone numbers (India / US / UK) that bypass the SMS provider entirely.
Supabase serves the canned OTP from that map without ever calling the
Send-SMS hook — so the UI can be driven end-to-end against the deployed
project before Meta approval lands. The hook only fires for real phones.

Test phones today (local CLI; remote dashboard config separate):

| Country  | Phone           | OTP    |
|----------|-----------------|--------|
| India    | `+919876543210` | 123456 |
| USA      | `+15555550100`  | 654321 |
| UK       | `+447700900100` | 246810 |

These exist only in the committed config — remote test-phone allow-listing
is configured in the Supabase dashboard separately and should mirror the
same numbers until the Meta hook is live.

---

## Ready-to-submit Utility & Marketing templates

Drafted 2026-06-18, grounded in real product events (see code paths in the
mapping table). Submit via **WhatsApp Manager → Create template** (the route
that works for us today). Names use the `nagarsetu_` prefix to match
`nagarsetu_otp`. Language = **English** (`en`); the Gujarati salutation
`જય હાટકેશ` in an English-language body is allowed — content can be any
script. If a template bounces, the salutation is the first thing to drop.

**Category rule that drives all of this:** *Utility* = a notification tied to
the **recipient's own** action/account (their listing got a lead, their
payment cleared, their listing is expiring). A **broadcast the recipient
didn't trigger** (e.g. "blast all members about new listings") is
**Marketing** — submitting it as Utility gets it rejected, and Marketing
needs explicit opt-in + an opt-out line. India Marketing templates are **not**
paused (only +1/US numbers are). **Both** categories count as business-initiated
dialogs toward the Auth-category activity gate (see Phase C callout).

### Code-event mapping

| Template name             | Category  | Fires when…                                        | Code path                                                |
|---------------------------|-----------|----------------------------------------------------|----------------------------------------------------------|
| `nagarsetu_lead_seller`   | Utility   | a member taps **"I'm interested"** on your listing | `apps/web/src/app/feed/actions.ts` (interest) → leads    |
| `nagarsetu_fee_receipt`   | Utility   | listing fee (Razorpay) is captured                 | listing-fee verify (AGENDA §4) + `listings/listing-form` |
| `nagarsetu_listing_live`  | Utility   | a listing transitions to `active`                  | `apps/web/src/app/listings/*`                            |
| `nagarsetu_listing_expiring` | Utility | a listing nears `expired` (cron pre-expiry)        | Vercel Cron / pg_cron pre-expiry job                     |
| `nagarsetu_connect_request`  | Utility | someone requests to connect with you               | connections flow → `/connections`                        |
| `nagarsetu_connect_approved` | Utility | your connection request is approved                | connections flow → `/connections`                        |
| `nagarsetu_digest_fortnightly` | Marketing | fortnightly community digest (opt-in only)    | scheduler (AGENDA §4a)                                   |

Each template: Body + Footer + optional URL Button. `{{n}}` are variables;
Meta requires a **sample value** per variable at submit time (given below).
No empty/optional variables — Meta rejects blanks.

### 1. `nagarsetu_lead_seller` — Utility
- **Body:** `જય હાટકેશ {{1}}! A fellow Nagar is interested in your listing "{{2}}". Open Your leads to see who, and continue the conversation.`
- **Footer:** `Jay Hatkesh · a connector for the Nagar samaj`
- **Button:** Visit website → `View leads` → `https://www.jayhatkesh.in/listings/leads`
- **Samples:** `{{1}}=Jaydeep` · `{{2}}=Room in Maninagar`

### 2. `nagarsetu_fee_receipt` — Utility (strongest approval odds: a receipt)
- **Body:** `જય હાટકેશ {{1}}! We've received your listing fee of ₹{{2}}. Your offer "{{3}}" is now active until {{4}}. Payment reference: {{5}}.`
- **Footer:** `Jay Hatkesh · jayhatkesh.in`
- **Samples:** `{{1}}=Jaydeep` · `{{2}}=199` · `{{3}}=Tally consulting` · `{{4}}=18 Jul 2026` · `{{5}}=pay_Qk29fA1bC`

### 3. `nagarsetu_listing_live` — Utility
- **Body:** `જય હાટકેશ {{1}}! Your listing "{{2}}" is now live in the community feed. When a fellow Nagar is interested, you'll see them in Your leads.`
- **Footer:** `Jay Hatkesh · jayhatkesh.in`
- **Button:** Visit website → `My listings` → `https://www.jayhatkesh.in/listings`
- **Samples:** `{{1}}=Jaydeep` · `{{2}}=Maruti Ertiga for hire`

### 4. `nagarsetu_listing_expiring` — Utility
- **Body:** `જય હાટકેશ {{1}}! Your listing "{{2}}" lapses on {{3}}. Renew it from Your listings to stay visible to the community.`
- **Footer:** `Jay Hatkesh · jayhatkesh.in`
- **Button:** Visit website → `Renew listing` → `https://www.jayhatkesh.in/listings`
- **Samples:** `{{1}}=Jaydeep` · `{{2}}=PG near GLS` · `{{3}}=25 Jun 2026`

### 5. `nagarsetu_connect_request` — Utility
- **Body:** `જય હાટકેશ {{1}}! A fellow Nagar would like to connect with you on Jay Hatkesh. Open Your connections to approve and share contact.`
- **Footer:** `Jay Hatkesh · jayhatkesh.in`
- **Button:** Visit website → `View connections` → `https://www.jayhatkesh.in/connections`
- **Samples:** `{{1}}=Jaydeep`

### 6. `nagarsetu_connect_approved` — Utility
- **Body:** `જય હાટકેશ {{1}}! Your connection request was approved. Open Your connections to reach them on WhatsApp or email.`
- **Footer:** `Jay Hatkesh · jayhatkesh.in`
- **Button:** Visit website → `View connections` → `https://www.jayhatkesh.in/connections`
- **Samples:** `{{1}}=Jaydeep`

### 7. `nagarsetu_digest_fortnightly` — **Marketing** (opt-in only)
*This is the right home for the "promote new listings to members" blast — it is Marketing, not Utility.*
- **Body:** `જય હાટકેશ {{1}}! New this fortnight on Jay Hatkesh — {{2}} new offers, {{3}} fellow Nagars asking for help, and {{4}} new matrimony profiles. Open the feed to find, offer, and connect.`
- **Footer:** `Jay Hatkesh · reply STOP to opt out`
- **Button:** Visit website → `Open the feed` → `https://www.jayhatkesh.in/feed`
- **Samples:** `{{1}}=Jaydeep` · `{{2}}=7` · `{{3}}=2` · `{{4}}=3`
- **Guardrails:** only to members who opted into WhatsApp updates; honour STOP.

### Held back (do NOT file as Utility)
- **Blood/emergency/help-drive blasts** — broadcasting to all members is
  Marketing/Announcement (not recipient-triggered) and our own plan gates
  drive notifications behind opt-in. Draft as a Marketing template
  (`nagarsetu_drive_alert`) only when the opt-in exists.
- **Welcome message** — Meta often bumps a warm welcome to Marketing; the
  Resend welcome email already covers this. Skip on WhatsApp until the
  account is healthier. (`welcome_jayhatkesh` exists as the Utility
  diagnostic that proved the 2388185 block is auth-only — not for sending.)

**Submit order:** start with **#1, #2, #3** — cleanest Utility approvals and
the most useful once interest/payment flows wire to WhatsApp. Keep
`EMAILS.md` (WhatsApp parity) in sync as these get approved.

---

## Security notes

- **Token rotation.** If `WHATSAPP_ACCESS_TOKEN` is ever exposed (committed
  by accident, shown on screen, etc.) — go to System Users → token →
  Revoke, then generate a new one. Update Vercel env vars and redeploy.
  Same protocol as Supabase keys (see AUDIT.md 2026-05-27 incident).
- **Hook secret rotation.** Supabase supports rotating the Send-SMS hook
  secret via the dashboard. Our verifier accepts multiple `v1,sig` entries
  in the header for the rotation window — generate the new secret first,
  set it in Vercel, deploy, then rotate in Supabase.
- **Hook endpoint is public.** The HMAC + 5-minute timestamp skew window
  in `verifySupabaseHookSignature` is the only thing keeping a third party
  from POSTing forged OTPs through our Meta quota. Don't disable the check
  for debugging; log the rejection reason and investigate.
- **Never log the OTP.** The current route logs failures only. If you add
  more logging, redact `payload.sms.otp` and the path components on Meta
  URLs (they're benign but it's a good habit).
