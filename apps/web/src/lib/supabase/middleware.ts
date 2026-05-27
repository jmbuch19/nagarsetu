import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { readSupabasePublicEnvWeb } from "@nagarsetu/shared/env";

/**
 * Refreshes the Supabase session on every request and writes the rotated
 * cookies back to the response. Without this, Server Components would only
 * see a stale session.
 *
 * Pattern follows the official Supabase + Next.js App Router guidance:
 * https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const { url, anonKey } = readSupabasePublicEnvWeb();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // `getUser()` revalidates the session against Auth — required to keep
  // the cookie fresh. Do NOT remove this call.
  await supabase.auth.getUser();

  return response;
}
