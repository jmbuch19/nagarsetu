import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WelcomeForm } from "./welcome-form";

// Completion screen for OAuth (Google) sign-ups — accept Terms + add a WhatsApp
// number before entering the app. Email/phone signups already accepted Terms at
// signup (terms_accepted_at set), so they never land here; the middleware gate
// + /auth/callback both route on the same terms_accepted_at predicate.

export default async function WelcomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/join");

  const { data: me } = await supabase
    .from("members")
    .select("terms_accepted_at, full_name")
    .eq("id", user.id)
    .maybeSingle();

  // Already completed — nothing to do here.
  if (me?.terms_accepted_at) redirect("/profile");

  return <WelcomeForm firstName={firstNameFrom(me?.full_name, user.email)} />;
}

// A gentle greeting. Google doesn't populate members.full_name (name stays
// member-entered + immutable on the profile), so fall back to the email local
// part for the welcome line only.
function firstNameFrom(fullName?: string | null, email?: string | null): string | null {
  if (fullName) return fullName.split(/\s+/)[0] ?? null;
  if (email) {
    const local = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();
    if (local) return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return null;
}
