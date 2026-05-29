// Admin → Member posts. Moderation surface for closing stale listings / open
// requests that have lost relevance (the cross-owner case the rail/feed need).
// Oldest first, so long-pending posts surface at the top. Access gated by the
// admin layout; the close action calls the is_admin()-gated admin_close_post.

import { createClient } from "@/lib/supabase/server";
import { currentMs } from "@/lib/time";
import { adminClosePost } from "./actions";

export const metadata = { title: "Member posts — Admin" };

type ListingRow = {
  id: string;
  member_id: string;
  title: string;
  location_city_id: string | null;
  created_at: string;
};
type RequestRow = {
  id: string;
  member_id: string;
  category_id: string;
  city_id: string | null;
  details: string | null;
  created_at: string;
};
type Owner = { id: string; full_name: string | null; surname: string | null };

function ageDays(iso: string): number {
  return Math.floor((currentMs() - new Date(iso).getTime()) / 86_400_000);
}

export default async function AdminPostsPage() {
  const supabase = await createClient();
  const [listRes, reqRes, catRes, cityRes] = await Promise.all([
    supabase
      .from("listings")
      .select("id, member_id, title, location_city_id, created_at")
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(100),
    supabase
      .from("requests")
      .select("id, member_id, category_id, city_id, details, created_at")
      .eq("status", "open")
      .order("created_at", { ascending: true })
      .limit(100),
    supabase.from("listing_categories").select("id, name"),
    supabase.from("cities").select("id, name"),
  ]);

  const listings = (listRes.data ?? []) as ListingRow[];
  const requests = (reqRes.data ?? []) as RequestRow[];
  const catName = new Map(
    ((catRes.data ?? []) as { id: string; name: string }[]).map((c) => [c.id, c.name]),
  );
  const cityName = new Map(
    ((cityRes.data ?? []) as { id: string; name: string }[]).map((c) => [c.id, c.name]),
  );

  const ownerIds = [
    ...new Set([
      ...listings.map((l) => l.member_id),
      ...requests.map((r) => r.member_id),
    ]),
  ];
  const ownersRes = ownerIds.length
    ? await supabase
        .rpc("members_directory")
        .select("id, full_name, surname")
        .in("id", ownerIds)
    : { data: [] };
  const ownerById = new Map(
    ((ownersRes.data ?? []) as unknown as Owner[]).map((o) => [o.id, o]),
  );
  const nameOf = (id: string) => {
    const o = ownerById.get(id);
    return o
      ? [o.full_name, o.surname].filter(Boolean).join(" ") || "A member"
      : "A member";
  };

  function CloseButton({ kind, id }: { kind: "listing" | "request"; id: string }) {
    return (
      <form action={adminClosePost}>
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          className="shrink-0 rounded-md border border-brand-border px-3 py-1 text-xs text-brand-text transition hover:border-brand-danger hover:text-brand-danger"
        >
          Close
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-light text-brand-primary">Member posts</h1>
        <p className="mt-1 text-sm text-brand-text-muted">
          Close listings or requests that have lost relevance. Oldest first.
          Closing removes the post from the feed and the &ldquo;Happening
          now&rdquo; rail.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-brand-text uppercase">
          Active listings ({listings.length})
        </h2>
        {listings.length === 0 ? (
          <p className="text-sm text-brand-text-muted">None.</p>
        ) : (
          <ul className="space-y-2">
            {listings.map((l) => (
              <li
                key={l.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-brand-border bg-white px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <span className="text-brand-text">{l.title}</span>
                  <span className="ml-2 text-xs text-brand-text-muted">
                    · {nameOf(l.member_id)}
                    {l.location_city_id && cityName.get(l.location_city_id)
                      ? ` · ${cityName.get(l.location_city_id)}`
                      : ""}{" "}
                    · {ageDays(l.created_at)}d old
                  </span>
                </div>
                <CloseButton kind="listing" id={l.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-brand-text uppercase">
          Open requests ({requests.length})
        </h2>
        {requests.length === 0 ? (
          <p className="text-sm text-brand-text-muted">None.</p>
        ) : (
          <ul className="space-y-2">
            {requests.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-brand-border bg-white px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <span className="text-brand-text">
                    {catName.get(r.category_id) ?? "Request"}
                  </span>
                  <span className="ml-2 text-xs text-brand-text-muted">
                    · {nameOf(r.member_id)}
                    {r.city_id && cityName.get(r.city_id)
                      ? ` · ${cityName.get(r.city_id)}`
                      : ""}{" "}
                    · {ageDays(r.created_at)}d old
                  </span>
                </div>
                <CloseButton kind="request" id={r.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
