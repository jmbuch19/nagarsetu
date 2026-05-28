"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  CAPABILITY_DESC_MAX,
  CAPABILITY_KIND_VALUES,
  DOMAIN_MAX,
  UUID_RE,
} from "./constants";

export type CapabilityField = "kind" | "domain" | "description";

export type CapabilityFormState = {
  ok: boolean;
  message?: string;
  errors?: Partial<Record<CapabilityField, string>>;
};

type ParsedCapability = {
  kind: string;
  domain: string;
  description: string | null;
  is_offered: boolean;
};

function field(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v.trim() : "";
}

function parse(formData: FormData):
  | { values: ParsedCapability; errors?: undefined }
  | { values?: undefined; errors: Partial<Record<CapabilityField, string>> } {
  const errors: Partial<Record<CapabilityField, string>> = {};

  const kind = field(formData, "kind");
  const domain = field(formData, "domain");
  const descriptionRaw = field(formData, "description");
  // Checkbox: present (any value) = offering; absent = paused.
  const is_offered = formData.get("is_offered") != null;

  if (!kind) errors.kind = "Please choose what you'd like to offer.";
  else if (!CAPABILITY_KIND_VALUES.includes(kind))
    errors.kind = "Please choose a valid option.";

  if (!domain) errors.domain = "Please add a field or area (e.g. Cardiology).";
  else if (domain.length > DOMAIN_MAX)
    errors.domain = `Please keep this under ${DOMAIN_MAX} characters.`;

  let description: string | null = null;
  if (descriptionRaw) {
    if (descriptionRaw.length > CAPABILITY_DESC_MAX)
      errors.description = `Please keep this under ${CAPABILITY_DESC_MAX} characters.`;
    else description = descriptionRaw;
  }

  if (Object.keys(errors).length > 0) return { errors };
  return { values: { kind, domain, description, is_offered } };
}

// All three actions run as the authenticated user, so the "Members manage own
// member_capabilities" policy (auth.uid() = member_id) is the enforcement
// boundary. member_capabilities has no admin-only columns, so no column-grant
// guard is needed. Explicit .eq("member_id", user.id) is belt-and-braces.

export async function addCapability(
  _prev: CapabilityFormState,
  formData: FormData,
): Promise<CapabilityFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      ok: false,
      message: "Your session has expired. Please sign in again.",
    };

  const parsed = parse(formData);
  if (parsed.errors)
    return {
      ok: false,
      errors: parsed.errors,
      message: "Please fix the highlighted fields.",
    };

  const { error } = await supabase
    .from("member_capabilities")
    .insert({ member_id: user.id, ...parsed.values });

  if (error) {
    if (error.code === "23505")
      return {
        ok: false,
        errors: {
          domain:
            "You've already added that — edit the existing entry instead.",
        },
        message: "Please fix the highlighted fields.",
      };
    return {
      ok: false,
      message: "Could not add this. Please try again.",
    };
  }

  revalidatePath("/profile");
  return { ok: true, message: "Added — thank you for offering." };
}

export async function updateCapability(
  _prev: CapabilityFormState,
  formData: FormData,
): Promise<CapabilityFormState> {
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

  const parsed = parse(formData);
  if (parsed.errors)
    return {
      ok: false,
      errors: parsed.errors,
      message: "Please fix the highlighted fields.",
    };

  const { error } = await supabase
    .from("member_capabilities")
    .update(parsed.values)
    .eq("id", id)
    .eq("member_id", user.id);

  if (error) {
    if (error.code === "23505")
      return {
        ok: false,
        errors: {
          domain: "You already have that listed — remove the duplicate first.",
        },
        message: "Please fix the highlighted fields.",
      };
    return {
      ok: false,
      message: "Could not save this. Please try again.",
    };
  }

  revalidatePath("/profile");
  return { ok: true, message: "Saved." };
}

export async function deleteCapability(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = field(formData, "id");
  if (!UUID_RE.test(id)) return;

  await supabase
    .from("member_capabilities")
    .delete()
    .eq("id", id)
    .eq("member_id", user.id);

  revalidatePath("/profile");
}
