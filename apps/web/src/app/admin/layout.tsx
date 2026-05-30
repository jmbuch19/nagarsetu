// Admin area gate. Every /admin/* page inherits this — non-admins are
// redirected away. Role is read from the member's own row (RLS SELECT-own),
// so this can't be spoofed client-side. The real enforcement for admin
// mutations lives in the is_admin()-gated SECURITY DEFINER functions; this
// gate is the UI boundary.

import { redirect } from "next/navigation";
import Link from "next/link";
import { identity } from "@nagarsetu/shared";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/join");

  const { data: me } = await supabase
    .from("members")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (me?.role !== "admin") redirect("/");

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <header className="mb-6 flex items-center justify-between gap-4 border-b border-brand-border pb-4">
        <div>
          <p className="text-xs tracking-[0.3em] text-brand-text-muted uppercase">
            {identity.name.en} · Admin
          </p>
          <nav className="mt-2 flex gap-4 text-sm">
            <Link
              href="/admin/verifications"
              className="font-medium text-brand-primary hover:underline"
            >
              ID verifications
            </Link>
            <Link
              href="/admin/drives"
              className="font-medium text-brand-primary hover:underline"
            >
              Drives
            </Link>
            <Link
              href="/admin/posts"
              className="font-medium text-brand-primary hover:underline"
            >
              Member posts
            </Link>
            <Link
              href="/admin/surnames"
              className="font-medium text-brand-primary hover:underline"
            >
              Surnames
            </Link>
          </nav>
        </div>
        <Link
          href="/"
          className="shrink-0 text-sm text-brand-text-muted hover:text-brand-primary"
        >
          ← Back to app
        </Link>
      </header>
      {children}
    </div>
  );
}
