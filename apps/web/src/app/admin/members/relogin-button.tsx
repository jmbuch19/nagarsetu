"use client";

import { useState, useTransition } from "react";
import { sendReloginLink } from "./actions";

export function ReloginButton({
  memberId,
  hasEmail,
}: {
  memberId: string;
  hasEmail: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  if (!hasEmail) {
    return (
      <span className="shrink-0 text-xs text-brand-text-muted">No email</span>
    );
  }

  function fire() {
    setResult(null);
    startTransition(async () => {
      const r = await sendReloginLink(memberId);
      setResult({ ok: r.ok, text: r.message ?? "" });
    });
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
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
        disabled={pending || (result?.ok ?? false)}
        className="rounded-md border border-brand-border px-3 py-1 text-xs text-brand-text transition hover:border-brand-primary hover:text-brand-primary disabled:opacity-50"
      >
        {pending ? "Sending…" : result?.ok ? "Sent ✓" : "Send sign-in link"}
      </button>
    </div>
  );
}
