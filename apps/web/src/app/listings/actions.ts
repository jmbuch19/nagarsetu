"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { listingPublishedEmail } from "@/lib/email/templates";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TITLE_MAX = 120;
const DESC_MAX = 2000;
const SHORT_MAX = 200;

export type ListingField =
  | "category_id"
  | "title"
  | "description"
  | "price_text"
  | "location_city_id"
  | "pincode"
  | "area_text"
  | "address"
  | "service_area"
  | "hours"
  | "contact_whatsapp"
  | "contact_phone";

export type ListingFormState = {
  ok: boolean;
  message?: string;
  errors?: Partial<Record<ListingField, string>>;
};

function field(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v.trim() : "";
}

function orNull(s: string): string | null {
  return s ? s : null;
}

// Create a DRAFT listing. time_binding is taken from the chosen category
// (server-side) — never trusted from the client. status defaults to 'draft'
// and the lifecycle/fee columns aren't grantable, so a new listing is always
// inert until published via set_listing_status / the payment flow.
export async function createListing(
  _prev: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      ok: false,
      message: "Your session has expired. Please sign in again.",
    };

  const category_id = field(formData, "category_id");
  const title = field(formData, "title");
  const description = field(formData, "description");
  const price_text = field(formData, "price_text");
  const location_city_id = field(formData, "location_city_id");
  const pincode = field(formData, "pincode");
  const area_text = field(formData, "area_text");
  const address = field(formData, "address");
  const service_area = field(formData, "service_area");
  const hours = field(formData, "hours");
  const contact_whatsapp = field(formData, "contact_whatsapp");
  const contact_phone = field(formData, "contact_phone");

  const errors: Partial<Record<ListingField, string>> = {};
  if (!category_id || !UUID_RE.test(category_id))
    errors.category_id = "Please choose a category.";
  if (!title) errors.title = "Please give your listing a title.";
  else if (title.length > TITLE_MAX)
    errors.title = `Please keep the title under ${TITLE_MAX} characters.`;
  if (description.length > DESC_MAX)
    errors.description = `Please keep the description under ${DESC_MAX} characters.`;
  if (location_city_id && !UUID_RE.test(location_city_id))
    errors.location_city_id = "Please choose a valid city.";
  for (const [val, key] of [
    [price_text, "price_text"],
    [pincode, "pincode"],
    [area_text, "area_text"],
    [address, "address"],
    [service_area, "service_area"],
    [hours, "hours"],
    [contact_whatsapp, "contact_whatsapp"],
    [contact_phone, "contact_phone"],
  ] as const) {
    if (val.length > SHORT_MAX)
      errors[key] = `Please keep this under ${SHORT_MAX} characters.`;
  }

  if (Object.keys(errors).length > 0)
    return { ok: false, errors, message: "Please fix the highlighted fields." };

  // time_binding comes from the category (NOT NULL on listings).
  const { data: cat } = await supabase
    .from("listing_categories")
    .select("time_binding")
    .eq("id", category_id)
    .maybeSingle();
  if (!cat)
    return { ok: false, errors: { category_id: "Please choose a valid category." } };

  const { error } = await supabase.from("listings").insert({
    member_id: user.id,
    category_id,
    title,
    description: orNull(description),
    time_binding: cat.time_binding,
    price_text: orNull(price_text),
    location_city_id: orNull(location_city_id),
    pincode: orNull(pincode),
    area_text: orNull(area_text),
    address: orNull(address),
    service_area: orNull(service_area),
    hours: orNull(hours),
    contact_whatsapp: orNull(contact_whatsapp),
    contact_phone: orNull(contact_phone),
  });

  if (error)
    return { ok: false, message: "Could not create the listing. Please try again." };

  revalidatePath("/listings");
  redirect("/listings");
}

export type StatusState = { ok: boolean; message?: string };

const STATUS_MESSAGES: Record<string, string> = {
  id_verification_required:
    "Verify your identity first (Profile → Identity verification) to publish this category.",
  payment_required:
    "This category carries the listing fee — paid publishing is coming soon.",
  not_publishable: "This listing can't be published from its current state.",
  not_your_listing: "That isn't your listing.",
};

// Publish (free categories) / pause / resume — via the gated DB function.
export async function setListingStatus(
  _prev: StatusState,
  formData: FormData,
): Promise<StatusState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Your session has expired." };

  const id = field(formData, "listing_id");
  const action = field(formData, "action");
  if (!UUID_RE.test(id) || !["publish", "pause", "resume"].includes(action))
    return { ok: false, message: "Something went wrong." };

  const { error } = await supabase.rpc("set_listing_status", {
    p_listing_id: id,
    p_action: action,
  });

  if (error) {
    const key = Object.keys(STATUS_MESSAGES).find((k) =>
      error.message.includes(k),
    );
    return {
      ok: false,
      message: key ? STATUS_MESSAGES[key] : "Could not update. Please try again.",
    };
  }

  // Best-effort "your listing is live" email on publish (own email).
  if (action === "publish") {
    const [{ data: me }, { data: listing }] = await Promise.all([
      supabase.from("members").select("full_name, email").eq("id", user.id).maybeSingle(),
      supabase.from("listings").select("title, expires_at").eq("id", id).maybeSingle(),
    ]);
    if (me?.email && listing) {
      const { subject, html } = listingPublishedEmail(
        me.full_name,
        listing.title,
        listing.expires_at
          ? new Date(listing.expires_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : null,
      );
      await sendEmail({ to: me.email, subject, html });
    }
  }

  revalidatePath("/listings");
  return { ok: true };
}

export async function deleteListing(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const id = field(formData, "listing_id");
  if (!UUID_RE.test(id)) return;
  await supabase.from("listings").delete().eq("id", id).eq("member_id", user.id);
  revalidatePath("/listings");
}
