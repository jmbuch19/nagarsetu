import { createServerClient, type CookieOptions } from "@supabase/ssr";
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
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[]
      ) {
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Onboarding gate: OAuth (Google) sign-ups land authenticated but with
  // terms_accepted_at = NULL (Google can't carry our consent). They must finish
  // on /welcome before any app access (DPDP: consent before processing). The
  // `ns_onboarded` cookie is a fast-path so this costs ONE indexed lookup, once
  // — every later navigation short-circuits on the cookie.
  if (user && request.cookies.get("ns_onboarded")?.value !== "1") {
    const path = request.nextUrl.pathname;
    if (gateApplies(path)) {
      const { data: me } = await supabase
        .from("members")
        .select("terms_accepted_at")
        .eq("id", user.id)
        .maybeSingle();

      if (me?.terms_accepted_at) {
        // Completed — remember it so we never re-query on this device.
        response.cookies.set("ns_onboarded", "1", {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 30, // 30 days, matches the session window
        });
      } else {
        const url = request.nextUrl.clone();
        url.pathname = "/welcome";
        url.search = "";
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}

// Paths an unfinished member must still reach: the completion screen itself,
// auth/callback, the sign-in/join entries, the public legal + marketing pages,
// and all API routes. Everything else is gated until consent is recorded.
const EXEMPT_PREFIXES = [
  "/welcome",
  "/auth",
  "/join",
  "/sign-in",
  "/terms",
  "/privacy",
  "/about",
  "/support",
  "/faq",
  "/data",
  "/api",
];

function gateApplies(path: string): boolean {
  return !EXEMPT_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );
}
