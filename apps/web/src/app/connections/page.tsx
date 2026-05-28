// Connections inbox — Phase 1 §3 (the consent side of "permissioned contact
// reveal"). Incoming requests to approve/decline, outgoing requests awaiting a
// response, and approved connections with a WhatsApp deep-link. Contact is
// revealed only through the revealContact server action (ConnectButton).

import { redirect } from "next/navigation";
import Link from "next/link";
import { identity } from "@nagarsetu/shared";
import { createClient } from "@/lib/supabase/server";
import { RespondButtons } from "./respond-buttons";
import { ConnectButton } from "../directory/connect-button";

export const metadata = { title: `Connections — ${identity.name.en}` };

type RequestRow = {
  id: string;
  requester_id: string;
  recipient_id: string;
  note: string | null;
  context: string | null;
  status: string;
  created_at: string;
};

type DirRow = {
  id: string;
  full_name: string | null;
  surname: string | null;
  openly_contactable: boolean;
};

export default async function ConnectionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: reqsData } = await supabase
    .from("connection_requests")
    .select("id, requester_id, recipient_id, note, context, status, created_at")
    .order("created_at", { ascending: false });
  const reqs = (reqsData ?? []) as RequestRow[];

  const otherIds = [
    ...new Set(reqs.flatMap((r) => [r.requester_id, r.recipient_id])),
  ].filter((id) => id !== user.id);

  const dirRes = otherIds.length
    ? await supabase
        .from("members_directory")
        .select("id, full_name, surname, openly_contactable")
        .in("id", otherIds)
    : { data: [] as DirRow[] };
  const memberById = new Map(
    ((dirRes.data ?? []) as DirRow[]).map((d) => [d.id, d]),
  );
  const nameOf = (id: string) => {
    const m = memberById.get(id);
    const name = m ? [m.full_name, m.surname].filter(Boolean).join(" ") : "";
    return name || "A member";
  };

  const incomingPending = reqs.filter(
    (r) => r.recipient_id === user.id && r.status === "pending",
  );
  const approved = reqs.filter((r) => r.status === "approved");
  const outgoingPending = reqs.filter(
    (r) => r.requester_id === user.id && r.status === "pending",
  );

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-brand-primary">
            Your connections
          </h1>
          <p className="mt-1 text-sm text-brand-text-muted">
            Requests you&apos;ve received and sent, and members you&apos;re now
            connected with.
          </p>
        </div>
        <Link
          href="/directory"
          className="shrink-0 rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-text transition hover:border-brand-primary hover:text-brand-primary"
        >
          Browse directory
        </Link>
      </header>

      {/* Incoming requests to respond to */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-brand-text uppercase">
          Requests to you
        </h2>
        {incomingPending.length === 0 ? (
          <p className="text-sm text-brand-text-muted">No pending requests.</p>
        ) : (
          <ul className="space-y-3">
            {incomingPending.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-3 rounded-2xl border border-brand-border bg-white p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-brand-text">
                    {nameOf(r.requester_id)}
                  </p>
                  {r.note ? (
                    <p className="mt-1 text-sm text-brand-text">{r.note}</p>
                  ) : (
                    <p className="mt-1 text-sm text-brand-text-muted">
                      wants to connect with you.
                    </p>
                  )}
                </div>
                <div className="shrink-0">
                  <RespondButtons id={r.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Approved connections */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-brand-text uppercase">
          Connected
        </h2>
        {approved.length === 0 ? (
          <p className="text-sm text-brand-text-muted">
            No connections yet. Browse the directory to reach out.
          </p>
        ) : (
          <ul className="space-y-3">
            {approved.map((r) => {
              const other =
                r.requester_id === user.id ? r.recipient_id : r.requester_id;
              return (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-brand-border bg-white p-4 shadow-sm"
                >
                  <p className="font-medium text-brand-text">{nameOf(other)}</p>
                  <ConnectButton
                    recipientId={other}
                    openlyContactable={
                      memberById.get(other)?.openly_contactable ?? false
                    }
                    relationship="approved"
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Outgoing pending */}
      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-brand-text uppercase">
          Requests you sent
        </h2>
        {outgoingPending.length === 0 ? (
          <p className="text-sm text-brand-text-muted">No pending requests.</p>
        ) : (
          <ul className="space-y-3">
            {outgoingPending.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-brand-border bg-white p-4 shadow-sm"
              >
                <p className="font-medium text-brand-text">
                  {nameOf(r.recipient_id)}
                </p>
                <span className="text-sm text-brand-text-muted">
                  Awaiting response
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
