// The Living Feed — Phase 1 §5 (+ §4 two-sided). A unified feed with a toggle:
//   • Offers   — active listings (providers offering)
//   • Requests — open demand-side posts (seekers looking)
// "I'm interested" (offers) / "I can help" (requests) open the connect channel.
// Your own posts are excluded from the browse.

import { redirect } from "next/navigation";
import Link from "next/link";
import { identity } from "@nagarsetu/shared";
import { createClient } from "@/lib/supabase/server";
import { FeedFilters, type City, type Lookup } from "./feed-filters";
import { ConnectListing } from "./connect-listing";
import { RespondRequest } from "../requests/respond-request";

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
type RequestRow = {
  id: string;
  member_id: string;
  category_id: string;
  city_id: string | null;
  area_text: string | null;
  budget_text: string | null;
  needed_from: string | null;
  needed_to: string | null;
  details: string | null;
};
type Owner = {
  id: string;
  full_name: string | null;
  surname: string | null;
  id_verification: string;
};

function qs(type: string, category: string, city: string): string {
  const p = new URLSearchParams();
  if (type && type !== "offers") p.set("type", type);
  if (category) p.set("category", category);
  if (city) p.set("city", city);
  const s = p.toString();
  return s ? `/feed?${s}` : "/feed";
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const pick = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const fType = pick("type") === "requests" ? "requests" : "offers";
  const fCategory = pick("category");
  const fCity = pick("city");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // Lookups (shared).
  const [catsRes, citiesRes] = await Promise.all([
    supabase.from("listing_categories").select("id, name").order("name"),
    supabase
      .from("cities")
      .select("id, name, state, country")
      .eq("status", "approved")
      .order("country")
      .order("state")
      .order("name"),
  ]);
  const cats = (catsRes.data ?? []) as Lookup[];
  const cities = (citiesRes.data ?? []) as City[];
  const catName = new Map(cats.map((c) => [c.id, c.name]));
  const cityById = new Map(cities.map((c) => [c.id, c]));

  let listings: ListingRow[] = [];
  let requests: RequestRow[] = [];

  if (fType === "requests") {
    let rq = supabase
      .from("requests")
      .select(
        "id, member_id, category_id, city_id, area_text, budget_text, needed_from, needed_to, details",
      )
      .eq("status", "open")
      .neq("member_id", user.id)
      .order("created_at", { ascending: false })
      .limit(60);
    if (fCategory) rq = rq.eq("category_id", fCategory);
    if (fCity) rq = rq.eq("city_id", fCity);
    requests = ((await rq).data ?? []) as RequestRow[];
  } else {
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
    listings = ((await lq).data ?? []) as ListingRow[];
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
        .select("id, full_name, surname, id_verification")
        .in("id", ownerIds)
    : { data: [] as Owner[] };
  const ownerById = new Map(((ownersRes.data ?? []) as Owner[]).map((o) => [o.id, o]));
  const nameOf = (id: string) => {
    const o = ownerById.get(id);
    return o ? [o.full_name, o.surname].filter(Boolean).join(" ") || "A member" : "A member";
  };

  const tab = (label: string, type: string) => {
    const active = fType === type;
    return (
      <Link
        href={qs(type, fCategory, fCity)}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
          active
            ? "bg-brand-primary text-white"
            : "border border-brand-border text-brand-text hover:border-brand-primary"
        }`}
      >
        {label}
      </Link>
    );
  };

  const count = fType === "requests" ? requests.length : listings.length;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <header className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-brand-primary">
            Community feed
          </h1>
          <p className="mt-1 text-sm text-brand-text-muted">
            What the community is offering — and looking for.
          </p>
        </div>
        <Link
          href={fType === "requests" ? "/requests/new" : "/listings/new"}
          className="shrink-0 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-primary-dark"
        >
          {fType === "requests" ? "+ Post a request" : "+ Offer something"}
        </Link>
      </header>

      <div className="mb-4 flex gap-2">
        {tab("Offers", "offers")}
        {tab("Requests", "requests")}
      </div>

      <FeedFilters
        categories={cats}
        cities={cities}
        current={{ category: fCategory, city: fCity, type: fType }}
      />

      <p className="mt-6 mb-3 text-sm text-brand-text-muted">
        {count === 0
          ? fType === "requests"
            ? "No open requests match yet."
            : "No active listings match yet."
          : `${count} ${fType === "requests" ? "request" : "listing"}${count === 1 ? "" : "s"}.`}
      </p>

      <ul className="space-y-3">
        {fType === "offers"
          ? listings.map((l) => {
              const city = l.location_city_id ? cityById.get(l.location_city_id) : undefined;
              const cat = catName.get(l.category_id);
              const owner = ownerById.get(l.member_id);
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
                      by {nameOf(l.member_id)}
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
            })
          : requests.map((r) => {
              const city = r.city_id ? cityById.get(r.city_id) : undefined;
              const cat = catName.get(r.category_id);
              return (
                <li
                  key={r.id}
                  className="flex flex-col gap-3 rounded-2xl border border-brand-border bg-white p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-brand-text">
                      Looking for: {cat ? (CATEGORY_LABELS[cat] ?? cat) : "—"}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-brand-text-muted">
                      {r.budget_text ? <span>{r.budget_text}</span> : null}
                      {city ? (
                        <span>
                          {r.area_text ? `${r.area_text}, ` : ""}
                          {city.name}
                        </span>
                      ) : null}
                      {r.needed_from ? (
                        <span>
                          from {new Date(r.needed_from).toLocaleDateString()}
                        </span>
                      ) : null}
                    </div>
                    {r.details ? (
                      <p className="mt-2 line-clamp-3 text-sm text-brand-text">
                        {r.details}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-brand-text-muted">
                      by {nameOf(r.member_id)}
                    </p>
                  </div>
                  <div className="shrink-0 sm:pt-1">
                    <RespondRequest requestId={r.id} />
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
