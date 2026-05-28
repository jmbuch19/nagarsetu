"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHORT_MAX = 200;
const DETAILS_MAX = 2000;

export type RequestField =
  | "category_id"
  | "city_id"
  | "area_text"
  | "budget_text"
  | "needed_from"
  | "needed_to"
  | "details";

export type RequestFormState = {
  ok: boolean;
  message?: string;
  errors?: Partial<Record<RequestField, string>>;
};

function field(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v.trim() : "";
}
function orNull(s: string): string | null {
  return s ? s : null;
}

export async function createRequest(
  _prev: RequestFormState,
  formData: FormData,
): Promise<RequestFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return { ok: false, message: "Your session has expired. Please sign in again." };

  const category_id = field(formData, "category_id");
  const city_id = field(formData, "city_id");
  const area_text = field(formData, "area_text");
  const budget_text = field(formData, "budget_text");
  const needed_from = field(formData, "needed_from");
  const needed_to = field(formData, "needed_to");
  const gender_pref = field(formData, "gender_pref");
  const food_pref = field(formData, "food_pref");
  const details = field(formData, "details");

  const errors: Partial<Record<RequestField, string>> = {};
  if (!category_id || !UUID_RE.test(category_id))
    errors.category_id = "Please choose what you're looking for.";
  if (city_id && !UUID_RE.test(city_id))
    errors.city_id = "Please choose a valid city.";
  if (area_text.length > SHORT_MAX || budget_text.length > SHORT_MAX)
    errors.budget_text = "Please keep these short.";
  if (details.length > DETAILS_MAX)
    errors.details = `Please keep details under ${DETAILS_MAX} characters.`;
  if (needed_from && needed_to && needed_from > needed_to)
    errors.needed_to = "The end date can't be before the start date.";

  if (Object.keys(errors).length > 0)
    return { ok: false, errors, message: "Please fix the highlighted fields." };

  const { error } = await supabase.from("requests").insert({
    member_id: user.id,
    category_id,
    city_id: orNull(city_id),
    area_text: orNull(area_text),
    budget_text: orNull(budget_text),
    needed_from: orNull(needed_from),
    needed_to: orNull(needed_to),
    gender_pref: orNull(gender_pref),
    food_pref: orNull(food_pref),
    details: orNull(details),
  });
  if (error)
    return { ok: false, message: "Could not post your request. Please try again." };

  revalidatePath("/requests");
  redirect("/requests");
}

export type RequestActionState = { ok: boolean; message?: string };

export async function setRequestStatus(
  _prev: RequestActionState,
  formData: FormData,
): Promise<RequestActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Your session has expired." };

  const id = field(formData, "request_id");
  const status = field(formData, "status");
  if (!UUID_RE.test(id) || !["open", "fulfilled", "closed"].includes(status))
    return { ok: false, message: "Something went wrong." };

  const { error } = await supabase
    .from("requests")
    .update({ status })
    .eq("id", id)
    .eq("member_id", user.id);
  if (error) return { ok: false, message: "Could not update. Please try again." };

  revalidatePath("/requests");
  return { ok: true };
}

export async function deleteRequest(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const id = field(formData, "request_id");
  if (!UUID_RE.test(id)) return;
  await supabase.from("requests").delete().eq("id", id).eq("member_id", user.id);
  revalidatePath("/requests");
}

export type RespondState = { ok: boolean; waLink?: string; message?: string };

// "I can help" → reveal the seeker's WhatsApp deep-link (open requests only).
export async function respondToRequest(
  requestId: string,
): Promise<RespondState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Your session has expired." };
  if (!UUID_RE.test(requestId))
    return { ok: false, message: "Something went wrong." };

  const { data: contact } = await supabase.rpc("get_request_contact", {
    p_request_id: requestId,
  });
  const digits = typeof contact === "string" ? contact.replace(/\D/g, "") : "";
  if (!digits)
    return { ok: false, message: "This member isn't reachable right now." };

  const text = encodeURIComponent(
    "Hi, I saw your request on Jay Hatkesh and I can help.",
  );
  return { ok: true, waLink: `https://wa.me/${digits}?text=${text}` };
}
