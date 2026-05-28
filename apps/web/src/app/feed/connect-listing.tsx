"use client";

import { useState, useTransition } from "react";
import { expressInterest, type InterestState } from "./actions";

const btnPrimary =
  "rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-50";
const btnGhost =
  "rounded-lg border border-brand-border px-4 py-2 text-sm text-brand-text transition hover:border-brand-primary hover:text-brand-primary";
const inputClass =
  "w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary";

export function ConnectListing({ listingId }: { listingId: string }) {
  const [pending, startTransition] = useTransition();
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");
  const [waLink, setWaLink] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  function send() {
    startTransition(async () => {
      const r: InterestState = await expressInterest(listingId, note);
      if (r.ok && r.waLink) {
        setWaLink(r.waLink);
        setShowNote(false);
      } else if (r.ok) {
        setMessage({ ok: true, text: r.message ?? "Interest sent." });
        setShowNote(false);
      } else {
        setMessage({ ok: false, text: r.message ?? "Could not send." });
      }
    });
  }

  if (waLink) {
    return (
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className={btnPrimary}
      >
        Continue on WhatsApp ↗
      </a>
    );
  }

  return (
    <div className="flex w-full max-w-xs flex-col items-end gap-2">
      {!showNote ? (
        <button onClick={() => setShowNote(true)} className={btnPrimary}>
          I&apos;m interested
        </button>
      ) : (
        <div className="w-full space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="Add a short note (optional)."
            className={`${inputClass} resize-y`}
          />
          <div className="flex justify-end gap-2">
            <button onClick={send} disabled={pending} className={btnPrimary}>
              {pending ? "Sending…" : "Send interest"}
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
