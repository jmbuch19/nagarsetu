// Admin → Onboarding. The "half-started profiles" surface: members who signed
// up but haven't filled the required profile fields (name, surname, city, PIN,
// gender, DOB). Each row shows which fields are missing + a "Send sign-in link"
// button that re-sends the member their email magic link to nudge them back.
//
// Data comes from the is_admin()-gated admin_list_incomplete_members RPC
// (migration 0045) — RLS keeps members SELECT-own, so this function is the only
// way an admin sees other members' onboarding state. Access to the page itself
// is gated by the admin layout.

import { createClient } from "@/lib/supabase/server";
import { currentMs } from "@/lib/time";
import { ReloginButton } from "./relogin-button";

export const metadata = { title: "Onboarding — Admin" };

type Row = {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  welcomed_at: string | null;
  missing: string | null;
};

function ageDays(iso: string): number {
  return Math.floor((currentMs() - new Date(iso).getTime()) / 86_400_000);
}

export default async function AdminMembersPage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_list_incomplete_members");
  const rows = (data ?? []) as Row[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-light text-brand-primary">Onboarding</h1>
        <p className="mt-1 text-sm text-brand-text-muted">
          Members who signed up but haven&apos;t finished their profile. Send a
          fresh sign-in link to nudge them back in. Newest first.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-brand-text-muted">
          Everyone&apos;s profile is complete. 🎉
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-brand-border bg-white px-4 py-3 text-sm"
            >
              <div className="min-w-0">
                <span className="text-brand-text">
                  {m.full_name?.trim() || "(no name yet)"}
                </span>
                <span className="ml-2 break-all text-xs text-brand-text-muted">
                  · {m.email ?? "no email"} · missing: {m.missing || "—"} ·{" "}
                  {ageDays(m.created_at)}d ago
                  {m.welcomed_at ? "" : " · not welcomed"}
                </span>
              </div>
              <ReloginButton memberId={m.id} hasEmail={Boolean(m.email)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
