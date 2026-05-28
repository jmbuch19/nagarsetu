"use client";

import { useState, useTransition } from "react";
import { respondToRequest, type RespondState } from "./actions";

const btnPrimary =
  "rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-50";

export function RespondRequest({ requestId }: { requestId: string }) {
  const [pending, startTransition] = useTransition();
  const [waLink, setWaLink] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  function help() {
    setMsg(null);
    startTransition(async () => {
      const r: RespondState = await respondToRequest(requestId);
      if (r.ok && r.waLink) setWaLink(r.waLink);
      else setMsg(r.message ?? "Could not reach this member.");
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
    <div className="flex flex-col items-end gap-1">
      <button onClick={help} disabled={pending} className={btnPrimary}>
        {pending ? "…" : "I can help"}
      </button>
      {msg ? <p className="text-xs text-brand-danger">{msg}</p> : null}
    </div>
  );
}
