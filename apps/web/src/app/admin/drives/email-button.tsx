"use client";

import { useState, useTransition } from "react";
import { emailDriveToMembers } from "./actions";

export function EmailDriveButton({
  driveId,
  alreadyEmailed,
  emailedCount,
}: {
  driveId: string;
  alreadyEmailed: boolean;
  emailedCount: number;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  if (alreadyEmailed) {
    return (
      <span className="text-xs text-brand-text-muted">
        Emailed · {emailedCount} sent
      </span>
    );
  }

  function fire() {
    if (
      !window.confirm(
        "Send this drive to ALL opted-in members by email? This is a one-shot — you can't re-send later.",
      )
    )
      return;
    const fd = new FormData();
    fd.set("id", driveId);
    startTransition(async () => {
      const r = await emailDriveToMembers(fd);
      setResult({ ok: r.ok, text: r.message ?? "" });
    });
  }

  return (
    <div className="flex items-center gap-2">
      {result ? (
        <span
          className={`text-xs ${result.ok ? "text-brand-success" : "text-brand-danger"}`}
        >
          {result.text}
        </span>
      ) : null}
      <button
        type="button"
        onClick={fire}
        disabled={pending}
        className="shrink-0 rounded-md border border-brand-border px-3 py-1 text-xs text-brand-text transition hover:border-brand-primary hover:text-brand-primary disabled:opacity-50"
      >
        {pending ? "Sending…" : "Email opted-in"}
      </button>
    </div>
  );
}
