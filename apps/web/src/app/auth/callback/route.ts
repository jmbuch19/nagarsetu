// Auth callback — exchanges the PKCE code from an email magic-link for a
// session, then redirects. Used by the temporary email test sign-in; also the
// standard callback shape for any future OAuth/magic-link flow.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/profile";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  return NextResponse.redirect(new URL("/test-sign-in?error=auth", url.origin));
}
