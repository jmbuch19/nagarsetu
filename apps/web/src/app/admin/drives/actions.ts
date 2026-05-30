"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { driveBlastEmail } from "@/lib/email/templates";
import { UUID_RE } from "../../profile/constants";

// Used for the unsubscribe link baked into every drive email — same hardcoded
// production URL as templates.ts (recipients open the link from their inbox,
// not the host that sent it).
const APP_URL = "https://www.jayhatkesh.in";

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

// Admin "also email this drive" — one-shot: refuses to re-send if emailed_at
// is already set. Reaches only members with opt_in_email=true, includes a
// per-member unsubscribe link in every email (DPDP). Best-effort per recipient;
// the action counts successful sends and updates the drive's stats.
export async function emailDriveToMembers(
  formData: FormData,
): Promise<{ ok: boolean; sent: number; message?: string }> {
  const { supabase, user, isAdmin } = await assertAdmin();
  if (!user || !isAdmin) return { ok: false, sent: 0, message: "Admins only." };

  const driveId = f(formData, "id");
  if (!UUID_RE.test(driveId))
    return { ok: false, sent: 0, message: "Bad drive id." };

  // Drive (with city name via PostgREST embed) + throttle check.
  const { data: driveRow, error: driveErr } = await supabase
    .from("drives")
    .select(
      "id, kind, title, body, blood_group, contact_name, contact_info, cities(name), emailed_at",
    )
    .eq("id", driveId)
    .maybeSingle();
  if (driveErr || !driveRow)
    return { ok: false, sent: 0, message: "Drive not found." };
  if (driveRow.emailed_at)
    return {
      ok: false,
      sent: 0,
      message: "This drive was already emailed (one-shot).",
    };

  const drive = driveRow as unknown as {
    id: string;
    kind: string;
    title: string;
    body: string;
    blood_group: string | null;
    contact_name: string | null;
    contact_info: string | null;
    cities: { name: string } | null;
  };

  // Opted-in members (admin RLS allows reading all rows; only the columns we
  // need leave the DB).
  const { data: targetsRaw } = await supabase
    .from("members")
    .select("email, unsubscribe_token, full_name")
    .eq("opt_in_email", true)
    .not("email", "is", null);
  const targets = (targetsRaw ?? []) as {
    email: string | null;
    unsubscribe_token: string;
    full_name: string | null;
  }[];

  let sent = 0;
  for (const m of targets) {
    if (!m.email) continue;
    const unsubscribeUrl = `${APP_URL}/unsubscribe?token=${m.unsubscribe_token}`;
    const { subject, html } = driveBlastEmail(
      {
        kind: drive.kind,
        title: drive.title,
        body: drive.body,
        bloodGroup: drive.blood_group,
        cityName: drive.cities?.name ?? null,
        contactName: drive.contact_name,
        contactInfo: drive.contact_info,
      },
      unsubscribeUrl,
    );
    const r = await sendEmail({ to: m.email, subject, html });
    if (r.ok) sent++;
  }

  await supabase
    .from("drives")
    .update({ emailed_at: new Date().toISOString(), emailed_count: sent })
    .eq("id", driveId);

  revalidatePath("/admin/drives");
  return {
    ok: true,
    sent,
    message: `Sent to ${sent} member${sent === 1 ? "" : "s"}.`,
  };
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
