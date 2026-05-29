// Community Directory — Phase 1 §3 ("Directory search/filter" +
// "Permissioned contact reveal").
//
// Members FIND each other here (over the definer views from migration 0013)
// and REACH each other with consent (hybrid model, migration 0016): a member
// who is openly_contactable can be WhatsApp'd directly; otherwise a
// connection request must be approved first. Phone is never in this page's
// data — it's revealed only through get_revealed_contact() via the
// revealContact server action.

import { redirect } from "next/navigation";
import Link from "next/link";
import { identity } from "@nagarsetu/shared";
import { createClient } from "@/lib/supabase/server";
import {
  DirectoryFilters,
  type City,
  type Lookup,
  type Specialty,
} from "./directory-filters";
import { ConnectButton, type Relationship } from "./connect-button";

export const metadata = { title: `Directory — ${identity.name.en}` };

const PLACEHOLDER_EMPTY = "00000000-0000-0000-0000-000000000000";

type SearchParams = { [key: string]: string | string[] | undefined };

type MemberRow = {
  id: string;
  full_name: string | null;
  surname: string | null;
  bio: string | null;
  city_id: string | null;
  sub_community_id: string | null;
  trust_level: number;
  id_verification: string;
  recognised_surname: boolean;
  openly_contactable: boolean;
  donor_blood_group: string | null;
};

// Warm one-line intro composed from profile fields + the member's own bio.
// Pronoun-free by design, so it reads correctly for any gender.
function article(word: string): string {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

function warmBlurb(
  m: MemberRow,
  prof: { profession_name: string; specialty_name: string | null } | undefined,
  city: City | undefined,
): string {
  const name = [m.full_name, m.surname].filter(Boolean).join(" ") || "A fellow Nagar";
  const role = prof
    ? prof.specialty_name
      ? `${prof.profession_name} (${prof.specialty_name})`
      : prof.profession_name
    : null;
  const place = city
    ? city.country && city.country !== "India"
      ? `${city.name}, ${city.country}`
      : city.name
    : null;

  let sentence = name;
  if (role && place) sentence += ` is ${article(role)} ${role} from ${place}.`;
  else if (role) sentence += ` is ${article(role)} ${role}.`;
  else if (place) sentence += ` is from ${place}.`;
  else sentence += ".";

  if (m.bio) sentence += ` ${m.bio}`;
  return sentence;
}

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const pick = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const fProfession = pick("profession");
  const fSpecialty = pick("specialty");
  const fCity = pick("city");
  const fSub = pick("sub_community");
  const fBlood = pick("blood");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/join");

  // Lookups (filter bar + name resolution).
  const [professionsRes, specialtiesRes, citiesRes, subCommunitiesRes] =
    await Promise.all([
      supabase.from("professions").select("id, name").order("name"),
      supabase.from("specialties").select("id, profession_id, name").order("name"),
      supabase
        .from("cities")
        .select("id, name, state, country")
        .eq("status", "approved")
        .order("country")
        .order("state")
        .order("name"),
      supabase.from("sub_communities").select("id, name").order("name"),
    ]);

  const cities = (citiesRes.data ?? []) as City[];
  const subCommunities = (subCommunitiesRes.data ?? []) as Lookup[];
  const cityById = new Map(cities.map((c) => [c.id, c]));
  const subById = new Map(subCommunities.map((s) => [s.id, s.name]));

  // Step 1 — narrow to members matching a profession/specialty filter.
  let candidateIds: string[] | null = null;
  if (fProfession || fSpecialty) {
    let q = supabase.rpc("member_profession_directory").select("member_id");
    if (fProfession) q = q.eq("profession_id", fProfession);
    if (fSpecialty) q = q.eq("specialty_id", fSpecialty);
    const { data } = await q;
    const rows = (data ?? []) as { member_id: string }[];
    candidateIds = [...new Set(rows.map((r) => r.member_id))];
    if (candidateIds.length === 0) candidateIds = [PLACEHOLDER_EMPTY];
  }

  // Step 2 — the member list (completed profiles, excluding self).
  let mq = supabase
    .rpc("members_directory")
    .select(
      "id, full_name, surname, bio, city_id, sub_community_id, trust_level, id_verification, recognised_surname, openly_contactable, donor_blood_group",
    )
    .not("full_name", "is", null)
    .neq("id", user.id)
    .order("full_name")
    .limit(60);
  if (fCity) mq = mq.eq("city_id", fCity);
  if (fSub) mq = mq.eq("sub_community_id", fSub);
  if (fBlood) mq = mq.eq("donor_blood_group", fBlood);
  if (candidateIds) mq = mq.in("id", candidateIds);
  const { data: membersData } = await mq;
  const members = (membersData ?? []) as MemberRow[];
  const ids = members.map((m) => m.id);

  // Step 3 — professions + capabilities for the shown members, plus my
  // existing connection relationships (RLS scopes these to me).
  const [profsRes, capsRes, reqsRes] = await Promise.all([
    ids.length
      ? supabase
          .rpc("member_profession_directory")
          .select("member_id, profession_name, specialty_name, profession_status")
          .in("member_id", ids)
      : Promise.resolve({ data: [] as unknown[] }),
    ids.length
      ? supabase
          .rpc("member_capability_directory")
          .select("member_id, capability_kind, capability_domain")
          .eq("is_offered", true)
          .in("member_id", ids)
      : Promise.resolve({ data: [] as unknown[] }),
    supabase
      .from("connection_requests")
      .select("requester_id, recipient_id, status"),
  ]);

  const profsByMember = new Map<
    string,
    { profession_name: string; specialty_name: string | null; profession_status: string }[]
  >();
  for (const r of (profsRes.data ?? []) as {
    member_id: string;
    profession_name: string;
    specialty_name: string | null;
    profession_status: string;
  }[]) {
    const list = profsByMember.get(r.member_id) ?? [];
    list.push(r);
    profsByMember.set(r.member_id, list);
  }

  const capsByMember = new Map<
    string,
    { capability_kind: string; capability_domain: string }[]
  >();
  for (const r of (capsRes.data ?? []) as {
    member_id: string;
    capability_kind: string;
    capability_domain: string;
  }[]) {
    const list = capsByMember.get(r.member_id) ?? [];
    list.push(r);
    capsByMember.set(r.member_id, list);
  }

  // Relationship of the current user to each member.
  const relByMember = new Map<string, Relationship>();
  for (const r of (reqsRes.data ?? []) as {
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
    // approved wins over anything already recorded.
    const existing = relByMember.get(other);
    if (!existing || rel === "approved") relByMember.set(other, rel);
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-brand-primary">
            Community Directory
          </h1>
          <p className="mt-1 text-sm text-brand-text-muted">
            Find a fellow Nagar by profession, specialty, city or sub-community
            — and reach them with their consent.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href="/intelligence"
            className="rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-text transition hover:border-brand-primary hover:text-brand-primary"
          >
            Insights
          </Link>
          <Link
            href="/connections"
            className="rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-text transition hover:border-brand-primary hover:text-brand-primary"
          >
            Your connections
          </Link>
        </div>
      </header>

      <DirectoryFilters
        professions={(professionsRes.data ?? []) as Lookup[]}
        specialties={(specialtiesRes.data ?? []) as Specialty[]}
        cities={cities}
        subCommunities={subCommunities}
        current={{
          profession: fProfession,
          specialty: fSpecialty,
          city: fCity,
          sub_community: fSub,
          blood: fBlood,
        }}
      />

      <p className="mt-6 mb-3 text-sm text-brand-text-muted">
        {members.length === 0
          ? "No members match these filters yet."
          : `Showing ${members.length} member${members.length === 1 ? "" : "s"}${members.length === 60 ? " (first 60)" : ""}.`}
      </p>

      <ul className="space-y-3">
        {members.map((m) => {
          const city = m.city_id ? cityById.get(m.city_id) : undefined;
          const profs = profsByMember.get(m.id) ?? [];
          const caps = capsByMember.get(m.id) ?? [];
          const rel = relByMember.get(m.id) ?? "none";
          return (
            <li
              key={m.id}
              className="flex flex-col gap-3 rounded-2xl border border-brand-border bg-white p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium text-brand-text">
                  {[m.full_name, m.surname].filter(Boolean).join(" ")}
                  {m.id_verification === "verified" ? (
                    <span className="ml-2 rounded-full bg-brand-success/10 px-2 py-0.5 text-xs font-medium text-brand-success">
                      ID-verified
                    </span>
                  ) : null}
                  {m.recognised_surname ? (
                    <span className="ml-2 rounded-full bg-brand-success/10 px-2 py-0.5 text-xs font-medium text-brand-success">
                      Nagar surname
                    </span>
                  ) : null}
                  {m.donor_blood_group ? (
                    <span className="ml-2 rounded-full bg-brand-danger/10 px-2 py-0.5 text-xs font-medium text-brand-danger">
                      Blood donor · {m.donor_blood_group}
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-brand-text">
                  {warmBlurb(m, profs[0], city)}
                </p>

                {m.sub_community_id && subById.get(m.sub_community_id) ? (
                  <p className="mt-0.5 text-xs text-brand-text-muted" lang="gu">
                    {subById.get(m.sub_community_id)}
                  </p>
                ) : null}

                {caps.length > 0 ? (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {caps.map((c, i) => (
                      <span
                        key={i}
                        className="rounded-full border border-brand-gold/40 px-2 py-0.5 text-xs text-brand-text-muted"
                      >
                        Open to: {c.capability_domain}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="shrink-0 sm:pt-1">
                <ConnectButton
                  recipientId={m.id}
                  openlyContactable={m.openly_contactable}
                  relationship={rel}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
