-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0018 — ⚠ TEMPORARY TEST AFFORDANCE — REMOVE BEFORE LAUNCH ⚠
--
-- Lets the founder sign in via email magic-link (no Meta WhatsApp WABA needed
-- yet) so the authenticated pages can be tested. The auth bootstrap trigger
-- handle_new_auth_user() only created a members row for PHONE signups; this
-- adds an email branch.
--
-- members.phone is NOT NULL UNIQUE, so an email signup gets a placeholder
-- phone ('test:' || auth user id) — a clearly-fake, unique value. Such test
-- accounts therefore have no usable WhatsApp number (the reveal deep-link will
-- be a non-working wa.me; set members.phone manually via dashboard if you need
-- to test the reveal end-to-end).
--
-- TO REVERT: re-apply migration 0014's handle_new_auth_user() definition
-- (the phone-only version) and delete any test members/auth users.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meta            jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_opt_in_whatsapp boolean;
  v_terms_at        timestamptz;
  v_terms_version   text;
begin
  -- Production path: phone (WhatsApp OTP) signup — unchanged from 0014.
  if new.phone is not null then
    begin
      v_opt_in_whatsapp := (v_meta ->> 'opt_in_whatsapp')::boolean;
    exception when others then v_opt_in_whatsapp := null;
    end;

    begin
      v_terms_at := (v_meta ->> 'terms_accepted_at')::timestamptz;
    exception when others then v_terms_at := null;
    end;

    v_terms_version := nullif(v_meta ->> 'terms_version', '');

    insert into public.members (
      id, phone, opt_in_whatsapp, terms_accepted_at, terms_version
    )
    values (
      new.id, new.phone, coalesce(v_opt_in_whatsapp, false), v_terms_at, v_terms_version
    )
    on conflict (id) do nothing;

  -- ⚠ TEMPORARY: email magic-link test signup. Placeholder phone keeps the
  -- NOT NULL UNIQUE constraint satisfied. Remove with this migration.
  elsif new.email is not null then
    insert into public.members (id, phone, email)
    values (new.id, 'test:' || new.id::text, new.email)
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;
