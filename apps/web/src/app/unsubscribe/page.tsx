// /unsubscribe — public, token-gated. The member's unguessable
// unsubscribe_token (per-member uuid, set in migration 0038) authenticates the
// request. Calls unsubscribe_email_by_token(); the function is SECURITY DEFINER
// and revokes the opt_in_email flag. Returning true = freshly unsubscribed;
// false = invalid token or already unsubscribed (indistinguishable on purpose,
// to avoid enumeration). DPDP: withdrawing must be as easy as giving.

import Link from "next/link";
import { identity } from "@nagarsetu/shared";
import { createClient } from "@/lib/supabase/server";
import { UUID_RE } from "../profile/constants";

export const metadata = {
  title: `Unsubscribe — ${identity.name.en}`,
  description: "Stop receiving Jay Hatkesh community-update emails.",
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const ok = typeof token === "string" && UUID_RE.test(token);

  let unsubscribed = false;
  if (ok) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("unsubscribe_email_by_token", {
      p_token: token,
    });
    unsubscribed = !!data;
  }

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-16">
      <div className="rounded-2xl border border-brand-border bg-white p-8 shadow-sm">
        <p className="text-xs tracking-[0.3em] text-brand-text-muted uppercase">
          {identity.tagline.en}
        </p>
        <h1 className="mt-2 text-2xl font-light text-brand-primary">
          {ok
            ? unsubscribed
              ? "You've been unsubscribed."
              : "You're already unsubscribed."
            : "Invalid unsubscribe link."}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-brand-text-muted">
          {ok
            ? "You won't receive community-update emails from Jay Hatkesh anymore. You're still a member — sign-in, listings, leads, the directory, and connections continue as normal. You can opt back in anytime from your profile settings."
            : "The link you used doesn't look right. Try opening the unsubscribe link from the most recent email, or update your preferences from your profile."}
        </p>
        <div className="mt-6 flex gap-3 text-sm">
          <Link
            href="/profile"
            className="rounded-lg border border-brand-border px-4 py-2 text-brand-text transition hover:border-brand-primary hover:text-brand-primary"
          >
            Your profile
          </Link>
          <Link
            href="/"
            className="rounded-lg bg-brand-primary px-4 py-2 text-white transition hover:bg-brand-primary-dark"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
