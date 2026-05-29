// Transactional email templates (server-only). Plain inline-styled HTML for
// broad email-client support. User-provided values (name, title) are HTML-
// escaped to avoid injection. Connector ethos + brand tone preserved.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.jayhatkesh.in";

const TEAL = "#0E6B6B";
const INK = "#1E2A2A";
const MUTED = "#5B6B6B";
const BG = "#FBFAF5";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout(bodyHtml: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:${BG};font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:${INK};">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${MUTED};">Nagarsetu — bridge of the community</p>
    <h1 style="margin:0 0 24px;font-size:26px;font-weight:300;color:${TEAL};">Jay Hatkesh</h1>
    ${bodyHtml}
    <hr style="border:none;border-top:1px solid #DCE6DD;margin:28px 0 16px;" />
    <p style="margin:0;font-size:12px;color:${MUTED};">
      <a href="${APP_URL}" style="color:${TEAL};">jayhatkesh.in</a> ·
      Jay Hatkesh is a connector, not a party to any deal.
    </p>
    <p style="margin:8px 0 0;font-size:13px;color:${TEAL};">જય હાટકેશ</p>
  </div>
</body></html>`;
}

function para(text: string): string {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;">${text}</p>`;
}

function hi(name: string | null): string {
  return name ? `Hello ${esc(name)},` : "Hello,";
}

export function deletionScheduledEmail(
  name: string | null,
  scheduledDate: string,
): { subject: string; html: string } {
  return {
    subject: "Your Jay Hatkesh account is scheduled for deletion",
    html: layout(
      para(hi(name)) +
        para(
          `Your account is scheduled to be permanently deleted on <strong>${esc(scheduledDate)}</strong>. You're now hidden from the directory.`,
        ) +
        para(
          `Changed your mind? Sign in any time before that date and tap <strong>Cancel deletion</strong> to keep your account.`,
        ),
    ),
  };
}

export function deletionCancelledEmail(name: string | null): {
  subject: string;
  html: string;
} {
  return {
    subject: "Your Jay Hatkesh account deletion was cancelled",
    html: layout(
      para(hi(name)) +
        para(
          `Good to have you back — your scheduled deletion has been cancelled and your account is active again.`,
        ),
    ),
  };
}

// ── Cross-member notifications (TEMPORARY test-phase — move to WhatsApp at
// WABA cutover). Recipient names are not included (privacy + the in-app
// inbox shows who); the note, if any, is escaped. ──────────────────────────
export function leadEmail(listingTitle: string): {
  subject: string;
  html: string;
} {
  return {
    subject: "Someone's interested in your listing",
    html: layout(
      para("Hello,") +
        para(`A fellow Nagar is interested in your listing <strong>“${esc(listingTitle)}”</strong>.`) +
        para(`Open <a href="${APP_URL}/listings/leads" style="color:${TEAL};">Your leads</a> to see who and continue the conversation.`),
    ),
  };
}

export function connectionRequestEmail(note: string | null): {
  subject: string;
  html: string;
} {
  return {
    subject: "New connection request on Jay Hatkesh",
    html: layout(
      para("Hello,") +
        para(`A fellow Nagar would like to connect with you.`) +
        (note ? para(`They wrote: <em>“${esc(note)}”</em>`) : "") +
        para(`Open <a href="${APP_URL}/connections" style="color:${TEAL};">Your connections</a> to approve and share contact.`),
    ),
  };
}

export function listingPublishedEmail(
  name: string | null,
  title: string,
  expiresDate: string | null,
): { subject: string; html: string } {
  return {
    subject: "Your listing is live on Jay Hatkesh",
    html: layout(
      para(hi(name)) +
        para(`Your listing <strong>“${esc(title)}”</strong> is now live in the community feed.`) +
        (expiresDate
          ? para(`It stays active until <strong>${esc(expiresDate)}</strong> — you can renew it from “Your listings” when it lapses.`)
          : "") +
        para(`When a member is interested, you'll see them in your leads.`),
    ),
  };
}
