// Resend transactional email send (server-only). Used for app-triggered
// transactional mail (receipts, account/listing confirmations). Auth emails
// (sign-in magic link) go through Supabase Auth's own SMTP, not this.
//
// Best-effort by design: a failed/again-unconfigured send NEVER breaks the
// calling action — email is a notification, not the critical path. If
// RESEND_API_KEY isn't set yet, this no-ops with a server log.
//
// Reply-to: defaults to the public contact inbox (info@) so a member who hits
// "reply" on a transactional email (welcome, receipt) reaches a real person
// instead of the unmonitored no-reply@ sender. Callers can override — e.g. the
// contact form sets reply-to to the submitter.

import { contact } from "@nagarsetu/shared";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ ok: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Jay Hatkesh <no-reply@jayhatkesh.in>";
  const replyToAddress = replyTo ?? contact.email;

  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — skipping send to", to);
    return { ok: false };
  }
  if (!to) return { ok: false };

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
        reply_to: replyToAddress,
      }),
    });
    if (!res.ok) {
      console.error("[email] Resend send failed", res.status);
      return { ok: false };
    }
    return { ok: true };
  } catch (e) {
    console.error("[email] Resend send error", e);
    return { ok: false };
  }
}
