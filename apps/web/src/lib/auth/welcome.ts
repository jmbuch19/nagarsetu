// Send the warm welcome email exactly once per member. Idempotent via the
// members.welcomed_at flag, so it's safe to call from any post-sign-in path —
// /auth/callback (magic-link), the /join OTP-code action, or future flows.
// Best-effort: never throws (email failures must not break sign-in).

import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/send";
import { welcomeEmail } from "@/lib/email/templates";

export async function welcomeIfNeeded(
  supabase: SupabaseClient,
): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: me } = await supabase
      .from("members")
      .select("full_name, email, welcomed_at")
      .eq("id", user.id)
      .maybeSingle();
    if (!me?.email || me.welcomed_at) return;

    const { subject, html } = welcomeEmail(me.full_name);
    await sendEmail({ to: me.email, subject, html });
    await supabase
      .from("members")
      .update({ welcomed_at: new Date().toISOString() })
      .eq("id", user.id);
  } catch {
    // best-effort — never let welcome failures break the sign-in path
  }
}
