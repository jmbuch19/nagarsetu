"use server";

import { createClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The magic link in the sign-in email lands here → exchanges code → /profile.
// Hardcoded to prod (like the email templates) so a send from any environment
// never embeds a localhost URL the member can't reach.
const CALLBACK = "https://www.jayhatkesh.in/auth/callback";

// Re-send a member their email sign-in link — the admin "nudge a half-started
// profile" action. Real authorization is the is_admin()-gated DB function
// admin_get_member_email (migration 0045): a non-admin caller gets a null email
// back and we stop. The email is resolved server-side from the member id, so we
// never trust a client-supplied address.
//
// The OTP send reuses the request-scoped server client. signInWithOtp only
// triggers the email (no session is created/returned), so it does NOT touch the
// admin's own cookies. shouldCreateUser:false means it only re-sends to an
// existing account and can never create one.
export async function sendReloginLink(
  memberId: string,
): Promise<{ ok: boolean; message?: string }> {
  if (!UUID_RE.test(memberId)) return { ok: false, message: "Invalid member." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Your session has expired." };

  const { data: email, error } = await supabase.rpc("admin_get_member_email", {
    p_member_id: memberId,
  });
  if (error) return { ok: false, message: "Could not look up that member." };
  if (typeof email !== "string" || !email)
    return { ok: false, message: "That member has no email on file." };

  const { error: otpErr } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: CALLBACK },
  });
  if (otpErr) return { ok: false, message: otpErr.message };

  return { ok: true, message: "Sign-in link sent." };
}
