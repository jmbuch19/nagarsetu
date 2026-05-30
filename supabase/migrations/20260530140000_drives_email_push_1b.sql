-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0038 — Community Drives feature 1b (email push) — the wiring.
--
-- 1a (in-app drives banner) is live. 1b lets an admin "also email this drive"
-- to opted-in members via Resend. This migration ships the wiring around the
-- new admin path:
--   • members.unsubscribe_token — unguessable per-member uuid; each drive
--     email's footer carries an /unsubscribe?token=… link that flips
--     opt_in_email=false via a SECURITY DEFINER function. The token IS the
--     auth (DPDP: withdrawing must be as easy as giving).
--   • drives.emailed_at + drives.emailed_count — one-shot throttle (refuse to
--     re-email the same drive) + audit of who got reached.
--   • handle_new_auth_user — extend the metadata whitelist to also pick up
--     opt_in_email, so the /join "Send me community updates by email"
--     checkbox actually persists. (Field whitelist still strict — no
--     privileged fields can be injected.)
--   • unsubscribe_email_by_token(p_token uuid) — public-callable, gated on
--     the unguessable token. Safe to call from anon.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Per-member unsubscribe token ─────────────────────────────────────────────
-- Idempotent so re-running this migration after a partial failure is safe.
alter table public.members
  add column if not exists unsubscribe_token uuid not null default gen_random_uuid();

-- gen_random_uuid() ran per-row on add, so each existing member already has a
-- unique token. UNIQUE constraint catches the (vanishingly improbable) collision.
do $$ begin
  alter table public.members
    add constraint members_unsubscribe_token_key unique (unsubscribe_token);
exception when duplicate_object then null;
end $$;

-- Members must not be able to read or rotate their own token (it's only used in
-- email footers; the app never displays it). Strictly: not in the UPDATE
-- column grant, and exclude from any SELECT projection the app uses. SELECT
-- isn't column-restricted on members (RLS owns rows), so we accept that a
-- member can read their OWN token via direct table SELECT — that's harmless,
-- since their own token can only unsubscribe themselves.


-- 2. Drives email stats (one-shot throttle + audit) ──────────────────────────
alter table public.drives
  add column if not exists emailed_at    timestamptz,
  add column if not exists emailed_count integer not null default 0;


-- 3. Bootstrap trigger: extend metadata whitelist with opt_in_email ──────────
-- Same posture as 0030 — strict-typed read, defaults on garbage, NEVER reads
-- privileged fields like role / trust_level / etc.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meta          jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_opt_wa        boolean;
  v_opt_email     boolean;
  v_terms_at      timestamptz;
  v_terms_version text;
  v_phone         text;
begin
  begin
    v_opt_wa := (v_meta ->> 'opt_in_whatsapp')::boolean;
  exception when others then v_opt_wa := null;
  end;
  begin
    v_opt_email := (v_meta ->> 'opt_in_email')::boolean;
  exception when others then v_opt_email := null;
  end;
  begin
    v_terms_at := (v_meta ->> 'terms_accepted_at')::timestamptz;
  exception when others then v_terms_at := null;
  end;
  v_terms_version := nullif(v_meta ->> 'terms_version', '');

  if new.phone is not null then
    insert into public.members (
      id, phone, opt_in_whatsapp, opt_in_email,
      terms_accepted_at, terms_version
    )
    values (
      new.id, new.phone, coalesce(v_opt_wa, false), coalesce(v_opt_email, false),
      v_terms_at, v_terms_version
    )
    on conflict (id) do nothing;

  elsif new.email is not null then
    v_phone := nullif(btrim(v_meta ->> 'phone'), '');
    begin
      insert into public.members (
        id, phone, email, opt_in_whatsapp, opt_in_email,
        terms_accepted_at, terms_version
      )
      values (
        new.id,
        coalesce(v_phone, 'email:' || new.id::text),
        new.email,
        coalesce(v_opt_wa, false),
        coalesce(v_opt_email, false),
        v_terms_at,
        v_terms_version
      )
      on conflict (id) do nothing;
    exception when others then
      insert into public.members (id, phone)
      values (new.id, 'email:' || new.id::text)
      on conflict (id) do nothing;
    end;
  end if;

  return new;
end;
$$;


-- 4. Unsubscribe function (public, token-gated) ──────────────────────────────
-- Returns true on a successful unsubscribe; false if the token doesn't match
-- or the member was already unsubscribed (indistinguishable to avoid
-- enumeration). The token is the auth.
create or replace function public.unsubscribe_email_by_token(p_token uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.members
  set opt_in_email = false
  where unsubscribe_token = p_token
    and opt_in_email = true;
  -- FOUND is a built-in PL/pgSQL boolean set by the UPDATE — true if any row
  -- matched. (GET DIAGNOSTICS = found is a syntax error in Postgres; the
  -- valid item there is ROW_COUNT.)
  return FOUND;
end;
$$;

revoke all on function public.unsubscribe_email_by_token(uuid) from public;
grant execute on function public.unsubscribe_email_by_token(uuid)
  to anon, authenticated;
