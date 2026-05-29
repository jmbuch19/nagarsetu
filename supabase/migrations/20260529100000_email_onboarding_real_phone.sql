-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0030 — ⚠ TEMPORARY (test-phase) — email onboarding captures the
-- REAL phone + consent (Phase 1, bridge to WhatsApp OTP)
--
-- Supersedes the placeholder-phone email branch from migration 0018. While the
-- Meta WhatsApp OTP path is pending, members are invited to onboard by email;
-- they enter their REAL WhatsApp number + accept Terms + WhatsApp opt-in on the
-- /join form, which passes them through signInWithOtp({ options: { data } }) →
-- raw_user_meta_data → here. This keeps phone as the universal unique key (so
-- contact-reveal / connect / donor / notifications work) even for
-- email-onboarded testers.
--
-- Field whitelist enforced (same posture as 0014): only opt_in_whatsapp,
-- terms_accepted_at, terms_version, and phone are read from metadata — never
-- role / trust_level / id_verification / etc.
--
-- Robust fallback: if the real phone collides with an existing member (UNIQUE)
-- or any other insert error occurs, fall back to a minimal placeholder-phone
-- row so auth never fails. The member can be helped/merged manually.
--
-- REVERT AT WABA CUTOVER: restore migration 0018's placeholder-only email
-- branch (or drop the email branch entirely) and remove /join.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meta          jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_opt_in        boolean;
  v_terms_at      timestamptz;
  v_terms_version text;
  v_phone         text;
begin
  -- Consent (shared by both signup paths). Strict-typed; defaults on garbage.
  begin
    v_opt_in := (v_meta ->> 'opt_in_whatsapp')::boolean;
  exception when others then v_opt_in := null;
  end;
  begin
    v_terms_at := (v_meta ->> 'terms_accepted_at')::timestamptz;
  exception when others then v_terms_at := null;
  end;
  v_terms_version := nullif(v_meta ->> 'terms_version', '');

  if new.phone is not null then
    -- Production path: WhatsApp OTP signup (unchanged from 0014).
    insert into public.members (
      id, phone, opt_in_whatsapp, terms_accepted_at, terms_version
    )
    values (
      new.id, new.phone, coalesce(v_opt_in, false), v_terms_at, v_terms_version
    )
    on conflict (id) do nothing;

  elsif new.email is not null then
    -- ⚠ TEMPORARY email onboarding: store the REAL phone + consent.
    v_phone := nullif(btrim(v_meta ->> 'phone'), '');
    begin
      insert into public.members (
        id, phone, email, opt_in_whatsapp, terms_accepted_at, terms_version
      )
      values (
        new.id,
        coalesce(v_phone, 'email:' || new.id::text),
        new.email,
        coalesce(v_opt_in, false),
        v_terms_at,
        v_terms_version
      )
      on conflict (id) do nothing;
    exception when others then
      -- phone/email collision or other error → minimal row so auth doesn't fail
      insert into public.members (id, phone)
      values (new.id, 'email:' || new.id::text)
      on conflict (id) do nothing;
    end;
  end if;

  return new;
end;
$$;
