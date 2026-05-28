"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  EXPERTISE_MAX,
  PROFESSION_STATUS_VALUES,
  UUID_RE,
  YEARS_MAX,
  YEARS_MIN,
} from "./constants";

export type ProfessionField =
  | "profession_id"
  | "specialty_id"
  | "status"
  | "years_experience"
  | "expertise_text";

export type ProfessionFormState = {
  ok: boolean;
  message?: string;
  errors?: Partial<Record<ProfessionField, string>>;
};

type ParsedProfession = {
  profession_id: string;
  specialty_id: string | null;
  status: string;
  years_experience: number | null;
  expertise_text: string | null;
};

function field(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v.trim() : "";
}

// Validate the shared profession fields. Async because it cross-checks that
// the chosen specialty actually belongs to the chosen profession — without
// this, a tampered request could attach "Cardiology" to "Lawyer" and poison
// the Community Intelligence drill-down counts.
async function parseAndValidate(
  supabase: SupabaseClient,
  formData: FormData,
): Promise<
  | { values: ParsedProfession; errors?: undefined }
  | { values?: undefined; errors: Partial<Record<ProfessionField, string>> }
> {
  const errors: Partial<Record<ProfessionField, string>> = {};

  const profession_id = field(formData, "profession_id");
  const specialty_id = field(formData, "specialty_id");
  const status = field(formData, "status") || "current";
  const yearsRaw = field(formData, "years_experience");
  const expertiseRaw = field(formData, "expertise_text");

  if (!profession_id) errors.profession_id = "Please choose a profession.";
  else if (!UUID_RE.test(profession_id))
    errors.profession_id = "Please choose a valid profession.";

  if (!PROFESSION_STATUS_VALUES.includes(status))
    errors.status = "Please select a valid status.";

  let years_experience: number | null = null;
  if (yearsRaw) {
    const n = Number(yearsRaw);
    if (!Number.isInteger(n) || n < YEARS_MIN || n > YEARS_MAX)
      errors.years_experience = `Enter a whole number between ${YEARS_MIN} and ${YEARS_MAX}.`;
    else years_experience = n;
  }

  let expertise_text: string | null = null;
  if (expertiseRaw) {
    if (expertiseRaw.length > EXPERTISE_MAX)
      errors.expertise_text = `Please keep this under ${EXPERTISE_MAX} characters.`;
    else expertise_text = expertiseRaw;
  }

  let specialty: string | null = null;
  if (specialty_id) {
    if (!UUID_RE.test(specialty_id)) {
      errors.specialty_id = "Please choose a valid specialty.";
    } else if (!errors.profession_id) {
      const { data } = await supabase
        .from("specialties")
        .select("profession_id")
        .eq("id", specialty_id)
        .maybeSingle();
      if (!data) errors.specialty_id = "Please choose a valid specialty.";
      else if (data.profession_id !== profession_id)
        errors.specialty_id =
          "That specialty doesn't belong to the chosen profession.";
      else specialty = specialty_id;
    }
  }

  if (Object.keys(errors).length > 0) return { errors };
  return {
    values: {
      profession_id,
      specialty_id: specialty,
      status,
      years_experience,
      expertise_text,
    },
  };
}

// All three actions run as the authenticated user, so the "Members manage own
// member_professions" policy + the column grants (migration 0005, plus the
// INSERT grant added alongside this slice) are the enforcement boundary.
// is_verified is admin-only and never sent from here. The explicit
// .eq("member_id", user.id) is belt-and-braces on top of RLS.

export async function addProfession(
  _prev: ProfessionFormState,
  formData: FormData,
): Promise<ProfessionFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      ok: false,
      message: "Your session has expired. Please sign in again.",
    };

  const parsed = await parseAndValidate(supabase, formData);
  if (parsed.errors)
    return {
      ok: false,
      errors: parsed.errors,
      message: "Please fix the highlighted fields.",
    };

  const { error } = await supabase
    .from("member_professions")
    .insert({ member_id: user.id, ...parsed.values });

  if (error) {
    if (error.code === "23505")
      return {
        ok: false,
        errors: {
          profession_id:
            "You've already added that profession — edit the existing entry instead.",
        },
        message: "Please fix the highlighted fields.",
      };
    return {
      ok: false,
      message: "Could not add this profession. Please try again.",
    };
  }

  revalidatePath("/profile");
  return { ok: true, message: "Added." };
}

export async function updateProfession(
  _prev: ProfessionFormState,
  formData: FormData,
): Promise<ProfessionFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      ok: false,
      message: "Your session has expired. Please sign in again.",
    };

  const id = field(formData, "id");
  if (!UUID_RE.test(id))
    return {
      ok: false,
      message: "Something went wrong. Please refresh and try again.",
    };

  const parsed = await parseAndValidate(supabase, formData);
  if (parsed.errors)
    return {
      ok: false,
      errors: parsed.errors,
      message: "Please fix the highlighted fields.",
    };

  const { error } = await supabase
    .from("member_professions")
    .update(parsed.values)
    .eq("id", id)
    .eq("member_id", user.id);

  if (error) {
    if (error.code === "23505")
      return {
        ok: false,
        errors: {
          profession_id:
            "You already have that profession listed — remove the duplicate first.",
        },
        message: "Please fix the highlighted fields.",
      };
    return {
      ok: false,
      message: "Could not save this profession. Please try again.",
    };
  }

  revalidatePath("/profile");
  return { ok: true, message: "Saved." };
}

export async function deleteProfession(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = field(formData, "id");
  if (!UUID_RE.test(id)) return;

  await supabase
    .from("member_professions")
    .delete()
    .eq("id", id)
    .eq("member_id", user.id);

  revalidatePath("/profile");
}
