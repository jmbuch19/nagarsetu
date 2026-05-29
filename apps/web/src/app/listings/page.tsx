// Your listings — Phase 1 §4. A member's own listings across all statuses,
// with publish (free categories) / pause / resume / delete via the gated
// set_listing_status function.

import { redirect } from "next/navigation";
import Link from "next/link";
import { identity } from "@nagarsetu/shared";
import { createClient } from "@/lib/supabase/server";
import { ListingRowActions } from "./listing-row-actions";

export const metadata = { title: `Your listings — ${identity.name.en}` };

const CATEGORY_LABELS: Record<string, string> = {
  business: "Business",
  room: "Room",
  vehicle: "Vehicle",
  pg: "PG / Hostel",
  goods: "Goods",
  tour: "Tour",
  service: "Service",
  expert: "Expert session",
  education: "Education",
};

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-brand-surface text-brand-text-muted",
  active: "bg-brand-success/10 text-brand-success",
  paused: "bg-brand-warning/10 text-brand-warning",
  expired: "bg-brand-danger/10 text-brand-danger",
};

type Listing = {
  id: string;
  title: string;
  status: string;
  expires_at: string | null;
  category_id: string;
};

export default async function ListingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/join");

  const [listingsRes, catsRes] = await Promise.all([
    supabase
      .from("listings")
      .select("id, title, status, expires_at, category_id")
      .eq("member_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("listing_categories").select("id, name"),
  ]);

  const listings = (listingsRes.data ?? []) as Listing[];
  const catName = new Map(
    (catsRes.data ?? []).map((c) => [c.id, c.name as string]),
  );

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-brand-primary">
            Your listings
          </h1>
          <p className="mt-1 text-sm text-brand-text-muted">
            Create, publish, pause, and renew what you offer the community.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href="/listings/leads"
            className="rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-text transition hover:border-brand-primary hover:text-brand-primary"
          >
            Leads
          </Link>
          <Link
            href="/listings/new"
            className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-primary-dark"
          >
            + New listing
          </Link>
        </div>
      </header>

      {listings.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-brand-border bg-white p-6 text-center text-sm text-brand-text-muted">
          You haven&apos;t created any listings yet. Tap “New listing” to offer
          something to the circle.
        </p>
      ) : (
        <ul className="space-y-3">
          {listings.map((l) => {
            const cat = catName.get(l.category_id);
            return (
              <li
                key={l.id}
                className="flex flex-col gap-3 rounded-2xl border border-brand-border bg-white p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-brand-text">{l.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-brand-text-muted">
                      {cat ? (CATEGORY_LABELS[cat] ?? cat) : ""}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 font-medium ${STATUS_STYLE[l.status] ?? "bg-brand-surface text-brand-text-muted"}`}
                    >
                      {l.status}
                    </span>
                    {l.status === "active" && l.expires_at ? (
                      <span className="text-brand-text-muted">
                        until {new Date(l.expires_at).toLocaleDateString()}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="shrink-0">
                  <ListingRowActions id={l.id} status={l.status} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-6 text-xs text-brand-text-muted">
        Jay Hatkesh is a connector — the deal and payment happen directly
        between members, offline. We never take a commission.
      </p>
    </main>
  );
}
