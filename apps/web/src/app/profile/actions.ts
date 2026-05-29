"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  BIO_MAX,
  BLOOD_GROUPS,
  EMAIL_MAX,
  EMAIL_RE,
  GENDER_VALUES,
  MARITAL_STATUS_VALUES,
  MATRIMONY_ELIGIBLE,
  MATRIMONY_SEEKING_VALUES,
  MIN_BIRTH_YEAR,
  NAME_MAX,
  PINCODE_MAX,
  PINCODE_MIN,
  PINCODE_RE,
  UUID_RE,
} from "./constants";

export type ProfileField =
  | "full_name"
  | "surname"
  | "city_id"
  | "pincode"
  | "gender"
  | "date_of_birth"
  | "email"
  | "sub_community_id"
  | "bio"
  | "blood_group";

export type ProfileFormState = {
  ok: boolean;
  message?: string;
  errors?: Partial<Record<ProfileField, string>>;
};

function field(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v.trim() : "";
}

// Server-side validation + an RLS-scoped UPDATE of the caller's own members
// row. The cookie-bound client runs as the authenticated user, so RLS
// ("update own row") and the column grants (migration 0005 — only profile
// columns are grantable; role / trust_level / id_verification / phone /
// recognised_surname are not) are the real enforcement boundary. The explicit
// .eq("id", user.id) is belt-and-braces on top of RLS.
export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Session lapsed between page load and save — send them to the working
  // re-login (the email path) rather than leaving the form stuck. During the
  // WhatsApp-OTP test phase /sign-in can't deliver codes, so /join is the way
  // back in. (Revert to /sign-in at WABA cutover.)
  if (!user) redirect("/join");

  // full_name + date_of_birth are immutable once set (founder rule). Read the
  // current row so we can skip validating/writing them when already locked.
  // The DB trigger (migration 0019) enforces this regardless.
  const { data: existing } = await supabase
    .from("members")
    .select("full_name, date_of_birth")
    .eq("id", user.id)
    .maybeSingle();
  const fullNameLocked = !!existing?.full_name;
  const dobLocked = !!existing?.date_of_birth;

  const full_name = field(formData, "full_name");
  const surname = field(formData, "surname");
  const city_id = field(formData, "city_id");
  const pincode = field(formData, "pincode");
  const gender = field(formData, "gender");
  const date_of_birth = field(formData, "date_of_birth");
  const emailRaw = field(formData, "email");
  const subCommunityRaw = field(formData, "sub_community_id");
  const bioRaw = field(formData, "bio");
  const bloodRaw = field(formData, "blood_group");
  const willingRaw = field(formData, "willing_to_donate");
  const maritalRaw = field(formData, "marital_status");
  const seekingRaw = field(formData, "matrimony_seeking");
  // Checkbox: present = opted in to direct contact, absent = request required.
  const openly_contactable = formData.get("openly_contactable") != null;

  const errors: Partial<Record<ProfileField, string>> = {};

  // Required ────────────────────────────────────────────────────────────────
  // full_name only validated on first set (locked thereafter).
  if (!fullNameLocked) {
    if (!full_name) errors.full_name = "Please enter your full name.";
    else if (full_name.length > NAME_MAX)
      errors.full_name = `Please keep this under ${NAME_MAX} characters.`;
  }

  if (!surname) errors.surname = "Please enter your surname.";
  else if (surname.length > NAME_MAX)
    errors.surname = `Please keep this under ${NAME_MAX} characters.`;

  if (!city_id) errors.city_id = "Please choose your city.";
  else if (!UUID_RE.test(city_id)) errors.city_id = "Please choose a valid city.";

  if (!pincode) errors.pincode = "Please enter your PIN / postal code.";
  else if (
    pincode.length < PINCODE_MIN ||
    pincode.length > PINCODE_MAX ||
    !PINCODE_RE.test(pincode)
  )
    errors.pincode = "Please enter a valid PIN / postal code.";

  if (!gender) errors.gender = "Please select an option.";
  else if (!GENDER_VALUES.includes(gender))
    errors.gender = "Please select a valid option.";

  // date_of_birth only validated on first set (locked thereafter).
  if (!dobLocked) {
    if (!date_of_birth) {
      errors.date_of_birth = "Please enter your date of birth.";
    } else {
      const dob = new Date(`${date_of_birth}T00:00:00Z`);
      if (Number.isNaN(dob.getTime())) {
        errors.date_of_birth = "Please enter a valid date.";
      } else if (dob.toISOString().slice(0, 10) !== date_of_birth) {
        // Rolled-over impossible date (e.g. 31 Feb from the dropdowns).
        errors.date_of_birth = "Please choose a real calendar date.";
      } else if (dob > new Date()) {
        errors.date_of_birth = "Date of birth cannot be in the future.";
      } else if (dob.getUTCFullYear() < MIN_BIRTH_YEAR) {
        errors.date_of_birth = "Please enter a valid date.";
      }
    }
  }

  // Optional (empty → stored as NULL) ─────────────────────────────────────────
  let email: string | null = null;
  if (emailRaw) {
    if (emailRaw.length > EMAIL_MAX || !EMAIL_RE.test(emailRaw))
      errors.email = "Please enter a valid email address.";
    else email = emailRaw.toLowerCase();
  }

  let sub_community_id: string | null = null;
  if (subCommunityRaw) {
    if (!UUID_RE.test(subCommunityRaw))
      errors.sub_community_id = "Please choose a valid sub-community.";
    else sub_community_id = subCommunityRaw;
  }

  let bio: string | null = null;
  if (bioRaw) {
    if (bioRaw.length > BIO_MAX)
      errors.bio = `Please keep your bio under ${BIO_MAX} characters.`;
    else bio = bioRaw;
  }

  // Blood group (optional) — must be one of the controlled set if provided.
  let blood_group: string | null = null;
  if (bloodRaw) {
    if (!(BLOOD_GROUPS as readonly string[]).includes(bloodRaw))
      errors.blood_group = "Please choose a valid blood group.";
    else blood_group = bloodRaw;
  }

  // Donation willingness (optional) — "yes"/"no"/unanswered.
  const willing_to_donate: boolean | null =
    willingRaw === "yes" ? true : willingRaw === "no" ? false : null;

  // Matrimony (optional). Only single/divorced/widowed can opt in, and the
  // "seeking" choice IS the opt-in — anything else means not listed. Lenient:
  // unrecognised values fall back to not-disclosed rather than erroring.
  const marital_status: string | null = MARITAL_STATUS_VALUES.includes(maritalRaw)
    ? maritalRaw
    : null;
  const open_to_matrimony =
    marital_status != null &&
    MATRIMONY_ELIGIBLE.includes(marital_status) &&
    MATRIMONY_SEEKING_VALUES.includes(seekingRaw);
  const matrimony_seeking = open_to_matrimony ? seekingRaw : null;

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, message: "Please fix the highlighted fields." };
  }

  const updateData: Record<string, unknown> = {
    surname,
    city_id,
    pincode,
    gender,
    email,
    sub_community_id,
    bio,
    openly_contactable,
    blood_group,
    willing_to_donate,
    marital_status,
    open_to_matrimony,
    matrimony_seeking,
  };
  // Only write the locked fields on first set; never overwrite once present.
  if (!fullNameLocked) updateData.full_name = full_name;
  if (!dobLocked) updateData.date_of_birth = date_of_birth;

  const { error } = await supabase
    .from("members")
    .update(updateData)
    .eq("id", user.id);

  if (error) {
    // 23505 = unique_violation. members.email is UNIQUE, so a collision means
    // the address is already linked to another account.
    if (error.code === "23505") {
      return {
        ok: false,
        errors: { email: "That email is already linked to another account." },
        message: "Please fix the highlighted fields.",
      };
    }
    return {
      ok: false,
      message: "Could not save your profile. Please try again.",
    };
  }

  revalidatePath("/profile");
  return { ok: true, message: "Profile saved." };
}
