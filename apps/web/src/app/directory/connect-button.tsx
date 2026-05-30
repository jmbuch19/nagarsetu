"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  requestConnection,
  revealContact,
  type ConnectionActionState,
} from "../connections/actions";

export type Relationship =
  | "none"
  | "pending_out"
  | "pending_in"
  | "approved"
  | "declined_out";

const btnPrimary =
  "rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-50";
const btnGhost =
  "rounded-lg border border-brand-border px-4 py-2 text-sm text-brand-text transition hover:border-brand-primary hover:text-brand-primary";
const inputClass =
  "w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary";

export function ConnectButton({
  recipientId,
  openlyContactable,
  relationship,
  context,
}: {
  recipientId: string;
  openlyContactable: boolean;
  relationship: Relationship;
  context?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [revealed, setRevealed] = useState<{
    waLink?: string;
    mailto?: string;
  } | null>(null);

  const canReveal = openlyContactable || relationship === "approved";

  // Two-click pattern (more reliable than auto-navigate after await — mailto:
  // especially needs a direct user gesture on the anchor, otherwise some
  // browsers/OS combos silently refuse to invoke the default mail handler).
  // The rpc returns BOTH channels in one call, so a single reveal unlocks
  // whichever buttons should appear as anchors.
  function reveal() {
    if (revealed) return;
    startTransition(async () => {
      const r = await revealContact(recipientId);
      if (!r.ok) {
        setMessage({ ok: false, text: r.message ?? "Could not reveal." });
        return;
      }
      setRevealed({ waLink: r.waLink, mailto: r.mailto });
    });
  }

  function sendRequest() {
    const fd = new FormData();
    fd.set("recipient_id", recipientId);
    fd.set("note", note);
    if (context) fd.set("context", context);
    startTransition(async () => {
      const r: ConnectionActionState = await requestConnection(
        { ok: false },
        fd,
      );
      setMessage(r.message ? { ok: r.ok, text: r.message } : null);
      if (r.ok) setShowNote(false);
    });
  }

  // Reachable now (openly contactable, or an approved connection). Sender
  // picks the channel: WhatsApp (fastest) or Email (always-on, more formal).
  // Pre-reveal: both as buttons (click either → reveal). Post-reveal: the
  // available channels become anchors with real hrefs that the user clicks
  // a second time to open. Two clicks total, but reliable for mailto:.
  if (canReveal) {
    const noneAvailable =
      revealed && !revealed.waLink && !revealed.mailto ? true : false;
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex flex-wrap justify-end gap-2">
          {/* WhatsApp side */}
          {revealed?.waLink ? (
            <a
              href={revealed.waLink}
              target="_blank"
              rel="noopener noreferrer"
              className={btnPrimary}
            >
              Open WhatsApp ↗
            </a>
          ) : !revealed ? (
            <button
              onClick={reveal}
              disabled={pending}
              className={btnPrimary}
            >
              {pending ? "…" : "WhatsApp"}
            </button>
          ) : null}
          {/* Email side */}
          {revealed?.mailto ? (
            <a href={revealed.mailto} className={btnGhost}>
              Open Email ↗
            </a>
          ) : !revealed ? (
            <button onClick={reveal} disabled={pending} className={btnGhost}>
              {pending ? "…" : "Email"}
            </button>
          ) : null}
        </div>
        {revealed && (revealed.waLink || revealed.mailto) ? (
          <p className="text-xs text-brand-text-muted">
            Tap to open.
          </p>
        ) : null}
        {noneAvailable ? (
          <p className="text-xs text-brand-danger">
            No contact channels on file yet — send a connection request below
            instead.
          </p>
        ) : null}
        {message && !message.ok ? (
          <p className="text-xs text-brand-danger">{message.text}</p>
        ) : null}
      </div>
    );
  }

  if (relationship === "pending_out") {
    return <span className="text-sm text-brand-text-muted">Request sent</span>;
  }

  if (relationship === "pending_in") {
    return (
      <Link href="/connections" className={btnGhost}>
        Respond →
      </Link>
    );
  }

  if (relationship === "declined_out") {
    return (
      <span className="text-sm text-brand-text-muted">Request declined</span>
    );
  }

  // No relationship yet → offer to request.
  return (
    <div className="flex w-full max-w-xs flex-col items-end gap-2">
      {!showNote ? (
        <button onClick={() => setShowNote(true)} className={btnPrimary}>
          Connect
        </button>
      ) : (
        <div className="w-full space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="Add a short note (optional) — e.g. why you'd like to connect."
            className={`${inputClass} resize-y`}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={sendRequest}
              disabled={pending}
              className={btnPrimary}
            >
              {pending ? "Sending…" : "Send request"}
            </button>
            <button onClick={() => setShowNote(false)} className={btnGhost}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {message ? (
        <p
          className={`text-xs ${message.ok ? "text-brand-success" : "text-brand-danger"}`}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
