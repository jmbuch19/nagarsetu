# TEST_SCRIPT.md — End-to-End Pilot Test Script

Use this to walk every flow before sending the link to real Nagars. Run it yourself first,
then with 2–4 trusted test accounts (you + family/friends). Mark each step PASS / FAIL with
notes. Anything FAIL → fix → retest. Don't open to real members until the script runs clean.

> Time estimate: ~2 hours solo, ~half a day with two test users.
> Run on at least 2 devices: an Android phone (your real audience) and your laptop browser.
> If you can borrow an elder's older phone for one pass, do — Gujarati glyph QA is real there.

---

## Setup

- [ ] Real Vercel deployment, real Supabase, real Razorpay (test mode for paid steps initially)
- [ ] At least 3 test phone numbers (yours + two cooperative people)
- [ ] One number designated **Admin**; the others are members
- [ ] Open the Vercel and Supabase log panels in browser tabs — watch them as you test
- [ ] Have AUDIT.md and DPDP.md tabs open for spot checks

---

## 1. Landing page (anonymous / pre-login)

- [ ] Open jayhatkesh.in in a fresh incognito tab
- [ ] First-second test: do you see Nagar belonging + the "why now" mission line + benefits + Community Pulse counters/feed (peep, not just sign-in)?
- [ ] Gujarati font size visibly ≥ English counterpart? જય હાટકેશ feels co-equal with "Jay Hatkesh"?
- [ ] Footer links present: Terms · Privacy · Refunds · Contact · About · Guidelines · Pricing · FAQ · Manage My Data · Help Drives
- [ ] Each footer link loads a real page (not a 404 or "coming soon")
- [ ] Privacy page mentions DPDP, grievance contact, available in Gujarati
- [ ] Refund / Shipping / Contact pages have real content (Razorpay needs these live)
- [ ] On mobile: layout doesn't break; Gujarati glyphs render correctly

**Try to act without signing in:**
- [ ] Can you see Community Pulse counts / teaser feed? Should be YES
- [ ] Can you read individual member contacts? Should be NO
- [ ] Tap "Contact this listing" → does it prompt sign-in? Should be YES

---

## 2. Signup (Meta WhatsApp OTP)

- [ ] Enter your test mobile → request OTP → arrives on WhatsApp (not SMS)
- [ ] Enter the OTP → logged in
- [ ] Consent checkboxes shown: Terms+Privacy (required), WhatsApp opt-in (optional, separate)
- [ ] Try wrong OTP 3× → rejection + lockout/retry timer
- [ ] Request OTP 10× in 60s → rate-limited (should not blast 10 messages)
- [ ] After login, no profile fields were forced at the gate (separate step after)

---

## 3. Profile creation (the "why" + smart progressive profiling)

- [ ] After OTP, see the encouragement screen explaining why a complete profile helps the samaj
- [ ] Required fields: name, surname, city, PIN, gender, DOB. Try to submit with one missing → blocked
- [ ] Enter a recognised Nagar surname (e.g. Buch / Dholakia) → soft "recognised Nagar" badge shown
- [ ] Optional fields skippable: email, photo, sub-community, bio
- [ ] Profession dropdown (controlled list) → choose "Doctor"
- [ ] Specialty field auto-appears → choose "Cardiologist"
- [ ] Status: current / retired / studying — choose one
- [ ] Encouragement screen (સેવા framing) before opt-ins
- [ ] Opt-in: "Open to giving expert guidance?" — choose Yes
- [ ] Opt-in: "Anything else you can offer?" — choose Mentor
- [ ] Skip option works ("I'll do this later")
- [ ] Settings → confirm all of the above are editable AND consent toggles are individually withdrawable

**Cross-check on Supabase:**
- [ ] `members` row has the right fields, `is_minor` derived correctly from DOB
- [ ] `consents` rows recorded per purpose (WhatsApp Utility, Marketing, directory visibility)
- [ ] `member_capabilities` rows for expert_guidance + mentor created on opt-in

---

## 4. Directory & Community Intelligence

- [ ] Search directory by profession ("Doctor") → drill into specialty ("Cardiologist") → drill into city
- [ ] Aggregate counts visible (e.g. "X doctors in your city")
- [ ] Individual member's phone/email NOT visible until you initiate contact
- [ ] Filter by capability ("open to second opinions") — only members who opted in appear
- [ ] As a minor test account (use a DOB making is_minor=true) — confirm they don't get behaviourally segmented (manual code spot-check)

---

## 5. Create a Listing (paid offer)

Test account: member with active profile.

- [ ] Go to "Create a Listing" → see four-lever persuasion (Earning/Security/Safety/સેવા)
- [ ] Category picker shows: Business · Room · Vehicle · PG · Goods · Tour · Service · Education
- [ ] Choose "Goods" → category-specific form (no full address required, just area+city+PIN)
- [ ] Choose "Room" → ID verification check is requested (L2) before publish; flow blocks until verified or shows path
- [ ] Choose "Business" → admin review gate before going live (status = pending)
- [ ] Pre-listing screen shows REAL reach estimate (e.g. "reaches ~N Nagars across…")
- [ ] Listing fee: try ₹1 Razorpay TEST first → payment completes → listing goes LIVE → `expires_at` set correctly
- [ ] Server-side payment verification: in Vercel logs, see the gateway signature check; never trust client alone
- [ ] Try to mark the listing as paid by hitting the API directly without a real payment → should fail
- [ ] After live, listing visible in feed; price+term snapshotted on the listing row (admin price change later doesn't retroactively affect)

---

## 6. The interest loop (the heart of leads)

Two accounts needed: **Seller** (with active listing) and **Buyer** (browsing).

- [ ] As Buyer, find Seller's listing in the feed
- [ ] Tap "I'm interested" + write a short message ("5 kg, can collect Sunday")
- [ ] Confirmation shown to buyer; in-app notification fires to seller
- [ ] **WhatsApp ping to Seller arrives**: "Interest on your listing! {{buyer}} from {{city}} wants {{listing}}. Tap to talk: {{link}}" — exact template, real names, working link
- [ ] **WhatsApp ping to Buyer arrives**: "We've shared your interest in {{listing}} with {{seller}}. Message: {{link}}"
- [ ] Tap the `wa.me` link → opens WhatsApp with the right contact and a pre-filled message
- [ ] Seller's Lead Inbox shows the lead with buyer's info
- [ ] Seller dashboard shows: views, reach, leads (counts increment)
- [ ] If Buyer has `opt_in_whatsapp = false` → no WA ping, in-app notification only (fallback works)
- [ ] No money flow in the app — confirm

---

## 7. Free Requests (seeker side, e.g. PG Seeker)

- [ ] Post a free request: "Looking for a PG in Mumbai, male, ₹15k budget, June 1"
- [ ] No fee charged
- [ ] Appears in the feed for relevant providers
- [ ] A provider sees it and reaches out via the same "I'm interested" mechanism → buyer/seller roles invert correctly (the seeker becomes the receiver of interest)

---

## 8. Renewal lifecycle

- [ ] Set a test listing's `expires_at` to ~3 days away (admin override in Supabase)
- [ ] Day 25 / Day 28 reminders: trigger the cron route manually with the right CRON_SECRET
- [ ] Reminder arrives via WhatsApp Utility template
- [ ] Renew via in-app flow → `expires_at` extends; current price applied (not the snapshotted old price)
- [ ] Let one listing expire → status becomes `expired`; no longer in feed; family of "expired" emails NOT triggered

---

## 9. Fortnightly digest (the one community WA message)

- [ ] Pre-condition: at least 2 opted-in members, several active listings/events
- [ ] Trigger digest cron manually with CRON_SECRET
- [ ] Each opted-in member receives **exactly one** WhatsApp message in the cycle (not split, not multiple)
- [ ] Content curated to member's interest/city (relevance, not random)
- [ ] `last_digest_sent_at` updated; running the cron again in the same 15-day window does NOT re-send
- [ ] Non-opted-in members receive nothing
- [ ] Try in a no-content week: digest gracefully degrades (no empty message)

---

## 10. Magazine (Setusarjan)

- [ ] Submit a Gujarati poem in-app (the typing-help/transliteration flow works)
- [ ] Genre auto-classified; pull-quote suggested; spelling check runs gently
- [ ] Editor approves
- [ ] Render PDF → it actually generates, Gujarati fonts EMBED (open the PDF, check fonts)
- [ ] Cover, masthead, index, per-piece frame, pull-quote box, AV section, જય હાટકેશ closing — all present
- [ ] Share to WhatsApp/Facebook from the app — link/PDF works

---

## 11. Help Drive (the most sensitive — test extra carefully)

- [ ] As Member, raise a need: patient, guardian, gap amount, story, upload doc, private UPI
- [ ] Status = pending; NOT visible to any other member
- [ ] As Admin, review documents, approve → drive goes live with verified badge + exact citation text
- [ ] As another Member, find drive in "Verified Help Drives" header CTA
- [ ] Try to access the document URL directly without tapping "I want to help" → BLOCKED (RLS / storage policy)
- [ ] Tap "I want to help" → `help_intents` row created → documents now viewable
- [ ] **CRITICAL**: family UPI/bank is NOWHERE in the public response/page/list/feed. Grep the rendered HTML — should not appear. Admin relays privately on donor request.
- [ ] Admin can pull the drive anytime → it disappears from public view
- [ ] On drive closure: documents purged/archived per retention rule

---

## 12. Memorialisation

- [ ] Mark a test account as deceased (admin) → `account_state = memorialised`
- [ ] All listings/offers/requests auto-deactivated
- [ ] Login disabled for that account (try logging in → fails)
- [ ] Contact details hidden
- [ ] Removed from Community Intelligence counts (e.g. "doctors in city" drops by 1)
- [ ] Magazine contributions remain attributed (with optional "in memory" note)
- [ ] No automated nudges/expiry/digest reach that account or its associated number
- [ ] Family-request delete path works: full erasure possible

---

## 13. /data — DPDP rights centre

- [ ] View: see all your data
- [ ] Correct: edit and save
- [ ] Export: download as JSON/CSV
- [ ] Nominate: add a nominee (member_id reference)
- [ ] **Delete**: deletes the account → confirm in Supabase that:
  - `members` row removed or anonymised
  - `listings` / `inquiries` / `consents` / `member_capabilities` rows handled per policy
  - Payment records retained minimally (legal requirement) but personal identifiers stripped
- [ ] Grievance contact reachable

---

## 14. Adversarial / edge cases (try to break it)

- [ ] Post a listing with extreme-length text (10,000 chars) → handled (truncated or rejected)
- [ ] Post a listing with weird unicode / emoji-bombs → handled
- [ ] Upload a non-image file as photo → rejected
- [ ] Upload a 50MB image → rejected with clear message
- [ ] SQL-injection-ish strings in search ("'; DROP TABLE…") → safely escaped (parameterised queries)
- [ ] Try to file a malicious community broadcast → rate-limited; reactive moderation works (flag/remove)
- [ ] Try to memorialise a live account as a non-admin → BLOCKED
- [ ] Try to read another member's `help_drive_payment` row via the Supabase REST API directly → BLOCKED by RLS
- [ ] Try the WhatsApp interest ping when you have no opt-in → falls back to in-app only (not silently fails)
- [ ] Disable your network mid-payment → state is consistent (no half-paid listing)

---

## 15. Device & accessibility

- [ ] Android phone, Chrome — Gujarati renders correctly, tap targets are usable
- [ ] iPhone Safari — same
- [ ] If possible, an elder's older device — Gujarati glyphs?
- [ ] Color contrast on the teal Sign-in button and the saffron CTAs passes WCAG (use any contrast checker)
- [ ] App usable in 5 minutes by someone who's never seen it (have a non-tech friend try)

---

## 16. Logs & monitoring (during all of the above)

While running everything above, keep the Vercel and Supabase log panels open:

- [ ] No 500 errors during normal flows
- [ ] No secrets / OTPs / payment-secret strings appearing in logs
- [ ] No "permission denied" floods (would signal an over-tight policy)
- [ ] No slow queries (>1s) on the main listing/feed paths
- [ ] Edge function/cron logs show jobs running cleanly

---

## After the script runs clean

- [ ] Run the SECURITY_AUDIT_PROMPT.md against Claude Code → get the report
- [ ] Resolve all CRITICAL + HIGH findings
- [ ] Pick the **first 5–10 Nagars** — people who'll be candid with you if something feels off
- [ ] Frame the invite as a *trusted beta*: "Please try it, please tell me what feels broken"
- [ ] Watch the logs and the Lead Inbox closely for 48 hours after they join
- [ ] Then widen carefully — never a single mass blast

જય હાટકેશ 🪔
