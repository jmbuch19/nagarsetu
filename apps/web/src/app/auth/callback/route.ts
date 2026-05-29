// Auth callback — exchanges the PKCE code from an email magic-link for a
// session, then redirects. Used by the temporary email test sign-in; also the
// standard callback shape for any future OAuth/magic-link flow.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { welcomeEmail } from "@/lib/email/templates";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/profile";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Best-effort welcome email, exactly once (welcomed_at flag). Never
      // blocks the redirect.
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: me } = await supabase
            .from("members")
            .select("full_name, email, welcomed_at")
            .eq("id", user.id)
            .maybeSingle();
          if (me?.email && !me.welcomed_at) {
            const { subject, html } = welcomeEmail(me.full_name);
            await sendEmail({ to: me.email, subject, html });
            await supabase
              .from("members")
              .update({ welcomed_at: new Date().toISOString() })
              .eq("id", user.id);
          }
        }
      } catch {
        // ignore — welcome is best-effort
      }
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  return NextResponse.redirect(new URL("/join?error=auth", url.origin));
}
