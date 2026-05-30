"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  addEndorsement,
  removeEndorsement,
  type PraiseActionState,
} from "./praise-actions";

const NOTE_MAX = 280;

const btnSubtle =
  "rounded-lg border border-brand-gold/40 px-3 py-1.5 text-sm text-brand-text transition hover:border-brand-gold hover:text-brand-gold disabled:cursor-not-allowed disabled:opacity-50";
const btnPraised =
  "rounded-lg border border-brand-gold/60 bg-brand-gold/10 px-3 py-1.5 text-sm font-medium text-brand-gold transition hover:border-brand-danger hover:text-brand-danger disabled:cursor-not-allowed disabled:opacity-50";
const btnPrimary =
  "rounded-lg bg-brand-primary px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-50";
const btnGhost =
  "rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-text transition hover:border-brand-primary hover:text-brand-primary";
const inputClass =
  "w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary";

export function PraiseButton({
  recipientId,
  endorsedByMe,
}: {
  recipientId: string;
  endorsedByMe: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  function submitPraise() {
    setStatus(null);
    const fd = new FormData();
    fd.set("recipient_id", recipientId);
    fd.set("note", note);
    startTransition(async () => {
      const r: PraiseActionState = await addEndorsement({ ok: false }, fd);
      if (r.ok) {
        setOpen(false);
        setNote("");
        router.refresh();
      } else {
        setStatus({ ok: false, text: r.message ?? "Could not praise." });
      }
    });
  }

  function revoke() {
    setStatus(null);
    startTransition(async () => {
      const r = await removeEndorsement(recipientId);
      if (r.ok) {
        router.refresh();
      } else {
        setStatus({
          ok: false,
          text: r.message ?? "Could not remove praise.",
        });
      }
    });
  }

  if (endorsedByMe) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={revoke}
          disabled={pending}
          className={btnPraised}
        >
          {pending ? "…" : "Praised ✓"}
        </button>
        <p className="text-xs text-brand-text-muted">Tap to revoke.</p>
        {status && !status.ok ? (
          <p className="text-xs text-brand-danger">{status.text}</p>
        ) : null}
      </div>
    );
  }

  if (!open) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={() => {
            setStatus(null);
            setOpen(true);
          }}
          className={btnSubtle}
        >
          Praise
        </button>
        {status && !status.ok ? (
          <p className="text-xs text-brand-danger">{status.text}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="w-full max-w-xs space-y-2">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={NOTE_MAX}
        rows={2}
        placeholder="Why? — e.g. honest with prices, helped my mother quickly. (Optional)"
        className={`${inputClass} resize-y`}
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={submitPraise}
          disabled={pending}
          className={btnPrimary}
        >
          {pending ? "Praising…" : "Praise"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setNote("");
          }}
          className={btnGhost}
        >
          Cancel
        </button>
      </div>
      {status && !status.ok ? (
        <p className="text-xs text-brand-danger">{status.text}</p>
      ) : null}
    </div>
  );
}
