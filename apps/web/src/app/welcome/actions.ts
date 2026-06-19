"use server";

import { createClient } from "@/lib/supabase/server";
import { welcomeIfNeeded } from "@/lib/auth/welcome";
import { TERMS_VERSION } from "@nagarsetu/shared";

// Completion step for OAuth (Google) sign-ups: capture Terms acceptance +
// opt-ins + (optionally) the real WhatsApp number. Phone + consent columns are
// not member-updatable (migration 0005 grants), so this goes through the
// SECURITY DEFINER RPC complete_oauth_onboarding (migration 0031), which writes
// only the caller's own row and only while the phone is still a placeholder.

export type WelcomeState = {
  ok: boolean;
  /** True when the entered number was already registered — consent still saved. */
  phoneTaken?: boolean;
  message?: string;
};

export async function completeOnboarding(input: {
  phone: string | null;
  optInWhatsapp: boolean;
  optInEmail: boolean;
  termsAccepted: boolean;
}): Promise<WelcomeState> {
  if (!input.termsAccepted) {
    return { ok: false, message: "Please accept the Terms to continue." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Your session expired — please sign in again." };
  }

  const { data, error } = await supabase.rpc("complete_oauth_onboarding", {
    p_phone: input.phone,
    p_opt_in_whatsapp: input.optInWhatsapp,
    p_opt_in_email: input.optInEmail,
    p_terms_version: TERMS_VERSION,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  // Best-effort welcome email (Google sign-ups always have an email). Idempotent.
  await welcomeIfNeeded(supabase);

  return { ok: true, phoneTaken: data === "phone_taken" };
}
