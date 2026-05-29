"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { UUID_RE } from "../../profile/constants";

const DRIVE_KINDS = ["blood", "emergency", "help", "announcement"] as const;
const BLOOD = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export type DriveField =
  | "kind"
  | "title"
  | "body"
  | "city_id"
  | "blood_group"
  | "contact_name"
  | "contact_info"
  | "expires_at";

export type DriveState = {
  ok: boolean;
  message?: string;
  errors?: Partial<Record<DriveField, string>>;
};

function f(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v.trim() : "";
}

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, isAdmin: false };
  const { data: me } = await supabase
    .from("members")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  return { supabase, user, isAdmin: me?.role === "admin" };
}

export async function createDrive(
  _prev: DriveState,
  formData: FormData,
): Promise<DriveState> {
  const { supabase, user, isAdmin } = await assertAdmin();
  if (!user || !isAdmin) return { ok: false, message: "Admins only." };

  const kind = f(formData, "kind");
  const title = f(formData, "title");
  const body = f(formData, "body");
  const cityId = f(formData, "city_id");
  const bloodGroup = f(formData, "blood_group");
  const contactName = f(formData, "contact_name");
  const contactInfo = f(formData, "contact_info");
  const expiresRaw = f(formData, "expires_at");

  const errors: Partial<Record<DriveField, string>> = {};
  if (!(DRIVE_KINDS as readonly string[]).includes(kind))
    errors.kind = "Choose a type.";
  if (!title) errors.title = "Add a short title.";
  else if (title.length > 140) errors.title = "Keep the title under 140 characters.";
  if (!body) errors.body = "Add the details.";
  else if (body.length > 2000) errors.body = "Keep the details under 2000 characters.";
  if (cityId && !UUID_RE.test(cityId)) errors.city_id = "Please choose a valid city.";
  if (bloodGroup && !(BLOOD as readonly string[]).includes(bloodGroup))
    errors.blood_group = "Please choose a valid blood group.";
  if (contactName && contactName.length > 120)
    errors.contact_name = "Please keep this under 120 characters.";
  if (contactInfo && contactInfo.length > 200)
    errors.contact_info = "Please keep this under 200 characters.";

  let expires_at: string | null = null;
  if (expiresRaw) {
    const d = new Date(expiresRaw);
    if (Number.isNaN(d.getTime())) errors.expires_at = "Please enter a valid date.";
    else expires_at = d.toISOString();
  }

  if (Object.keys(errors).length > 0)
    return { ok: false, errors, message: "Please fix the highlighted fields." };

  const { error } = await supabase.from("drives").insert({
    kind,
    title,
    body,
    city_id: cityId || null,
    blood_group: bloodGroup || null,
    contact_name: contactName || null,
    contact_info: contactInfo || null,
    expires_at,
    created_by: user.id,
  });

  if (error) return { ok: false, message: "Could not publish the drive. Please try again." };

  revalidatePath("/admin/drives");
  revalidatePath("/");
  revalidatePath("/feed");
  return { ok: true, message: "Drive published — it's now live for the community." };
}

export async function closeDrive(formData: FormData): Promise<void> {
  const { supabase, user, isAdmin } = await assertAdmin();
  if (!user || !isAdmin) return;
  const id = f(formData, "id");
  if (!UUID_RE.test(id)) return;
  await supabase.from("drives").update({ status: "closed" }).eq("id", id);
  revalidatePath("/admin/drives");
  revalidatePath("/");
  revalidatePath("/feed");
}
