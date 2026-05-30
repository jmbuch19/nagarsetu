// Transactional email templates (server-only). Plain inline-styled HTML for
// broad email-client support. User-provided values (name, title) are HTML-
// escaped to avoid injection. Connector ethos + brand tone preserved.

// Emails are read in external mail clients (Gmail, Outlook, etc.) — the links
// MUST point at the live site regardless of where the send action runs from.
// Hardcoded (not via NEXT_PUBLIC_APP_URL) so a local dev send never embeds a
// localhost URL recipients can't reach.
const APP_URL = "https://www.jayhatkesh.in";

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

function layout(
  bodyHtml: string,
  opts?: { unsubscribeUrl?: string },
): string {
  const unsubLine = opts?.unsubscribeUrl
    ? `<p style="margin:8px 0 0;font-size:11px;color:${MUTED};">
        You're receiving this because you opted in to community updates.
        <a href="${opts.unsubscribeUrl}" style="color:${MUTED};text-decoration:underline;">Unsubscribe</a>.
      </p>`
    : "";
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:${BG};font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:${INK};">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <img src="${APP_URL}/brand/emblem.png" alt="Jay Hatkesh" width="56" height="48" style="display:block;border:0;outline:none;margin:0 0 12px;" />
    <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${MUTED};">Nagarsetu — bridge of the community</p>
    <h1 style="margin:0 0 24px;font-size:26px;font-weight:300;color:${TEAL};">Jay Hatkesh!</h1>
    ${bodyHtml}
    <hr style="border:none;border-top:1px solid #DCE6DD;margin:28px 0 16px;" />
    <p style="margin:0;font-size:12px;color:${MUTED};">
      <a href="${APP_URL}" style="color:${TEAL};">jayhatkesh.in</a> ·
      Jay Hatkesh is a connector, not a party to any deal.
    </p>
    <p style="margin:8px 0 0;font-size:13px;color:${TEAL};">જય હાટકેશ</p>
    ${unsubLine}
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

// Closes the loop: when the recipient approves, the original requester gets
// this so they know the bridge is open. Names omitted (privacy posture matches
// the request email) — the in-app /connections page shows who.
export function connectionApprovedEmail(): {
  subject: string;
  html: string;
} {
  return {
    subject: "Your connection request was approved",
    html: layout(
      para("Hello,") +
        para(`A fellow Nagar has approved your connection request on Jay Hatkesh.`) +
        para(`Open <a href="${APP_URL}/connections" style="color:${TEAL};">Your connections</a> to see them, or head to the <a href="${APP_URL}/directory" style="color:${TEAL};">directory</a> to reach them on WhatsApp or email.`),
    ),
  };
}

// Warm welcome — a personal note from the (anonymous) founder. જય હાટકેશ opens
// and closes it; conveys why a self-funded, no-profit community portal matters
// and why each member's joining strengthens the whole circle.
export function welcomeEmail(name: string | null): {
  subject: string;
  html: string;
} {
  const greetName = name ? ` ${esc(name)}` : "";
  return {
    subject: "જય હાટકેશ — welcome to the family",
    html: layout(
      `<p style="margin:0 0 18px;font-size:20px;color:${TEAL};" lang="gu">જય હાટકેશ</p>` +
        para(`Welcome${greetName} — and thank you for joining.`) +
        para(
          `Jay Hatkesh isn't a company, a startup, or anyone's business venture. It's a quiet, <strong>self-funded labour of love</strong> — built by one fellow Nagar in Ahmedabad, who would rather stay unnamed, for one simple reason: our samaj was once a phone call away, and today we're scattered across cities and continents — yet a fellow Nagar's help, trust, and warmth is still the most valuable thing we have.`,
        ) +
        para(
          `There are <strong>no ads, no investors, no data ever sold, and no commission — ever</strong>. The only purpose is to bring us back within reach of one another: to find a doctor, a mentor, a room, a ride, a blood donor, a tutor — or simply a familiar, trusted hand — among our own people.`,
        ) +
        para(
          `And here is why <strong>your</strong> joining matters. This bridge is only as strong as the Nagars standing on it. Every detail you add to your profile, every skill or moment of time you offer, makes you findable to a fellow Nagar in need — and makes the whole circle more useful for everyone. You're not just signing up; you're becoming part of the answer.`,
        ) +
        para(
          `Please take two minutes to <a href="${APP_URL}/profile" style="color:${TEAL};">complete your profile</a> and tell the circle what you can offer — then explore: Connect, Find, Offer.`,
        ) +
        `<p style="margin:18px 0 4px;font-size:15px;line-height:1.6;">With warmth,</p>` +
        `<p style="margin:0;font-size:15px;color:${MUTED};">— a fellow Nagar · Ahmedabad</p>`,
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

// Community drive blast — sent to opted-in members when an admin rallies
// around a blood / emergency / help drive. Carries the connector disclaimer
// and the one-tap unsubscribe link (DPDP).
export type DriveEmailFields = {
  kind: string;
  title: string;
  body: string;
  bloodGroup: string | null;
  cityName: string | null;
  contactName: string | null;
  contactInfo: string | null;
};

const DRIVE_KIND_LABEL: Record<string, string> = {
  emergency: "Emergency",
  blood: "Blood needed",
  help: "Help drive",
  announcement: "Community announcement",
};

export function driveBlastEmail(
  drive: DriveEmailFields,
  unsubscribeUrl: string,
): { subject: string; html: string } {
  const label = DRIVE_KIND_LABEL[drive.kind] ?? "Community drive";
  const tag =
    drive.kind === "blood" && drive.bloodGroup
      ? `${label} · ${esc(drive.bloodGroup)}`
      : label;
  const cityLine = drive.cityName
    ? `<p style="margin:0 0 14px;font-size:13px;color:${MUTED};">${esc(drive.cityName)}</p>`
    : "";
  const contactLine =
    drive.contactName || drive.contactInfo
      ? para(
          `<strong>Reach:</strong> ${esc([drive.contactName, drive.contactInfo].filter(Boolean).join(" · "))}`,
        )
      : "";
  return {
    subject: `${label}: ${drive.title}`,
    html: layout(
      `<p style="display:inline-block;margin:0 0 8px;padding:3px 10px;border-radius:999px;background:#F5DDD4;color:#C2492E;font-size:12px;font-weight:600;">${tag}</p>
       <h2 style="margin:8px 0 6px;font-size:20px;font-weight:500;color:${INK};">${esc(drive.title)}</h2>
       ${cityLine}
       <p style="margin:0 0 14px;font-size:15px;line-height:1.6;white-space:pre-wrap;">${esc(drive.body)}</p>
       ${contactLine}
       <p style="margin:8px 0 0;font-size:13px;color:${MUTED};">
         Jay Hatkesh is a connector — please reach the contact directly.
         We don't manage funds or medical care.
       </p>`,
      { unsubscribeUrl },
    ),
  };
}

// Contact / suggestion query → sent to the project inbox; reply-to is the
// submitter (set in the action) so the founder can reply directly.
export function contactQueryEmail(
  name: string,
  email: string,
  phone: string,
  message: string,
): { subject: string; html: string } {
  return {
    subject: `New query from ${esc(name)}`,
    html: layout(
      para(`<strong>From:</strong> ${esc(name)}`) +
        para(`<strong>Email:</strong> ${esc(email)}`) +
        (phone ? para(`<strong>Phone:</strong> ${esc(phone)}`) : "") +
        para(`<strong>Message:</strong>`) +
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;white-space:pre-wrap;">${esc(message)}</p>`,
    ),
  };
}
