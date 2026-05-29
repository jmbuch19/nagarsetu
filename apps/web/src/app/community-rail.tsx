// Community rail — an ambient "Happening now" stream of members' live offers
// and asks, each with a one-tap CTA (reusing the consent-gated connect flow).
// MEMBERS ONLY (it names people + personal asks) — returns null for guests.
//
// Responsive: a fixed auto-scrolling side rail on very wide screens (2xl+,
// where the margin is genuinely ample, per the founder's observation); a tidy
// in-page "Happening now" list everywhere else (laptop/tablet/phone).
//
// Relevance/closing: it only shows active listings + open requests, so when a
// member closes/fulfils their own post (existing /listings + /requests
// controls) it leaves the rail automatically.

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RailScroller, RailCard, type RailItem } from "./rail-scroller";

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

function truncate(s: string, n = 80): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

export async function CommunityRail() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [listRes, reqRes, catRes, cityRes] = await Promise.all([
    supabase
      .from("listings")
      .select("id, member_id, title, location_city_id, created_at")
      .eq("status", "active")
      .neq("member_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("requests")
      .select("id, member_id, category_id, city_id, details, created_at")
      .eq("status", "open")
      .neq("member_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase.from("listing_categories").select("id, name"),
    supabase.from("cities").select("id, name"),
  ]);

  const listings = (listRes.data ?? []) as ListingRow[];
  const requests = (reqRes.data ?? []) as RequestRow[];
  if (listings.length === 0 && requests.length === 0) return null;

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
  const owners = (ownersRes.data ?? []) as unknown as Owner[];
  const ownerById = new Map(owners.map((o) => [o.id, o]));
  const nameOf = (id: string) => {
    const o = ownerById.get(id);
    return o
      ? [o.full_name, o.surname].filter(Boolean).join(" ") || "A member"
      : "A member";
  };

  type Tagged = RailItem & { ts: number };
  const offers: Tagged[] = listings.map((l) => {
    const city = l.location_city_id ? cityName.get(l.location_city_id) : null;
    return {
      key: `l-${l.id}`,
      kind: "offer",
      listingId: l.id,
      ts: new Date(l.created_at).getTime(),
      line: `${nameOf(l.member_id)} — ${l.title}${city ? ` · ${city}` : ""}`,
    };
  });
  const asks: Tagged[] = requests.map((r) => {
    const cat = catName.get(r.category_id) ?? "help";
    const city = r.city_id ? cityName.get(r.city_id) : null;
    const det = r.details ? ` — ${truncate(r.details)}` : "";
    return {
      key: `r-${r.id}`,
      kind: "ask",
      requestId: r.id,
      ts: new Date(r.created_at).getTime(),
      line: `${nameOf(r.member_id)}${city ? ` from ${city}` : ""} is looking for ${cat}${det}`,
    };
  });

  const items: RailItem[] = [...offers, ...asks]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 14);

  return (
    <>
      {/* Wide screens: ambient auto-scrolling side rail in the right margin. */}
      <aside className="fixed top-24 right-4 z-30 hidden w-[280px] 2xl:block">
        <p className="mb-2 px-1 text-xs font-medium tracking-[0.2em] text-brand-text-muted uppercase">
          Happening now
        </p>
        <RailScroller items={items} />
      </aside>

      {/* Laptop / tablet / phone: a tidy in-page list. */}
      <section className="mx-auto w-full max-w-4xl px-6 pt-6 2xl:hidden">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium tracking-[0.2em] text-brand-text-muted uppercase">
            Happening now in the community
          </p>
          <Link href="/feed" className="text-xs text-brand-primary underline">
            See all →
          </Link>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {items.slice(0, 4).map((it) => (
            <RailCard key={it.key} item={it} />
          ))}
        </div>
      </section>
    </>
  );
}
