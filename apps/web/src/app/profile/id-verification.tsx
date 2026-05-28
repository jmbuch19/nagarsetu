"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB (matches the bucket limit)

const btnPrimary =
  "rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-50";

export function IdVerification({
  memberId,
  status,
}: {
  memberId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (status === "verified") {
    return (
      <div>
        <h2 className="text-lg font-medium text-brand-primary">
          Identity verification
        </h2>
        <p className="mt-2 inline-block rounded-full bg-brand-success/10 px-3 py-1 text-sm font-medium text-brand-success">
          ✓ Your identity is verified
        </p>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div>
        <h2 className="text-lg font-medium text-brand-primary">
          Identity verification
        </h2>
        <p className="mt-2 text-sm text-brand-text">
          Your ID is <strong>under review</strong>. We&apos;ll update your
          profile once a Nagarsetu admin has checked it — usually within a day
          or two.
        </p>
      </div>
    );
  }

  function submit() {
    setError(null);
    if (!file) {
      setError("Please choose a photo or PDF of your ID.");
      return;
    }
    if (!ACCEPTED.includes(file.type)) {
      setError("Please upload a JPG, PNG, WebP, or PDF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File is too large — please keep it under 5 MB.");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { error: upErr } = await supabase.storage
        .from("id-documents")
        .upload(`${memberId}/id-document`, file, {
          upsert: true,
          contentType: file.type,
        });
      if (upErr) {
        setError("Upload failed. Please try again.");
        return;
      }
      const { error: insErr } = await supabase
        .from("verifications")
        .insert({ member_id: memberId, method: "document" });
      if (insErr) {
        setError("Could not submit for review. Please try again.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <h2 className="text-lg font-medium text-brand-primary">
        Identity verification
      </h2>
      <p className="mt-1 text-sm text-brand-text-muted">
        Verify your identity with a government photo ID. This is needed only to
        host a stay or rent out a vehicle — not to use the rest of Jay Hatkesh.
      </p>
      <p className="mt-2 text-xs text-brand-text-muted">
        Your ID is private — only a Nagarsetu admin reviewing your verification
        can see it. It is never shown to other members.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm text-brand-text file:mr-3 file:rounded-lg file:border file:border-brand-border file:bg-white file:px-3 file:py-1.5 file:text-sm file:text-brand-text hover:file:border-brand-primary"
        />
        <button onClick={submit} disabled={pending} className={btnPrimary}>
          {pending ? "Submitting…" : "Submit for verification"}
        </button>
      </div>
      {error ? <p className="mt-2 text-xs text-brand-danger">{error}</p> : null}
    </div>
  );
}
