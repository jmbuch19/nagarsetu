# SECURITY_AUDIT_PROMPT.md — Run this against Claude Code

> Paste the prompt below into Claude Code. It instructs Claude Code to produce a real,
> evidence-based audit report — not a self-graded "yes/done" checklist. Save its output as
> `SECURITY_AUDIT_REPORT.md` in the repo, then review with the founder before any push.

---

## The prompt

```
You are auditing the Jay Hatkesh (Nagarsetu) codebase before a closed pilot launch.
Do NOT mark anything PASS without concrete evidence. If you can't verify something,
mark it UNVERIFIED and say why. Do not be defensive about prior work — find issues.

Read CLAUDE.md, MEMORY.md, SPEC.md, AUDIT.md, DPDP.md, DISPUTE.md first. Then audit
the actual implementation against the items below.

For EVERY item, produce a row in the report with:
  - Status: PASS / FAIL / UNVERIFIED / NOT-YET-BUILT
  - Evidence: file path + line numbers, OR a SQL/curl command run + output, OR a
    plain explanation if N/A.
  - Risk: LOW / MEDIUM / HIGH / CRITICAL if status is not PASS
  - Fix: what to change (if not PASS)

Write the full report to /SECURITY_AUDIT_REPORT.md. Be concise but specific.

=== A. DATABASE & RLS ===

A1. List every table in Supabase. For each, confirm RLS is ENABLED. Paste the list
    with the enabled flag (you can use the Supabase MCP or a SQL query).
A2. For each table, paste its policies (name, command, USING/WITH CHECK expressions).
A3. For the most sensitive tables — members, listings, inquiries, help_drives,
    help_drive_documents, help_drive_payment, consents, payments — write a one-line
    plain-English summary of the access model ("only the owning member can read; admins
    can read all").
A4. Negative-access test (run actual SQL as a non-owner user via Supabase):
    - Can member A read member B's phone/email? Must be NO unless permission-gated.
    - Can a non-admin read help_drive_payment? Must be NO.
    - Can a non-donor (no row in help_intents) read help_drive_documents? Must be NO.
    - Can an anonymous user list any sensitive table? Must be NO.
    Paste the SQL and the result of each.
A5. Service-role key usage: grep the entire repo (including .next/ build output if
    present) for SUPABASE_SERVICE_ROLE_KEY and the literal key value. It must NEVER
    appear in any file shipped to the client (no app/, components/, pages/ outside
    /api or server actions). Confirm by listing every file that references it.

=== B. AUTH & SESSIONS ===

B1. Confirm Meta WhatsApp OTP delivery works end-to-end (paste a recent successful
    test, redacting the OTP).
B2. OTP rate limiting: try requesting an OTP for the same number 10 times in 60
    seconds. Show what happens. Must throttle.
B3. Session handling: after logout, confirm the session token is invalidated server-side
    (not just removed from the client). Paste the test.
B4. Role checks on API routes: list every API route, mark which require auth, which
    require admin/editor. For 3 admin-only routes, hit them as an anonymous user
    AND as a non-admin member; show the 401/403 responses.
B5. Cron routes (/api/cron/*): confirm each requires CRON_SECRET header. Hit one
    without the header and one with a wrong value; show 401/403.

=== C. PAYMENTS (LISTING FEE) ===

C1. Payment verification is SERVER-SIDE only. Paste the exact code that verifies the
    Razorpay payment signature/webhook on the server. The client must not be trusted.
C2. Try to mark a listing as paid via the client API without a real payment. Should
    fail. Paste the attempt and result.
C3. Confirm no code path moves member-to-member money. Search the repo for any
    transfer, payout, split, or marketplace logic. Should find none.
C4. Confirm no commission logic. Search for "commission", "platform_fee" (outside
    the listing-fee), "split". Should find none.
C5. Webhook secret is set and verified. Paste the verification code.

=== D. CONNECTOR INTEGRITY ===

D1. Connector disclaimer present on every transaction-implying surface (listings,
    stay, vehicle, PG, goods, tours, help drives). List the components/pages where
    it appears.
D2. Availability is soft-status only — confirm there is no booking/locking code path
    that would make Jay Hatkesh a party to a transaction.
D3. Help-drive payment details (UPI/bank): confirm they are stored ONLY in
    help_drive_payment with admin-only RLS, and are NOT exposed in any list/feed/API
    response. Grep the repo for the column names; confirm only admin paths read them.

=== E. INPUT & FILE UPLOADS ===

E1. Server-side validation on every write endpoint: pick 5 write endpoints; for each,
    paste the validation/schema check.
E2. File uploads (photos, help-drive documents): confirm type and size limits
    server-side, and that files go to scoped Storage buckets with RLS, not a public
    bucket. List the bucket policies.
E3. Help-drive documents bucket: confirm access requires a row in help_intents (i.e.
    the member tapped "I want to help"). Test by attempting to fetch a document URL
    as a member with no help_intent row; should fail.

=== F. PERSONAL DATA & DPDP ===

F1. Consents table exists; granular per purpose; withdrawable from Settings. Confirm
    each WhatsApp send (interest nudge, digest) checks the relevant consent flag
    before sending. Show the gating code.
F2. /data rights centre: confirm it allows view, edit, export, and DELETE of the
    authenticated member's data. For DELETE, confirm what actually happens (row
    deletion vs anonymisation) across members, listings, inquiries, consents, etc.
F3. Minor handling: is_minor flag derived from date_of_birth. Confirm minors are
    excluded from any behavioural targeting / digest segmentation logic.
F4. Privacy notice: available in English AND Gujarati; version stored with each
    recorded consent.
F5. Retention: help_drive_documents have a purge mechanism on drive closure. Show
    the job or scheduled task.

=== G. WHATSAPP / EMAIL ===

G1. WhatsApp Utility templates (interest-to-seller, interest-to-buyer, renewal):
    confirm they are pre-approved in Meta Business Manager and the codes used match.
G2. Marketing template (fortnightly digest): confirm approval and opt-in check
    before send.
G3. last_digest_sent_at enforced: confirm no member can receive more than one digest
    per 15-day cycle. Show the guard.
G4. wa.me deep links: confirm they're user-initiated (a tap), not auto-fired.
G5. Email: confirm email is sent only for receipts and OTP fallback — not for
    discovery/digest.

=== H. SECRETS & DEPLOYMENT ===

H1. .env is in .gitignore; .env.example committed; no real secret strings in the
    repo history. Run git log -p and grep for the obvious patterns.
H2. Vercel env vars are set for all required keys (list them per .env.example).
    Service-role and gateway secrets are SERVER-only in Vercel (not exposed as
    NEXT_PUBLIC_).
H3. Logs: confirm no sensitive data (OTPs, payment secrets, full member records)
    is being logged. Show the log calls in auth and payment paths.

=== I. PUBLIC PAGES & SEO ===

I1. /terms /privacy /refunds /shipping /contact /about /pricing /guidelines
    /disclaimer /data /help-drives /faq — confirm each is live and reachable.
    Razorpay activation needs Refund/Contact/Shipping live.
I2. Privacy page references DPDP, the grievance contact, and is available in Gujarati.

=== J. GUJARATI & ACCESSIBILITY ===

J1. Gujarati glyphs render correctly on the landing page, the FAQ, and at least one
    listing card. Paste screenshots or a description.
J2. Gujarati font-size ≥ English counterpart per SPEC §7.05 #4. Confirm.

=== END ===

After producing the report, summarise at the top:
  - Total items: X
  - PASS: X
  - FAIL/UNVERIFIED: X
  - CRITICAL/HIGH risks count
  - Top 5 blockers for launch (in priority order)

Do not soften the findings. The founder is making a real decision off this.
```

---

## What to do with the output

1. Save Claude Code's response as `SECURITY_AUDIT_REPORT.md` in the repo.
2. Share it back here — I'll review for anything soft, missed, or marked PASS on thin evidence.
3. **No launch until all CRITICAL and HIGH items are PASS.** MEDIUM items can be tracked and fixed in the first pilot week. LOW can wait.
4. NOT-YET-BUILT items are fine if they're not on the launch path — but confirm none of them are gating real-data safety.
