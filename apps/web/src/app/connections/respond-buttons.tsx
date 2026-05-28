"use client";

import { useState, useTransition } from "react";
import { respondToRequest, type ConnectionActionState } from "./actions";

const btnPrimary =
  "rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-50";
const btnGhost =
  "rounded-lg border border-brand-border px-4 py-2 text-sm text-brand-text transition hover:border-brand-danger hover:text-brand-danger disabled:opacity-50";

export function RespondButtons({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function respond(decision: "approve" | "decline") {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("decision", decision);
    startTransition(async () => {
      const r: ConnectionActionState = await respondToRequest({ ok: false }, fd);
      if (!r.ok) setError(r.message ?? "Could not update.");
      // On success the route revalidates and this request moves sections.
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => respond("approve")}
        disabled={pending}
        className={btnPrimary}
      >
        {pending ? "…" : "Approve"}
      </button>
      <button
        onClick={() => respond("decline")}
        disabled={pending}
        className={btnGhost}
      >
        Decline
      </button>
      {error ? <span className="text-xs text-brand-danger">{error}</span> : null}
    </div>
  );
}
