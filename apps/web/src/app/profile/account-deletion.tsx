"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  cancelAccountDeletion,
  requestAccountDeletion,
} from "./deletion-actions";

const GRACE_DAYS = 30;

const btnDanger =
  "rounded-lg bg-brand-danger px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";
const btnGhost =
  "rounded-lg border border-brand-border px-4 py-2 text-sm text-brand-text transition hover:border-brand-primary hover:text-brand-primary disabled:opacity-50";

function scheduledDate(requestedAt: string): string {
  const d = new Date(requestedAt);
  d.setDate(d.getDate() + GRACE_DAYS);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function AccountDeletion({
  deletionRequestedAt,
}: {
  deletionRequestedAt: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function request() {
    setError(null);
    startTransition(async () => {
      const r = await requestAccountDeletion();
      if (r.ok) {
        setConfirming(false);
        router.refresh();
      } else setError(r.message ?? "Something went wrong.");
    });
  }

  function cancel() {
    setError(null);
    startTransition(async () => {
      const r = await cancelAccountDeletion();
      if (r.ok) router.refresh();
      else setError(r.message ?? "Something went wrong.");
    });
  }

  // Pending deletion → prominent cancel banner.
  if (deletionRequestedAt) {
    return (
      <div className="rounded-lg border border-brand-danger/40 bg-brand-danger/10 p-4">
        <p className="text-sm font-medium text-brand-danger">
          Your account is scheduled to be permanently deleted on{" "}
          {scheduledDate(deletionRequestedAt)}.
        </p>
        <p className="mt-1 text-sm text-brand-text">
          You&apos;re now hidden from the directory and can&apos;t be reached.
          Changed your mind? Cancel any time before that date to keep your
          account.
        </p>
        <button
          onClick={cancel}
          disabled={pending}
          className={`${btnGhost} mt-3`}
        >
          {pending ? "Cancelling…" : "Cancel deletion — keep my account"}
        </button>
        {error ? (
          <p className="mt-2 text-xs text-brand-danger">{error}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-medium text-brand-danger">Delete account</h2>
      <p className="mt-1 text-sm text-brand-text-muted">
        This hides you from the community right away and permanently erases your
        profile and data after {GRACE_DAYS} days. You can cancel within that
        window by signing back in.
      </p>

      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className={`${btnGhost} mt-3 border-brand-danger/50 text-brand-danger hover:border-brand-danger`}
        >
          Delete my account
        </button>
      ) : (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-brand-text">
            Are you sure? Your profile, offerings, and connections will be
            removed.
          </p>
          <div className="flex gap-2">
            <button onClick={request} disabled={pending} className={btnDanger}>
              {pending ? "Processing…" : "Yes, delete my account"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={pending}
              className={btnGhost}
            >
              Keep my account
            </button>
          </div>
        </div>
      )}
      {error ? <p className="mt-2 text-xs text-brand-danger">{error}</p> : null}
    </div>
  );
}
