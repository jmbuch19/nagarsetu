"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

  revalidatePath("/profile");
  return { ok: true };
}
