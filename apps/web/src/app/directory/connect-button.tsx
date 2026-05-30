"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import {
  requestConnection,
  revealContact,
  withdrawConnectionRequest,
  type ConnectionActionState,
  type RevealState,
} from "../connections/actions";

export type Relationship =
  | "none"
  | "pending_out"
  | "pending_in"
  | "approved"
  | "declined_out";

const btnPrimary =
  "rounded-lg bg-brand-primary px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-50";
const btnGhost =
  "rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-text transition hover:border-brand-primary hover:text-brand-primary disabled:cursor-not-allowed disabled:opacity-50";
const btnMuted =
  "rounded-lg border border-brand-border bg-brand-bg-muted px-3 py-2 text-sm text-brand-text-muted";
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
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [revealed, setRevealed] = useState<RevealState | null>(null);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [emailCopied, setEmailCopied] = useState(false);

  const canReveal = openlyContactable || relationship === "approved";

  // Channel-aware "why is this locked" copy so a member never clicks into a
  // dead end. Tells the sender what state they're in AND the next step.
  function lockedReason(channel: "WhatsApp" | "Email"): string {
    if (relationship === "pending_out")
      return `Waiting for them to approve your connection request — ${channel} opens up the moment they accept.`;
    if (relationship === "pending_in")
      return `They've sent you a connection request first — respond from Connections, and ${channel} unlocks for both of you.`;
    if (relationship === "declined_out")
      return `They declined your connection request, so ${channel} stays private.`;
    return `This member keeps ${channel} private. Use in-app Connect to send them a request — once they approve, ${channel} opens up.`;
  }

  // Single shared reveal call: the RPC returns whichever channels are on file
  // in one round-trip. Cached in state so a second click on either button is
  // instant.
  function ensureRevealed(onDone: (r: RevealState) => void) {
    if (revealed) {
      onDone(revealed);
      return;
    }
    startTransition(async () => {
      const r = await revealContact(recipientId);
      if (!r.ok) {
        setStatus({
          ok: false,
          text: r.message ?? "Could not reveal contact details.",
        });
        return;
      }
      setRevealed(r);
      onDone(r);
    });
  }

  function handleWhatsAppClick() {
    setStatus(null);
    if (!canReveal) {
      setStatus({ ok: false, text: lockedReason("WhatsApp") });
      return;
    }
    ensureRevealed((r) => {
      if (!r.waLink) {
        setStatus({
          ok: false,
          text: "This member hasn't added a WhatsApp number yet. Try Email or in-app Connect.",
        });
      } else {
        setStatus({ ok: true, text: "Tap Open WhatsApp ↗ to start the chat." });
      }
    });
  }

  function handleEmailClick() {
    setStatus(null);
    if (!canReveal) {
      setStatus({ ok: false, text: lockedReason("Email") });
      return;
    }
    ensureRevealed((r) => {
      if (!r.email) {
        setStatus({
          ok: false,
          text: "This member hasn't added an email yet. Try WhatsApp or in-app Connect.",
        });
      } else {
        setStatus({
          ok: true,
          text: "Tap Open Email ↗ to launch your mail app — or copy the address below if it doesn't open.",
        });
      }
    });
  }

  function copyEmail() {
    if (!revealed?.email) return;
    void navigator.clipboard.writeText(revealed.email).then(
      () => {
        setEmailCopied(true);
        setTimeout(() => setEmailCopied(false), 2000);
      },
      () => {
        setStatus({
          ok: false,
          text: "Couldn't copy automatically — long-press the address to copy it manually.",
        });
      },
    );
  }

  function sendRequest() {
    setStatus(null);
    const fd = new FormData();
    fd.set("recipient_id", recipientId);
    fd.set("note", note);
    if (context) fd.set("context", context);
    startTransition(async () => {
      const r: ConnectionActionState = await requestConnection(
        { ok: false },
        fd,
      );
      setStatus(r.message ? { ok: r.ok, text: r.message } : null);
      if (r.ok) {
        setShowNote(false);
        setNote("");
        router.refresh();
      }
    });
  }

  function withdraw() {
    setStatus(null);
    startTransition(async () => {
      const r = await withdrawConnectionRequest(recipientId);
      if (r.ok) {
        setStatus({ ok: true, text: "Connection request withdrawn." });
        router.refresh();
      } else {
        setStatus({
          ok: false,
          text: r.message ?? "Could not withdraw the request.",
        });
      }
    });
  }

  // ── Slot 1: WhatsApp ───────────────────────────────────────────────────
  const whatsappSlot = revealed?.waLink ? (
    <a
      href={revealed.waLink}
      target="_blank"
      rel="noopener noreferrer"
      className={btnPrimary}
    >
      Open WhatsApp ↗
    </a>
  ) : (
    <button
      type="button"
      onClick={handleWhatsAppClick}
      disabled={pending}
      className={btnPrimary}
    >
      {pending && !revealed ? "…" : "WhatsApp"}
    </button>
  );

  // ── Slot 2: Email ──────────────────────────────────────────────────────
  const emailSlot = revealed?.mailto ? (
    <a href={revealed.mailto} className={btnGhost}>
      Open Email ↗
    </a>
  ) : (
    <button
      type="button"
      onClick={handleEmailClick}
      disabled={pending}
      className={btnGhost}
    >
      {pending && !revealed ? "…" : "Email"}
    </button>
  );

  // ── Slot 3: In-app Connect (always rendered, reflects relationship) ────
  let connectSlot: ReactNode;
  if (relationship === "approved") {
    connectSlot = <span className={btnMuted}>Connected ✓</span>;
  } else if (relationship === "pending_out") {
    connectSlot = (
      <div className="flex flex-col items-end gap-0.5">
        <span className={btnMuted}>Request sent</span>
        <button
          type="button"
          onClick={withdraw}
          disabled={pending}
          className="text-xs text-brand-text-muted underline underline-offset-2 hover:text-brand-danger disabled:opacity-50"
        >
          {pending ? "Withdrawing…" : "Withdraw"}
        </button>
      </div>
    );
  } else if (relationship === "pending_in") {
    connectSlot = (
      <Link href="/connections" className={btnGhost}>
        Respond →
      </Link>
    );
  } else if (relationship === "declined_out") {
    connectSlot = <span className={btnMuted}>Request declined</span>;
  } else {
    connectSlot = (
      <button
        type="button"
        onClick={() => {
          setStatus(null);
          setShowNote((s) => !s);
        }}
        className={btnGhost}
      >
        {showNote ? "Cancel" : "Connect"}
      </button>
    );
  }

  return (
    <div className="flex w-full max-w-xs flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        {whatsappSlot}
        {emailSlot}
        {connectSlot}
      </div>

      {/* Email address fallback — always shown after reveal so the OS-default
          mailto: failure case still lets the sender copy the address. */}
      {revealed?.email ? (
        <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-brand-text-muted">
          <span className="break-all">{revealed.email}</span>
          <button
            type="button"
            onClick={copyEmail}
            className="rounded border border-brand-border px-1.5 py-0.5 hover:border-brand-primary hover:text-brand-primary"
          >
            {emailCopied ? "Copied ✓" : "Copy"}
          </button>
        </div>
      ) : null}

      {showNote && relationship === "none" ? (
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
              type="button"
              onClick={sendRequest}
              disabled={pending}
              className={btnPrimary}
            >
              {pending ? "Sending…" : "Send request"}
            </button>
            <button
              type="button"
              onClick={() => setShowNote(false)}
              className={btnGhost}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {status ? (
        <p
          className={`text-xs ${status.ok ? "text-brand-success" : "text-brand-danger"}`}
        >
          {status.text}
        </p>
      ) : null}
    </div>
  );
}
