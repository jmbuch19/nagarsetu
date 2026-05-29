"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { leadEmail } from "@/lib/email/templates";

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

  // Best-effort lead email to the provider (test-phase notification). The
  // inquiry now links us, so get_member_email returns the provider's email.
  const { data: listing } = await supabase
    .from("listings")
    .select("member_id, title")
    .eq("id", listingId)
    .maybeSingle();
  if (listing) {
    const { data: providerEmail } = await supabase.rpc("get_member_email", {
      p_member_id: listing.member_id,
    });
    if (typeof providerEmail === "string" && providerEmail) {
      const { subject, html } = leadEmail(listing.title);
      await sendEmail({ to: providerEmail, subject, html });
    }
  }

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
