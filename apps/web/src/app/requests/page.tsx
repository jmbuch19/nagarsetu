// Your requests — Phase 1 §4 seeker side. The member's own demand-side posts.

import { redirect } from "next/navigation";
import Link from "next/link";
import { identity } from "@nagarsetu/shared";
import { createClient } from "@/lib/supabase/server";
import { RequestRowActions } from "./request-row-actions";

export const metadata = { title: `Your requests — ${identity.name.en}` };

const CATEGORY_LABELS: Record<string, string> = {
  business: "Business",
  room: "Room",
  vehicle: "Vehicle",
  pg: "PG / Hostel",
  goods: "Goods",
  tour: "Tour",
  service: "Service",
  expert: "Expert help",
  education: "Education",
};

const STATUS_STYLE: Record<string, string> = {
  open: "bg-brand-success/10 text-brand-success",
  fulfilled: "bg-brand-primary/10 text-brand-primary",
  closed: "bg-brand-surface text-brand-text-muted",
};

type Req = {
  id: string;
  category_id: string;
  city_id: string | null;
  budget_text: string | null;
  details: string | null;
  status: string;
};

export default async function RequestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/join");

  const [reqRes, catsRes] = await Promise.all([
    supabase
      .from("requests")
      .select("id, category_id, city_id, budget_text, details, status")
      .eq("member_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("listing_categories").select("id, name"),
  ]);
  const requests = (reqRes.data ?? []) as Req[];
  const catName = new Map((catsRes.data ?? []).map((c) => [c.id, c.name as string]));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-brand-primary">
            Your requests
          </h1>
          <p className="mt-1 text-sm text-brand-text-muted">
            What you&apos;re looking for. Members who can help reach out to you.
          </p>
        </div>
        <Link
          href="/requests/new"
          className="shrink-0 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-primary-dark"
        >
          + New request
        </Link>
      </header>

      {requests.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-brand-border bg-white p-6 text-center text-sm text-brand-text-muted">
          You haven&apos;t posted any requests yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => {
            const cat = catName.get(r.category_id);
            return (
              <li
                key={r.id}
                className="flex flex-col gap-3 rounded-2xl border border-brand-border bg-white p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-brand-text">
                    {cat ? (CATEGORY_LABELS[cat] ?? cat) : "Request"}
                    {r.budget_text ? (
                      <span className="font-normal text-brand-text-muted">
                        {" · "}
                        {r.budget_text}
                      </span>
                    ) : null}
                  </p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[r.status] ?? ""}`}
                  >
                    {r.status}
                  </span>
                  {r.details ? (
                    <p className="mt-2 text-sm text-brand-text">{r.details}</p>
                  ) : null}
                </div>
                <div className="shrink-0">
                  <RequestRowActions id={r.id} status={r.status} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
