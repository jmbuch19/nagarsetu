// Community Intelligence — Phase 1 §3 ("the scoop"). Aggregate-only counts over
// the structured data (the reason controlled lists were mandatory), with
// drill-into-directory links. Counts are visible to members; individual
// contact stays permission-gated (the directory + connection flow handle that).
//
// v1: headline totals + per-profession breakdown (→ directory) + the capability
// "who's reachable for help" layer. The richer composable multi-dimension
// faceting can layer on later; the views already support it.

import { redirect } from "next/navigation";
import Link from "next/link";
import { identity } from "@nagarsetu/shared";
import { createClient } from "@/lib/supabase/server";
import { CAPABILITY_KIND_OPTIONS } from "../profile/constants";

export const metadata = { title: `Community insights — ${identity.name.en}` };

const KIND_LABEL = new Map(
  CAPABILITY_KIND_OPTIONS.map((k) => [k.value, k.label] as const),
);

export default async function IntelligencePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/join");

  const [pulseRes, byProfRes, capsRes] = await Promise.all([
    supabase
      .rpc("community_pulse")
      .select(
        "total_members, total_professionals, total_doctors, total_cities_represented",
      )
      .maybeSingle(),
    supabase
      .rpc("community_pulse_by_profession")
      .select("profession_id, profession_name, member_count")
      .gt("member_count", 0),
    supabase
      .rpc("member_capability_directory")
      .select("member_id, capability_kind")
      .eq("is_offered", true),
  ]);

  const pulse = pulseRes.data;
  const byProfession = (byProfRes.data ?? []) as {
    profession_id: string;
    profession_name: string;
    member_count: number;
  }[];

  // Capability layer: distinct members per kind (a member may offer several).
  const byKind = new Map<string, Set<string>>();
  for (const c of (capsRes.data ?? []) as {
    member_id: string;
    capability_kind: string;
  }[]) {
    const set = byKind.get(c.capability_kind) ?? new Set<string>();
    set.add(c.member_id);
    byKind.set(c.capability_kind, set);
  }
  const capabilityCounts = CAPABILITY_KIND_OPTIONS.map((k) => ({
    label: KIND_LABEL.get(k.value) ?? k.value,
    count: byKind.get(k.value)?.size ?? 0,
  })).filter((c) => c.count > 0);

  const stat = (n: number | null | undefined) => n ?? 0;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-brand-primary">
            Community insights
          </h1>
          <p className="mt-1 text-sm text-brand-text-muted">
            A scoop of the community by the numbers. Counts only — tap through
            to the directory to reach people (with their consent).
          </p>
        </div>
        <Link
          href="/directory"
          className="shrink-0 rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-text transition hover:border-brand-primary hover:text-brand-primary"
        >
          Directory
        </Link>
      </header>

      {/* Headline totals */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Members", value: stat(pulse?.total_members) },
          { label: "Professionals", value: stat(pulse?.total_professionals) },
          { label: "Doctors", value: stat(pulse?.total_doctors) },
          { label: "Cities", value: stat(pulse?.total_cities_represented) },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-brand-border bg-white p-4 text-center shadow-sm"
          >
            <p className="text-2xl font-light text-brand-primary">{s.value}</p>
            <p className="mt-1 text-xs text-brand-text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* By profession */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-brand-text uppercase">
          By profession
        </h2>
        {byProfession.length === 0 ? (
          <p className="text-sm text-brand-text-muted">
            No professions listed yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {byProfession.map((p) => (
              <li key={p.profession_id}>
                <Link
                  href={`/directory?profession=${p.profession_id}`}
                  className="flex items-center justify-between rounded-xl border border-brand-border bg-white px-4 py-3 text-sm shadow-sm transition hover:border-brand-primary"
                >
                  <span className="text-brand-text">{p.profession_name}</span>
                  <span className="font-medium text-brand-primary">
                    {p.member_count} →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Capability layer */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-brand-text uppercase">
          Ready to help
        </h2>
        {capabilityCounts.length === 0 ? (
          <p className="text-sm text-brand-text-muted">
            No one has offered help yet — be the first from your profile.
          </p>
        ) : (
          <ul className="space-y-2">
            {capabilityCounts.map((c) => (
              <li
                key={c.label}
                className="flex items-center justify-between rounded-xl border border-brand-border bg-white px-4 py-3 text-sm shadow-sm"
              >
                <span className="text-brand-text">{c.label}</span>
                <span className="font-medium text-brand-primary">
                  {c.count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
