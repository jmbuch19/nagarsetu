"use server";

import { createClient } from "@/lib/supabase/server";
import { welcomeIfNeeded } from "@/lib/auth/welcome";

// Called by the /join client after a successful verifyOtp — the magic-link
// path runs the same logic in /auth/callback. Idempotent (welcomed_at flag).
export async function welcomeAfterSignIn(): Promise<void> {
  const supabase = await createClient();
  await welcomeIfNeeded(supabase);
}
