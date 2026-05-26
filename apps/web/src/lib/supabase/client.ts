"use client";

import { createBrowserClient } from "@supabase/ssr";
import { readSupabasePublicEnvWeb } from "@nagarsetu/shared/env";

export function createClient() {
  const { url, anonKey } = readSupabasePublicEnvWeb();
  return createBrowserClient(url, anonKey);
}
