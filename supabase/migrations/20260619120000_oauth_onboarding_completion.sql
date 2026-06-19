-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0031 — OAuth (Google) onboarding completion RPC
--
-- Google sign-in returns an email but NO phone and NO Terms acceptance, so the
-- bootstrap trigger (migration 0030, email branch) creates the members row with
-- a placeholder phone ('email:' || id) and terms_accepted_at = NULL. The
-- /welcome completion screen then captures consent + (optionally) the real
-- WhatsApp number and calls this function.
--
-- Why an RPC and not a plain client UPDATE: migration 0005's column grants
-- deliberately make `phone`, `terms_accepted_at`, and `terms_version`
-- NON-updatable by members (phone is the protected identity key; consent is
-- audit-sensitive). This SECURITY DEFINER function is the narrow, auditable
-- exception — it writes ONLY the caller's own row (auth.uid()) and ONLY these
-- fields.
--
-- Guard rails:
--   • Idempotent consent: terms_accepted_at is set once (coalesce), never
--     overwritten on a repeat call.
--   • Phone is settable ONLY while it is still the 'email:%' placeholder. Once a
--     real number is in place it is immutable here — so this RPC can never be
--     used to mutate a WhatsApp-OTP-verified phone. Honours Hard Constraint #5
--     (phone = identity key) and the accept-don't-reject ethos (a colliding
--     number is reported, not thrown — the member proceeds phone-less).
--   • Returns 'ok' | 'phone_taken' so the UI can soft-warn without blocking.
--
-- REVERT AT WABA CUTOVER: optional. Harmless to keep; only the /welcome screen
-- and Google provider drive it. Drop with `drop function ... ` if removing OAuth.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.complete_oauth_onboarding(
  p_phone           text,
  p_opt_in_whatsapp boolean,
  p_opt_in_email    boolean,
  p_terms_version   text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_phone  text := nullif(btrim(p_phone), '');
  v_status text := 'ok';
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  -- Always record consent (set-once for the timestamp/version) + opt-ins.
  update public.members
     set terms_accepted_at = coalesce(terms_accepted_at, now()),
         terms_version     = coalesce(nullif(terms_version, ''), nullif(p_terms_version, '')),
         opt_in_whatsapp   = coalesce(p_opt_in_whatsapp, false),
         opt_in_email      = coalesce(p_opt_in_email, false)
   where id = v_uid;

  -- Set the real phone only if one was provided AND the current value is still
  -- the OAuth placeholder. A unique collision with another member is caught and
  -- reported as 'phone_taken' (the member stays phone-less rather than blocked).
  if v_phone is not null then
    begin
      update public.members
         set phone = v_phone
       where id = v_uid
         and phone like 'email:%';
    exception when unique_violation then
      v_status := 'phone_taken';
    end;
  end if;

  return v_status;
end;
$$;

revoke all on function public.complete_oauth_onboarding(text, boolean, boolean, text) from public;
grant execute on function public.complete_oauth_onboarding(text, boolean, boolean, text) to authenticated;
