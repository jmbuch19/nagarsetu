import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { readSupabasePublicEnvWeb } from "@nagarsetu/shared/env";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = readSupabasePublicEnvWeb();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[]
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component — middleware will refresh the session.
          // Add the middleware when the auth flow lands.
        }
      },
    },
  });
}
