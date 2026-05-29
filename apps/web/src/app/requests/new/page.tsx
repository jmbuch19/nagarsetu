// Post a Request — Phase 1 §4 seeker side. Free demand-side post ("looking
// for a room/ride/tutor", PG Seeker). Members who can help reach out directly.

import { redirect } from "next/navigation";
import Link from "next/link";
import { identity } from "@nagarsetu/shared";
import { createClient } from "@/lib/supabase/server";
import { RequestForm, type Category, type City } from "../request-form";

export const metadata = { title: `Post a request — ${identity.name.en}` };

export default async function NewRequestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/join");

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

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-brand-primary">
            Post a request
          </h1>
          <p className="mt-1 text-sm text-brand-text-muted">
            Looking for a room, a ride, a tutor, or anything else? Ask the
            circle — it&apos;s free.
          </p>
        </div>
        <Link
          href="/requests"
          className="shrink-0 rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-text transition hover:border-brand-primary hover:text-brand-primary"
        >
          Your requests
        </Link>
      </header>

      <RequestForm
        categories={(catsRes.data ?? []) as Category[]}
        cities={(citiesRes.data ?? []) as City[]}
      />
    </main>
  );
}
