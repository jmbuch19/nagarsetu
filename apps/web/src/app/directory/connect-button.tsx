"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import {
  requestConnection,
  revealContact,
  sendIntroEmail,
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
  const [showEmail, setShowEmail] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");

  // Migration 0042: reveal is no longer gated by openly_contactable / approved
  // connection — the directory listing itself is the reach consent. Any click
  // on WhatsApp or Email triggers the RPC, which returns whichever channels
  // are on file. The lone "locked" case left is the recipient having neither
  // a real phone nor an email yet (handled in the post-reveal branch). The
  // `openlyContactable` prop is kept on the component signature for a future
  // soft-preference badge ("prefers in-app request first") but no longer
  // gates anything.

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

  // Email is now a server-side relay (see sendIntroEmail): we send the message
  // to the recipient via Resend with reply-to = the sender, instead of a
  // mailto: link that silently fails in in-app browsers / when no mail app is
  // set. Clicking "Email" opens a short compose box; "Send email" relays it.
  function sendIntro() {
    setStatus(null);
    startTransition(async () => {
      const r = await sendIntroEmail(recipientId, emailMsg);
      setStatus(r.message ? { ok: r.ok, text: r.message } : null);
      if (r.ok) {
        setShowEmail(false);
        setEmailMsg("");
      }
    });
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

  // ── Slot 2: Email (opens the compose box; the relay sends server-side) ───
  const emailSlot = (
    <button
      type="button"
      onClick={() => {
        setStatus(null);
        setShowEmail((s) => !s);
      }}
      className={btnGhost}
    >
      {showEmail ? "Cancel" : "Email"}
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

      {/* Email compose — the message is relayed server-side to the recipient
          (reply-to = you), so it arrives even when the device has no mail app
          or is inside an in-app browser. */}
      {showEmail ? (
        <div className="w-full space-y-2">
          <textarea
            value={emailMsg}
            onChange={(e) => setEmailMsg(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Write your message — they'll get it by email and can reply straight to you."
            className={`${inputClass} resize-y`}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={sendIntro}
              disabled={pending}
              className={btnPrimary}
            >
              {pending ? "Sending…" : "Send email"}
            </button>
            <button
              type="button"
              onClick={() => setShowEmail(false)}
              className={btnGhost}
            >
              Cancel
            </button>
          </div>
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
