// Community rail — an ambient "Happening now" stream of members' live offers,
// asks, and self-promoted matrimony interests, each with a one-tap CTA (reusing
// the consent-gated connect flow). MEMBERS ONLY (it names people + personal
// asks) — returns null for guests. Matrimony items show only opted-in adults
// (gated in members_directory) and carry their gender/city/age + what they seek.
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
import type { Relationship } from "./directory/connect-button";

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
type MatrimonyRow = {
  id: string;
  full_name: string | null;
  surname: string | null;
  gender: string | null;
  city_id: string | null;
  openly_contactable: boolean;
  matrimony_seeking: string | null;
  matrimony_age: number | null;
  created_at: string;
};

const GENDER_LABEL: Record<string, string> = { male: "Male", female: "Female" };
const SEEK_LABEL: Record<string, string> = {
  bride: "a bride",
  groom: "a groom",
  companion: "a life companion",
};

function truncate(s: string, n = 80): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

export async function CommunityRail() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [listRes, reqRes, matriRes, connRes, catRes, cityRes] =
    await Promise.all([
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
      supabase
        .rpc("members_directory")
        .select(
          "id, full_name, surname, gender, city_id, openly_contactable, matrimony_seeking, matrimony_age, created_at",
        )
        .eq("open_to_matrimony", true)
        .neq("id", user.id)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("connection_requests")
        .select("requester_id, recipient_id, status"),
      supabase.from("listing_categories").select("id, name"),
      supabase.from("cities").select("id, name"),
    ]);

  const listings = (listRes.data ?? []) as ListingRow[];
  const requests = (reqRes.data ?? []) as RequestRow[];
  const matrimony = (matriRes.data ?? []) as unknown as MatrimonyRow[];
  if (
    listings.length === 0 &&
    requests.length === 0 &&
    matrimony.length === 0
  )
    return null;

  const catName = new Map(
    ((catRes.data ?? []) as { id: string; name: string }[]).map((c) => [c.id, c.name]),
  );
  const cityName = new Map(
    ((cityRes.data ?? []) as { id: string; name: string }[]).map((c) => [c.id, c.name]),
  );

  // Relationship per member (for the matrimony Connect button) — RLS scopes the
  // connection_requests to the viewer; mirrors the directory's logic.
  const relByMember = new Map<string, Relationship>();
  for (const r of (connRes.data ?? []) as {
    requester_id: string;
    recipient_id: string;
    status: string;
  }[]) {
    const other = r.requester_id === user.id ? r.recipient_id : r.requester_id;
    const outgoing = r.requester_id === user.id;
    let rel: Relationship;
    if (r.status === "approved") rel = "approved";
    else if (r.status === "pending") rel = outgoing ? "pending_out" : "pending_in";
    else rel = outgoing ? "declined_out" : "none";
    const existing = relByMember.get(other);
    if (!existing || rel === "approved") relByMember.set(other, rel);
  }

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

  const matri: Tagged[] = matrimony.map((m) => {
    const name =
      [m.full_name, m.surname].filter(Boolean).join(" ") || "A member";
    const g = m.gender ? GENDER_LABEL[m.gender] : undefined;
    const city = m.city_id ? cityName.get(m.city_id) : null;
    const seek =
      (m.matrimony_seeking && SEEK_LABEL[m.matrimony_seeking]) || "a match";
    const parts = [
      name,
      g,
      city,
      m.matrimony_age ? `${m.matrimony_age} yrs` : null,
    ]
      .filter(Boolean)
      .join(" · ");
    return {
      key: `m-${m.id}`,
      kind: "matrimony",
      recipientId: m.id,
      openlyContactable: m.openly_contactable,
      relationship: relByMember.get(m.id) ?? "none",
      ts: new Date(m.created_at).getTime(),
      line: `${parts} — looking for ${seek}`,
    };
  });

  const items: RailItem[] = [...offers, ...asks, ...matri]
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
