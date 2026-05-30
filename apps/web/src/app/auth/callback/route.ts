// Auth callback — exchanges the PKCE code from an email magic-link for a
// session, then redirects. Used by the temporary email test sign-in; also the
// standard callback shape for any future OAuth/magic-link flow.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { welcomeIfNeeded } from "@/lib/auth/welcome";

// Only same-origin relative paths are allowed as a post-auth destination.
// Anything absolute ("https://evil.com"), protocol-relative ("//evil.com"),
// or backslash-tricked ("/\\evil.com") is rejected — otherwise the callback
// becomes an open redirect that fires right after a successful session
// exchange (a phishing vector).
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return "/profile";
  }
  return raw;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Best-effort welcome (idempotent via welcomed_at flag). Never blocks.
      await welcomeIfNeeded(supabase);
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  return NextResponse.redirect(new URL("/join?error=auth", url.origin));
}
