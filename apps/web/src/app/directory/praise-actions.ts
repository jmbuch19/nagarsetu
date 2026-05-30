"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOTE_MAX = 280;

export type PraiseActionState = { ok: boolean; message?: string };

function field(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v.trim() : "";
}

// Endorser writes their own row. RLS enforces endorser_id = caller, the
// CHECK blocks self-praise, the UNIQUE blocks duplicate praise of the same
// recipient — translated here into a friendlier message.
export async function addEndorsement(
  _prev: PraiseActionState,
  formData: FormData,
): Promise<PraiseActionState> {
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

  if (!UUID_RE.test(recipient_id) || recipient_id === user.id)
    return { ok: false, message: "Something went wrong. Please try again." };
  if (note.length > NOTE_MAX)
    return {
      ok: false,
      message: `Please keep your note under ${NOTE_MAX} characters.`,
    };

  const { error } = await supabase.from("member_endorsements").insert({
    endorser_id: user.id,
    recipient_id,
    note: note || null,
  });

  if (error) {
    if (error.code === "23505")
      return {
        ok: false,
        message: "You've already praised this member — tap Praised ✓ to revoke first.",
      };
    return {
      ok: false,
      message: "Could not record your praise. Please try again.",
    };
  }

  revalidatePath("/directory");
  return { ok: true, message: "Praise recorded." };
}

// Revoke own praise. RLS pins delete to endorser_id = caller, so the
// .eq("endorser_id", user.id) is belt-and-braces (the policy alone would
// limit this to the caller's own row).
export async function removeEndorsement(
  recipientId: string,
): Promise<PraiseActionState> {
  if (!UUID_RE.test(recipientId))
    return { ok: false, message: "Invalid member." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Your session has expired." };

  const { error } = await supabase
    .from("member_endorsements")
    .delete()
    .eq("endorser_id", user.id)
    .eq("recipient_id", recipientId);
  if (error) return { ok: false, message: "Could not remove your praise." };

  revalidatePath("/directory");
  return { ok: true };
}
