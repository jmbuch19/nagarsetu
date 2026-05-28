"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type InterestState = { ok: boolean; waLink?: string; message?: string };

// "I'm interested" → records a lead (the provider's Lead Inbox) and reveals a
// WhatsApp deep-link to the provider. Connector model: the provider published
// the offer, so interest opens the channel directly (no approve step). The
// WhatsApp business-initiated dual nudge (Meta template) is deferred until WABA.
export async function expressInterest(
  listingId: string,
  message: string,
): Promise<InterestState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return { ok: false, message: "Your session has expired. Please sign in again." };
  if (!UUID_RE.test(listingId))
    return { ok: false, message: "Something went wrong." };

  // Record the lead. RLS enforces seeker = caller + listing is active.
  const { error: insErr } = await supabase.from("inquiries").insert({
    seeker_id: user.id,
    listing_id: listingId,
    message: message ? message.slice(0, 500) : null,
    channel: "whatsapp",
  });
  if (insErr)
    return { ok: false, message: "Could not record your interest. Please try again." };

  // Reveal the provider's contact as a wa.me link (definer fn; active only).
  const { data: contact } = await supabase.rpc("get_listing_contact", {
    p_listing_id: listingId,
  });

  revalidatePath("/listings/leads");

  const digits = typeof contact === "string" ? contact.replace(/\D/g, "") : "";
  if (!digits)
    return {
      ok: true,
      message: "Your interest was sent — the provider will see it in their leads.",
    };

  const text = encodeURIComponent(
    "Hi, I found your listing on Jay Hatkesh and I'm interested.",
  );
  return { ok: true, waLink: `https://wa.me/${digits}?text=${text}` };
}
