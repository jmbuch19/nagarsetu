"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import {
  deletionCancelledEmail,
  deletionScheduledEmail,
} from "@/lib/email/templates";

const GRACE_DAYS = 30;

export type DeletionState = { ok: boolean; message?: string };

// Member requests deletion of their own account. Sets deletion_requested_at to
// now() (RLS-scoped own row). The member is deactivated immediately (excluded
// from the directory + unreachable, per migration 0022) and is permanently
// erased after the grace period by the purge cron (follow-up).
export async function requestAccountDeletion(): Promise<DeletionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      ok: false,
      message: "Your session has expired. Please sign in again.",
    };

  const { error } = await supabase
    .from("members")
    .update({ deletion_requested_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error)
    return { ok: false, message: "Could not process. Please try again." };

  // Best-effort confirmation email (own email — RLS SELECT-own).
  const { data: me } = await supabase
    .from("members")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();
  if (me?.email) {
    const scheduled = new Date();
    scheduled.setDate(scheduled.getDate() + GRACE_DAYS);
    const { subject, html } = deletionScheduledEmail(
      me.full_name,
      scheduled.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    );
    await sendEmail({ to: me.email, subject, html });
  }

  revalidatePath("/profile");
  return { ok: true };
}

// Member cancels a pending deletion during the grace period.
export async function cancelAccountDeletion(): Promise<DeletionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      ok: false,
      message: "Your session has expired. Please sign in again.",
    };

  const { error } = await supabase
    .from("members")
    .update({ deletion_requested_at: null })
    .eq("id", user.id);

  if (error)
    return { ok: false, message: "Could not cancel. Please try again." };

  const { data: me } = await supabase
    .from("members")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();
  if (me?.email) {
    const { subject, html } = deletionCancelledEmail(me.full_name);
    await sendEmail({ to: me.email, subject, html });
  }

  revalidatePath("/profile");
  return { ok: true };
}
