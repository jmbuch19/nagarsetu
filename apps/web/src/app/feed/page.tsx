// The Living Feed — Phase 1 §5. Browse active listings from across the
// community, with the "I'm interested → lead → WhatsApp" connect loop.
// Your own listings are managed under /listings, so they're excluded here.

import { redirect } from "next/navigation";
import Link from "next/link";
import { identity } from "@nagarsetu/shared";
import { createClient } from "@/lib/supabase/server";
import { FeedFilters, type City, type Lookup } from "./feed-filters";
import { ConnectListing } from "./connect-listing";

export const metadata = { title: `Feed — ${identity.name.en}` };

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

type SearchParams = { [k: string]: string | string[] | undefined };

type ListingRow = {
  id: string;
  member_id: string;
  category_id: string;
  title: string;
  description: string | null;
  price_text: string | null;
  area_text: string | null;
  location_city_id: string | null;
};

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const pick = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const fCategory = pick("category");
  const fCity = pick("city");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  let lq = supabase
    .from("listings")
    .select(
      "id, member_id, category_id, title, description, price_text, area_text, location_city_id",
    )
    .eq("status", "active")
    .neq("member_id", user.id)
    .order("created_at", { ascending: false })
    .limit(60);
  if (fCategory) lq = lq.eq("category_id", fCategory);
  if (fCity) lq = lq.eq("location_city_id", fCity);

  const [listingsRes, catsRes, citiesRes] = await Promise.all([
    lq,
    supabase.from("listing_categories").select("id, name").order("name"),
    supabase
      .from("cities")
      .select("id, name, state, country")
      .eq("status", "approved")
      .order("country")
      .order("state")
      .order("name"),
  ]);

  const listings = (listingsRes.data ?? []) as ListingRow[];
  const cats = (catsRes.data ?? []) as Lookup[];
  const cities = (citiesRes.data ?? []) as City[];
  const catName = new Map(cats.map((c) => [c.id, c.name]));
  const cityById = new Map(cities.map((c) => [c.id, c]));

  // Owner display info (safe view; excludes members pending deletion).
  const ownerIds = [...new Set(listings.map((l) => l.member_id))];
  const ownersRes = ownerIds.length
    ? await supabase
        .from("members_directory")
        .select("id, full_name, surname, id_verification")
        .in("id", ownerIds)
    : { data: [] as { id: string; full_name: string | null; surname: string | null; id_verification: string }[] };
  const ownerById = new Map(
    (ownersRes.data ?? []).map((o) => [o.id, o]),
  );

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-brand-primary">
            Community feed
          </h1>
          <p className="mt-1 text-sm text-brand-text-muted">
            Rooms, rides, goods, services and more — offered by fellow Nagars.
          </p>
        </div>
        <Link
          href="/listings/new"
          className="shrink-0 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-primary-dark"
        >
          + Offer something
        </Link>
      </header>

      <FeedFilters
        categories={cats}
        cities={cities}
        current={{ category: fCategory, city: fCity }}
      />

      <p className="mt-6 mb-3 text-sm text-brand-text-muted">
        {listings.length === 0
          ? "No active listings match yet."
          : `${listings.length} listing${listings.length === 1 ? "" : "s"}.`}
      </p>

      <ul className="space-y-3">
        {listings.map((l) => {
          const owner = ownerById.get(l.member_id);
          const ownerName = owner
            ? [owner.full_name, owner.surname].filter(Boolean).join(" ")
            : "A member";
          const city = l.location_city_id
            ? cityById.get(l.location_city_id)
            : undefined;
          const cat = catName.get(l.category_id);
          return (
            <li
              key={l.id}
              className="flex flex-col gap-3 rounded-2xl border border-brand-border bg-white p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium text-brand-text">{l.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-brand-text-muted">
                  {cat ? (
                    <span className="rounded-full bg-brand-surface px-2 py-0.5">
                      {CATEGORY_LABELS[cat] ?? cat}
                    </span>
                  ) : null}
                  {l.price_text ? <span>{l.price_text}</span> : null}
                  {city ? (
                    <span>
                      {l.area_text ? `${l.area_text}, ` : ""}
                      {city.name}
                    </span>
                  ) : null}
                </div>
                {l.description ? (
                  <p className="mt-2 line-clamp-3 text-sm text-brand-text">
                    {l.description}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-brand-text-muted">
                  by {ownerName}
                  {owner?.id_verification === "verified" ? (
                    <span className="ml-1 text-brand-success">· ID-verified</span>
                  ) : null}
                </p>
              </div>
              <div className="shrink-0 sm:pt-1">
                <ConnectListing listingId={l.id} />
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-6 text-xs text-brand-text-muted">
        Jay Hatkesh is a connector — the deal and payment happen directly
        between members, offline. We never take a commission.
      </p>
    </main>
  );
}
