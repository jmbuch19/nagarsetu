# EMAILS.md — Email Templates

Transactional + digest emails (sent via Resend; see `.env.example`). Email is **optional** per member —
send only if `email` present and (for non-essential) `opt_in_email = true`. Every email has an
**unsubscribe** link and the Nagarsetu footer. Keep Gujarati-friendly; lead with warmth (જય હાટકેશ).

> Placeholders use `{{snake_case}}`. Subjects are kept short. Tone: warm, community, honest
> (promise connection/possibility, never guaranteed outcomes — consistent with LEGAL.md).

---

## Conventions
- **From:** `Nagarsetu <no-reply@your-domain>`
- **Footer (all):** "You're receiving this as a member of Nagarsetu. [Manage preferences]({{prefs_url}}) · [Unsubscribe]({{unsub_url}}). જય હાટકેશ 🪔"
- **Categories:** Transactional (always send if email present) vs Digest/Marketing (require `opt_in_email`).

---

## 1. Welcome (transactional)
**Subject:** Welcome to Nagarsetu, {{first_name}} 🪔
Welcome to the bridge of our community — સેવા · સહકાર · શિસ્ત.
Your profile helps fellow Nagars find a doctor, a mentor, a match, or a business they can trust.
Complete your profile and tell us what you can offer the circle: {{profile_url}}

## 2. Listing published + receipt (transactional)
**Subject:** Your listing is live — reaching ~{{reach_count}} Nagars
"{{listing_title}}" is now live and visible across the community.
Active until {{expires_on}}. Amount paid: {{amount}} ({{txn_ref}}).
Track views and leads: {{listing_dashboard_url}}
*(Listing fee is non-refundable once live — see [Refund Policy]({{refunds_url}}).)*

## 3. New lead / interest (transactional)
**Subject:** Someone's interested in {{listing_title}}
{{buyer_name}} from {{buyer_city}} is interested.
{{message_excerpt}}
Reply now: {{thread_url}}  ·  Or continue on WhatsApp: {{wa_link}}

## 4. Interest sent — to the seeker (transactional)
**Subject:** We've shared your interest with {{seller_name}}
We let {{seller_name}} know you're interested in "{{listing_title}}".
Message them directly: {{thread_url}}  ·  WhatsApp: {{wa_link}}

## 5. Pre-expiry renewal reminder (transactional)
**Subject:** "{{listing_title}}" expires in {{days_left}} days
Keep reaching the community without a break. Renew for {{current_price}} / {{term_days}} days: {{renew_url}}
*(Day ~25 and ~28 sends.)*

## 6. Listing expired (transactional)
**Subject:** "{{listing_title}}" has expired
Your listing is no longer visible. Relist anytime in a tap: {{relist_url}}

## 7. Weekly community digest (DIGEST — needs opt_in_email)
**Subject:** This week in our Nagar community
- Featured members & businesses: {{featured_list}}
- New this week: {{new_listings_count}} listings · {{new_events_count}} events
- Upcoming: {{events_list}}
- From Setusarjan: {{latest_issue_link}}
Explore: {{feed_url}}

## 8. Scholarship / opportunity alert (DIGEST — needs opt_in_email)
**Subject:** New opportunity for our community
{{opportunity_title}} — {{short_criteria}}. Deadline: {{deadline}}.
Details & apply: {{opportunity_url}}

## 9. Saved-alert match (transactional — user requested it)
**Subject:** Found it — {{keyword}} just listed
A new "{{listing_title}}" matches your alert in {{city}}.
View: {{listing_url}}  ·  Manage alerts: {{alerts_url}}

## 10. Community event announced (DIGEST — needs opt_in_email; or transactional if in user's city)
**Subject:** {{event_title}} — {{event_date}}
{{organising_body}} invites the community: {{event_summary}}
{{venue}}, {{city}}. Details: {{event_url}}

## 11. Magazine published (DIGEST — needs opt_in_email)
**Subject:** Setusarjan {{issue_number}} is out 🪔
This month's issue is ready — poems, stories, and member voices.
Read / download: {{issue_url}}

## 12. ID verification result (transactional)
**Subject:** Your verification is {{status}}
{{#approved}}You can now host stays and list vehicles. {{/approved}}
{{#rejected}}A few details need attention: {{reason}}. {{/rejected}}
Details: {{verification_url}}

---

## WhatsApp parity (registered as templates in Meta Business Manager)
These mirror the emails but must be **pre-approved templates** (Utility for interest, Marketing for digest):
- **Interest → seller (Utility):** "Interest on your Nagarsetu listing! {{buyer_name}} from {{city}} wants {{listing_title}}. Tap to talk: {{link}}"
- **Interest → buyer (Utility):** "We've shared your interest in {{listing_title}} with {{seller_name}}. Message now: {{link}}"
- **Renewal reminder (Utility):** "Your Nagarsetu listing {{listing_title}} expires in {{days_left}} days. Renew: {{link}}"
- **Weekly digest (Marketing, opt-in):** "This week in our Nagar community: {{highlight}}. See more: {{link}}"
- **OTP (Authentication):** standard auth template for login.
