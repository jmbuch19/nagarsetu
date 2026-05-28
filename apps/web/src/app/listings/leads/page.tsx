// Lead Inbox — Phase 1 §4. The inquiries members have made on the current
// member's listings. (The provider's "I'm interested" leads.)

import { redirect } from "next/navigation";
import Link from "next/link";
import { identity } from "@nagarsetu/shared";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: `Your leads — ${identity.name.en}` };

type Inquiry = {
  id: string;
  listing_id: string;
  seeker_id: string;
  message: string | null;
  status: string;
  created_at: string;
};

export default async function LeadsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: myListings } = await supabase
    .from("listings")
    .select("id, title")
    .eq("member_id", user.id);
  const listingTitle = new Map(
    (myListings ?? []).map((l) => [l.id, l.title as string]),
  );
  const myIds = [...listingTitle.keys()];

  const inqRes = myIds.length
    ? await supabase
        .from("inquiries")
        .select("id, listing_id, seeker_id, message, status, created_at")
        .in("listing_id", myIds)
        .order("created_at", { ascending: false })
    : { data: [] as Inquiry[] };
  const inquiries = (inqRes.data ?? []) as Inquiry[];

  const seekerIds = [...new Set(inquiries.map((i) => i.seeker_id))];
  const seekersRes = seekerIds.length
    ? await supabase
        .from("members_directory")
        .select("id, full_name, surname")
        .in("id", seekerIds)
    : { data: [] as { id: string; full_name: string | null; surname: string | null }[] };
  const seekerName = new Map(
    (seekersRes.data ?? []).map((s) => [
      s.id,
      [s.full_name, s.surname].filter(Boolean).join(" ") || "A member",
    ]),
  );

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-brand-primary">Your leads</h1>
          <p className="mt-1 text-sm text-brand-text-muted">
            Members who expressed interest in your listings.
          </p>
        </div>
        <Link
          href="/listings"
          className="shrink-0 rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-text transition hover:border-brand-primary hover:text-brand-primary"
        >
          Your listings
        </Link>
      </header>

      {inquiries.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-brand-border bg-white p-6 text-center text-sm text-brand-text-muted">
          No leads yet. When someone taps “I&apos;m interested” on your listing,
          it&apos;ll show here.
        </p>
      ) : (
        <ul className="space-y-3">
          {inquiries.map((i) => (
            <li
              key={i.id}
              className="rounded-2xl border border-brand-border bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-brand-text">
                  {seekerName.get(i.seeker_id)}
                </p>
                <span className="text-xs text-brand-text-muted">
                  {listingTitle.get(i.listing_id) ?? "—"} ·{" "}
                  {new Date(i.created_at).toLocaleDateString()}
                </span>
              </div>
              {i.message ? (
                <p className="mt-1 text-sm text-brand-text">{i.message}</p>
              ) : (
                <p className="mt-1 text-sm text-brand-text-muted">
                  expressed interest.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
