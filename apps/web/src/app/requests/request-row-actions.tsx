"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteRequest,
  setRequestStatus,
  type RequestActionState,
} from "./actions";

const btnGhost =
  "rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-text transition hover:border-brand-primary hover:text-brand-primary disabled:opacity-50";
const btnDanger =
  "rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-danger transition hover:border-brand-danger disabled:opacity-50";

export function RequestRowActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function setStatus(next: "open" | "closed") {
    setMsg(null);
    const fd = new FormData();
    fd.set("request_id", id);
    fd.set("status", next);
    startTransition(async () => {
      const r: RequestActionState = await setRequestStatus({ ok: false }, fd);
      if (r.ok) router.refresh();
      else setMsg(r.message ?? "Could not update.");
    });
  }

  function remove() {
    if (!confirm("Delete this request?")) return;
    const fd = new FormData();
    fd.set("request_id", id);
    startTransition(async () => {
      await deleteRequest(fd);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-2">
        {status === "open" ? (
          <button onClick={() => setStatus("closed")} disabled={pending} className={btnGhost}>
            Close
          </button>
        ) : (
          <button onClick={() => setStatus("open")} disabled={pending} className={btnGhost}>
            Reopen
          </button>
        )}
        <button onClick={remove} disabled={pending} className={btnDanger}>
          Delete
        </button>
      </div>
      {msg ? <p className="text-xs text-brand-danger">{msg}</p> : null}
    </div>
  );
}
