import Link from "next/link";
import { identity, motto, salutation } from "@nagarsetu/shared";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <p className="text-sm tracking-[0.3em] text-brand-text-muted uppercase">
        {identity.tagline.en}
      </p>
      <h1 className="mt-3 text-6xl font-light tracking-tight text-brand-primary sm:text-7xl">
        {identity.name.en}
      </h1>
      <p
        className="mt-3 text-3xl font-light text-brand-primary-dark"
        lang="gu"
      >
        {identity.name.gu}
      </p>
      <p className="mt-8 text-sm text-brand-text-muted" lang="gu">
        {motto.gu}
      </p>
      <p className="mt-1 text-xs text-brand-text-muted">{motto.en}</p>

      <div className="mt-10">
        {user ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-brand-text">
              Signed in as <span className="font-medium">{user.phone}</span>
            </p>
            <form action="/auth/sign-out" method="post">
              <button
                type="submit"
                className="rounded-lg border border-brand-border bg-white px-5 py-2 text-sm text-brand-text transition hover:border-brand-primary hover:text-brand-primary"
              >
                Sign out
              </button>
            </form>
            <p className="mt-4 text-xs text-brand-text-muted" lang="gu">
              {salutation.gu}
            </p>
          </div>
        ) : (
          <Link
            href="/sign-in"
            className="inline-block rounded-lg bg-brand-primary px-6 py-2.5 text-base font-medium text-white transition hover:bg-brand-primary-dark"
          >
            Sign in
          </Link>
        )}
      </div>
    </main>
  );
}
