// Admin → ID verifications. Lists pending document submissions, links to each
// ID via a short-lived signed URL, and approves/rejects via the is_admin()-
// gated RPC. Gated by the /admin layout.

import { createClient } from "@/lib/supabase/server";
import { ReviewButtons } from "./review-buttons";

export const metadata = { title: "ID verifications — Admin" };

type VerificationRow = { id: string; member_id: string; created_at: string };

export default async function AdminVerificationsPage() {
  const supabase = await createClient();

  const { data: pendingData } = await supabase
    .from("verifications")
    .select("id, member_id, created_at")
    .eq("status", "pending")
    .eq("method", "document")
    .order("created_at");
  const pending = (pendingData ?? []) as VerificationRow[];

  const memberIds = [...new Set(pending.map((v) => v.member_id))];
  const { data: membersData } = memberIds.length
    ? await supabase
        .from("members")
        .select("id, full_name, surname")
        .in("id", memberIds)
    : { data: [] as { id: string; full_name: string | null; surname: string | null }[] };
  const nameById = new Map(
    (membersData ?? []).map((m) => [
      m.id,
      [m.full_name, m.surname].filter(Boolean).join(" ") || "A member",
    ]),
  );

  // Short-lived signed URLs for each ID doc (admin can read the bucket).
  const rows = await Promise.all(
    pending.map(async (v) => {
      const { data } = await supabase.storage
        .from("id-documents")
        .createSignedUrl(`${v.member_id}/id-document`, 300);
      return { ...v, signedUrl: data?.signedUrl ?? null };
    }),
  );

  return (
    <main>
      <h1 className="text-2xl font-light text-brand-primary">
        ID verifications
      </h1>
      <p className="mt-1 text-sm text-brand-text-muted">
        {rows.length === 0
          ? "No pending submissions."
          : `${rows.length} pending submission${rows.length === 1 ? "" : "s"}.`}
      </p>

      <ul className="mt-6 space-y-3">
        {rows.map((v) => (
          <li
            key={v.id}
            className="flex flex-col gap-3 rounded-2xl border border-brand-border bg-white p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-medium text-brand-text">
                {nameById.get(v.member_id)}
              </p>
              <p className="mt-0.5 text-xs text-brand-text-muted">
                Submitted {new Date(v.created_at).toLocaleDateString()}
              </p>
              {v.signedUrl ? (
                <a
                  href={v.signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm font-medium text-brand-primary underline"
                >
                  View ID document ↗
                </a>
              ) : (
                <p className="mt-2 text-xs text-brand-danger">
                  Document not found in storage.
                </p>
              )}
            </div>
            <div className="shrink-0">
              <ReviewButtons verificationId={v.id} />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
