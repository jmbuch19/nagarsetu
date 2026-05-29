// Persistent top nav for signed-in members. Rendered app-wide from the root
// layout; returns null for guests, so the marketing landing + public pages
// (faq/contact/terms/privacy/join/sign-in) are unaffected. Gives every
// signed-in page a one-tap path to Home / Directory / Feed / Profile (+ Admin)
// and Sign out — there was no global nav before, so members got stranded.

import Link from "next/link";
import { identity } from "@nagarsetu/shared";
import { createClient } from "@/lib/supabase/server";

const linkClass =
  "text-sm text-brand-text-muted transition hover:text-brand-primary";

export async function MemberNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: me } = await supabase
    .from("members")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = me?.role === "admin";

  return (
    <nav className="sticky top-0 z-40 border-b border-brand-border bg-background">
      <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center gap-x-5 gap-y-2 px-6 py-3">
        <Link
          href="/"
          className="text-sm font-medium tracking-tight text-brand-primary"
        >
          {identity.name.en}
        </Link>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href="/" className={linkClass}>
            Home
          </Link>
          <Link href="/directory" className={linkClass}>
            Directory
          </Link>
          <Link href="/feed" className={linkClass}>
            Feed
          </Link>
          <Link href="/profile" className={linkClass}>
            Profile
          </Link>
          {isAdmin ? (
            <Link
              href="/admin/verifications"
              className="text-sm text-brand-accent transition hover:underline"
            >
              Admin
            </Link>
          ) : null}
        </div>
        <form action="/auth/sign-out" method="post" className="ml-auto">
          <button type="submit" className={linkClass}>
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}
