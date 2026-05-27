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

## Future templates (placeholders — code lands with the relevant slice)

These will be added to this doc as utility/marketing templates get
submitted to Meta. Template names are pinned here so the env-var naming
stays consistent.

| Slot                              | Template name (planned)        | Category   |
|-----------------------------------|--------------------------------|------------|
| Lead "I'm interested" — to seller | `nagarsetu_lead_seller`        | Utility    |
| Lead "I'm interested" — to buyer  | `nagarsetu_lead_buyer`         | Utility    |
| Listing pre-expiry reminder       | `nagarsetu_listing_expiring`   | Utility    |
| Fortnightly community digest      | `nagarsetu_digest_fortnightly` | Marketing  |

Each ships with its own slice + this table gets updated.

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
