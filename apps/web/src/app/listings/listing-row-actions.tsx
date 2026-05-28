"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteListing, setListingStatus, type StatusState } from "./actions";

const btnPrimary =
  "rounded-lg bg-brand-primary px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand-primary-dark disabled:opacity-50";
const btnGhost =
  "rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-text transition hover:border-brand-primary hover:text-brand-primary disabled:opacity-50";
const btnDanger =
  "rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-danger transition hover:border-brand-danger disabled:opacity-50";

export function ListingRowActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function act(action: "publish" | "pause" | "resume") {
    setMsg(null);
    const fd = new FormData();
    fd.set("listing_id", id);
    fd.set("action", action);
    startTransition(async () => {
      const r: StatusState = await setListingStatus({ ok: false }, fd);
      if (r.ok) router.refresh();
      else setMsg(r.message ?? "Could not update.");
    });
  }

  function remove() {
    if (!confirm("Delete this listing?")) return;
    const fd = new FormData();
    fd.set("listing_id", id);
    startTransition(async () => {
      await deleteListing(fd);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-2">
        {status === "draft" || status === "expired" ? (
          <button onClick={() => act("publish")} disabled={pending} className={btnPrimary}>
            Publish
          </button>
        ) : null}
        {status === "active" ? (
          <button onClick={() => act("pause")} disabled={pending} className={btnGhost}>
            Pause
          </button>
        ) : null}
        {status === "paused" ? (
          <button onClick={() => act("resume")} disabled={pending} className={btnGhost}>
            Resume
          </button>
        ) : null}
        <button onClick={remove} disabled={pending} className={btnDanger}>
          Delete
        </button>
      </div>
      {msg ? <p className="max-w-xs text-right text-xs text-brand-danger">{msg}</p> : null}
    </div>
  );
}
