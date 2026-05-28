// Profile create/edit — Phase 1 §2, AGENDA "Profile create/edit".
//
// Required: full name, surname, city, PIN, gender, DOB.
// Optional: email, sub-community, bio. NO home address (city + PIN only,
// per the "Minimal location" MEMORY decision).
//
// DEFERRED to a follow-up sub-slice: profile photo upload. It needs a scoped
// Storage bucket + storage RLS + type/size validation + an upload widget —
// its own security surface (see the AUDIT file-upload checklist item). The
// photo_url column + its column grant already exist (migration 0004/0005).
//
// The write path is a server action (./actions.ts) running as the
// authenticated user, so members RLS + the column grants are the enforcement
// boundary. This page only reads the caller's own row + the public lookups.

import Link from "next/link";
import { redirect } from "next/navigation";
import { identity } from "@nagarsetu/shared";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm, type ProfileValues } from "./profile-form";
import {
  ProfessionsEditor,
  type Profession,
  type Specialty,
  type ProfessionRowData,
} from "./professions-editor";
import {
  CapabilitiesEditor,
  type CapabilityRowData,
} from "./capabilities-editor";
import { AccountDeletion } from "./account-deletion";

export const metadata = {
  title: `Your profile — ${identity.name.en}`,
};

const REQUIRED_FIELDS: (keyof ProfileValues)[] = [
  "full_name",
  "surname",
  "city_id",
  "pincode",
  "gender",
  "date_of_birth",
];

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const [
    memberRes,
    citiesRes,
    subCommunitiesRes,
    professionsRes,
    specialtiesRes,
    memberProfessionsRes,
    memberCapabilitiesRes,
  ] = await Promise.all([
    supabase
      .from("members")
      .select(
        "full_name, surname, city_id, pincode, gender, date_of_birth, email, sub_community_id, bio, openly_contactable, recognised_surname, blood_group, willing_to_donate, deletion_requested_at",
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("cities")
      .select("id, name, state, country")
      .eq("status", "approved")
      .order("country")
      .order("state")
      .order("name"),
    supabase.from("sub_communities").select("id, name").order("name"),
    supabase.from("professions").select("id, name").order("name"),
    supabase
      .from("specialties")
      .select("id, profession_id, name")
      .order("name"),
    supabase
      .from("member_professions")
      .select(
        "id, profession_id, specialty_id, years_experience, expertise_text, status, is_verified",
      )
      .eq("member_id", user.id)
      .order("created_at"),
    supabase
      .from("member_capabilities")
      .select("id, kind, domain, description, is_offered")
      .eq("member_id", user.id)
      .order("created_at"),
  ]);

  const member = (memberRes.data ?? null) as ProfileValues | null;
  const isComplete =
    member !== null &&
    REQUIRED_FIELDS.every((f) => member[f] !== null && member[f] !== "");

  return (
    <main className="flex flex-1 justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <header className="mb-6">
          <p className="text-xs tracking-[0.3em] text-brand-text-muted uppercase">
            {identity.tagline.en}
          </p>
          <h1 className="mt-2 text-3xl font-light text-brand-primary">
            Your profile
          </h1>
          {member?.recognised_surname ? (
            <p className="mt-2 inline-block rounded-full bg-brand-success/10 px-3 py-1 text-xs font-medium text-brand-success">
              ✓ Recognised Nagar surname
            </p>
          ) : null}
          <p className="mt-2 text-sm leading-relaxed text-brand-text-muted">
            A complete profile makes the directory richer for everyone — it&apos;s
            how fellow Nagars find you, and how you find them. Belonging is free;
            you only pay a fee when you publish a commercial listing.
          </p>
          <Link
            href="/directory"
            className="mt-3 inline-block text-sm font-medium text-brand-primary underline"
          >
            Browse the directory →
          </Link>
        </header>

        {!isComplete ? (
          <p className="mb-6 rounded-lg border border-brand-gold/40 bg-brand-gold/10 px-4 py-3 text-sm text-brand-text">
            Finish the required fields below to complete your profile and unlock
            the directory.
          </p>
        ) : null}

        <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm sm:p-8">
          <ProfileForm
            phone={user.phone ?? ""}
            values={member}
            cities={citiesRes.data ?? []}
            subCommunities={subCommunitiesRes.data ?? []}
          />
        </div>

        <div className="mt-6 rounded-2xl border border-brand-border bg-white p-6 shadow-sm sm:p-8">
          <ProfessionsEditor
            professions={(professionsRes.data ?? []) as Profession[]}
            specialties={(specialtiesRes.data ?? []) as Specialty[]}
            rows={(memberProfessionsRes.data ?? []) as ProfessionRowData[]}
          />
        </div>

        <div className="mt-6 rounded-2xl border border-brand-border bg-white p-6 shadow-sm sm:p-8">
          <CapabilitiesEditor
            rows={(memberCapabilitiesRes.data ?? []) as CapabilityRowData[]}
          />
        </div>

        <div className="mt-6 rounded-2xl border border-brand-border bg-white p-6 shadow-sm sm:p-8">
          <AccountDeletion
            deletionRequestedAt={member?.deletion_requested_at ?? null}
          />
        </div>
      </div>
    </main>
  );
}
