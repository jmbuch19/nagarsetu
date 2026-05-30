"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { connectionRequestEmail } from "@/lib/email/templates";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOTE_MAX = 500;
const CONTEXT_MAX = 120;

export type ConnectionActionState = { ok: boolean; message?: string };

function field(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v.trim() : "";
}

// A requests to connect with a recipient. RLS enforces requester = caller and
// status = pending; the unique (requester, recipient) constraint blocks dupes.
export async function requestConnection(
  _prev: ConnectionActionState,
  formData: FormData,
): Promise<ConnectionActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      ok: false,
      message: "Your session has expired. Please sign in again.",
    };

  const recipient_id = field(formData, "recipient_id");
  const note = field(formData, "note");
  const context = field(formData, "context");

  if (!UUID_RE.test(recipient_id) || recipient_id === user.id)
    return { ok: false, message: "Something went wrong. Please try again." };
  if (note.length > NOTE_MAX)
    return { ok: false, message: `Please keep your note under ${NOTE_MAX} characters.` };

  const { error } = await supabase.from("connection_requests").insert({
    requester_id: user.id,
    recipient_id,
    note: note || null,
    context: context ? context.slice(0, CONTEXT_MAX) : null,
  });

  if (error) {
    if (error.code === "23505")
      return {
        ok: false,
        message: "You've already sent a request to this member.",
      };
    return {
      ok: false,
      message: "Could not send your request. Please try again.",
    };
  }

  // Best-effort notification email (test phase). The request now links us, so
  // get_member_email returns the recipient's email.
  const { data: recipientEmail } = await supabase.rpc("get_member_email", {
    p_member_id: recipient_id,
  });
  if (typeof recipientEmail === "string" && recipientEmail) {
    const { subject, html } = connectionRequestEmail(note || null);
    await sendEmail({ to: recipientEmail, subject, html });
  }

  revalidatePath("/directory");
  revalidatePath("/connections");
  return { ok: true, message: "Request sent — they'll see it in the app." };
}

// The recipient approves or declines a pending request. RLS restricts UPDATE
// to the recipient; the column grant restricts writes to status/responded_at.
export async function respondToRequest(
  _prev: ConnectionActionState,
  formData: FormData,
): Promise<ConnectionActionState> {
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
  const decision = field(formData, "decision");
  if (!UUID_RE.test(id) || (decision !== "approve" && decision !== "decline"))
    return { ok: false, message: "Something went wrong. Please try again." };

  const { error } = await supabase
    .from("connection_requests")
    .update({
      status: decision === "approve" ? "approved" : "declined",
      responded_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("recipient_id", user.id)
    .eq("status", "pending");

  if (error)
    return { ok: false, message: "Could not update. Please try again." };

  revalidatePath("/connections");
  revalidatePath("/directory");
  return {
    ok: true,
    message: decision === "approve" ? "Connection approved." : "Request declined.",
  };
}

// Withdraw a pending request the CURRENT user sent. RLS pins this to the
// requester's own pending row (migration 0040). After withdrawal, the
// requester can re-send a fresh request if they change their mind.
export async function withdrawConnectionRequest(
  recipientId: string,
): Promise<{ ok: boolean; message?: string }> {
  if (!UUID_RE.test(recipientId))
    return { ok: false, message: "Invalid member." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Your session has expired." };

  const { error } = await supabase
    .from("connection_requests")
    .delete()
    .eq("requester_id", user.id)
    .eq("recipient_id", recipientId)
    .eq("status", "pending");
  if (error) return { ok: false, message: "Could not withdraw the request." };

  revalidatePath("/directory");
  revalidatePath("/connections");
  return { ok: true };
}

export type RevealState = {
  ok: boolean;
  waLink?: string;
  mailto?: string;
  email?: string;
  message?: string;
};

// Reveal a member's contact channels — but ONLY through the SECURITY DEFINER
// get_revealed_contact() function, which returns phone + email only when
// consent holds (openly_contactable OR an approved connection). Raw phone is
// never displayed; it's embedded in the wa.me href. Email is embedded in a
// mailto: href.
export async function revealContact(recipientId: string): Promise<RevealState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Your session has expired." };
  if (!UUID_RE.test(recipientId))
    return { ok: false, message: "Invalid member." };

  const { data, error } = await supabase.rpc("get_revealed_contact", {
    target: recipientId,
  });
  if (error)
    return { ok: false, message: "Could not reveal contact. Please try again." };

  const row = (Array.isArray(data) ? data[0] : data) as
    | { phone?: string | null; email?: string | null }
    | undefined;
  const phone = row?.phone || undefined;
  const email = row?.email || undefined;

  if (!phone && !email) {
    return {
      ok: false,
      message: "This member isn't reachable yet — send a connection request.",
    };
  }

  let waLink: string | undefined;
  if (phone) {
    const digits = phone.replace(/\D/g, "");
    if (digits.length >= 6) {
      const text = encodeURIComponent(
        "Hi, I found you on Jay Hatkesh and would like to connect.",
      );
      waLink = `https://wa.me/${digits}?text=${text}`;
    }
  }

  let mailto: string | undefined;
  if (email) {
    const subject = encodeURIComponent(
      "Hello from a fellow Nagar — Jay Hatkesh",
    );
    mailto = `mailto:${email}?subject=${subject}`;
  }

  return { ok: true, waLink, mailto, email };
}
