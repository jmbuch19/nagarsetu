"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reviewVerification, type ReviewState } from "../actions";

const btnApprove =
  "rounded-lg bg-brand-success px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50";
const btnReject =
  "rounded-lg border border-brand-danger/50 px-4 py-2 text-sm font-medium text-brand-danger transition hover:border-brand-danger disabled:opacity-50";

export function ReviewButtons({ verificationId }: { verificationId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function review(decision: "approve" | "reject") {
    setError(null);
    const fd = new FormData();
    fd.set("verification_id", verificationId);
    fd.set("decision", decision);
    fd.set("notes", notes);
    startTransition(async () => {
      const r: ReviewState = await reviewVerification({ ok: false }, fd);
      if (r.ok) router.refresh();
      else setError(r.message ?? "Something went wrong.");
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Review note (optional)"
        className="rounded-lg border border-brand-border bg-white px-3 py-1.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
      />
      <div className="flex gap-2">
        <button
          onClick={() => review("approve")}
          disabled={pending}
          className={btnApprove}
        >
          {pending ? "…" : "Approve"}
        </button>
        <button
          onClick={() => review("reject")}
          disabled={pending}
          className={btnReject}
        >
          Reject
        </button>
      </div>
      {error ? <p className="text-xs text-brand-danger">{error}</p> : null}
    </div>
  );
}
