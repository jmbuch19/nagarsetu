// Create-a-Listing hub — Phase 1 §4. One entry point → category picker →
// category-aware form → draft. Verification/payment gates apply at PUBLISH
// (from "Your listings"), not here.

import { redirect } from "next/navigation";
import Link from "next/link";
import { identity } from "@nagarsetu/shared";
import { createClient } from "@/lib/supabase/server";
import { ListingForm, type Category, type City } from "../listing-form";

export const metadata = { title: `Create a listing — ${identity.name.en}` };

export default async function NewListingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const [catsRes, citiesRes] = await Promise.all([
    supabase
      .from("listing_categories")
      .select("id, name, is_paid, verification")
      .order("name"),
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
            Create a listing
          </h1>
          <p className="mt-1 text-sm text-brand-text-muted">
            Offer a room, a ride, goods, a service, or your business to the
            community.
          </p>
        </div>
        <Link
          href="/listings"
          className="shrink-0 rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-text transition hover:border-brand-primary hover:text-brand-primary"
        >
          Your listings
        </Link>
      </header>

      <ListingForm
        categories={(catsRes.data ?? []) as Category[]}
        cities={(citiesRes.data ?? []) as City[]}
      />
    </main>
  );
}
