-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0014 — Consent capture at signup (Phase 1 §2, slice 6 first cut)
--
-- AGENDA §2 requires the sign-up gate to collect: mobile + OTP + consent
-- (Terms acceptance + WhatsApp opt-in). `members.opt_in_whatsapp` already
-- exists (slice 2). This migration adds:
--   • `terms_accepted_at` — when the member accepted the Terms
--   • `terms_version`     — which Terms revision they accepted (e.g. 'v1.0')
--
-- Both columns are auditable. Once set, they are immutable from a member's
-- perspective — column-level UPDATE grants exclude them. Re-acceptance after
-- a Terms version bump goes through a separate admin/system path (deferred).
--
-- The auth bootstrap trigger `handle_new_auth_user()` is rewritten to ALSO
-- read `raw_user_meta_data` set by the client at signInWithOtp() time, so
-- consent persists through the OTP round-trip without an extra client write:
--
--   supabase.auth.signInWithOtp({
--     phone,
--     options: { data: {
--       opt_in_whatsapp: true,
--       terms_accepted_at: new Date().toISOString(),
--       terms_version: 'v1.0',
--     } }
--   })
--
-- Field whitelist is enforced inside the trigger — clients cannot use the
-- metadata channel to set role / trust_level / id_verification / etc.
-- ─────────────────────────────────────────────────────────────────────────────


-- 1. New consent columns ─────────────────────────────────────────────────────
alter table public.members
  add column terms_accepted_at timestamptz,
  add column terms_version     text;

-- Lookup index for admin "who accepted terms version X" queries; partial so
-- the index is empty until terms_version is actually set.
create index members_terms_version_idx
  on public.members (terms_version)
  where terms_version is not null;


-- 2. Replace handle_new_auth_user() ──────────────────────────────────────────
-- Same semantics as slice 2 (insert minimal members row, idempotent), now
-- ALSO reads the consent fields from raw_user_meta_data with strict
-- field-whitelisting. Anything outside the allow-list is silently ignored —
-- members must not be able to seed admin/trust fields via the metadata
-- channel.
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
  if new.phone is null then
    return new;
  end if;

  -- Strict-typed extraction from metadata. Unknown / mis-typed values fall
  -- back to defaults rather than raising — auth must not fail because the
  -- client sent a malformed consent payload.
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
    id,
    phone,
    opt_in_whatsapp,
    terms_accepted_at,
    terms_version
  )
  values (
    new.id,
    new.phone,
    coalesce(v_opt_in_whatsapp, false),
    v_terms_at,
    v_terms_version
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
-- Trigger from slice 2 is unchanged; it still calls this function.


-- 3. Tighten the UPDATE column grant on members ──────────────────────────────
-- Slice 2 granted UPDATE on a profile-fields whitelist. The new consent
-- columns are NOT in that list (so they're already implicitly blocked), but
-- this re-grant is explicit — anyone reviewing slice 2's grant statement
-- shouldn't have to mentally cross-reference this slice to confirm consent
-- columns aren't editable by members.
--
-- The REVOKE + GRANT pair re-establishes the same whitelist as slice 2, with
-- terms_accepted_at + terms_version explicitly noted in the comment as
-- INTENTIONALLY excluded.
revoke update on public.members from authenticated;
grant update (
  email,
  full_name,
  surname,
  city_id,
  pincode,
  sub_community_id,
  gender,
  date_of_birth,
  photo_url,
  bio,
  opt_in_email,
  opt_in_whatsapp
  -- terms_accepted_at + terms_version intentionally EXCLUDED — set once
  -- by the auth trigger at signup, never user-editable. Re-acceptance
  -- after a Terms version bump goes through a separate admin path (TBD).
  -- role / trust_level / id_verification / recognised_surname / phone
  -- also remain admin-managed (same as slice 2).
) on public.members to authenticated;
