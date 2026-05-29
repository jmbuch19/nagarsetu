-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0036 — Matrimony as a profile opt-in + directory field.
--
-- Mirrors the blood-donor pattern (0021): a declared field + an opt-in that the
-- member controls, surfaced as a GATED column on members_directory() and
-- filterable in the directory. NOT a separate module. Reach stays the existing
-- consent-gated Connect flow.
--
-- Privacy: only the gated `open_to_matrimony` signal (+ what they seek) is ever
-- exposed — a member's raw `marital_status` is NEVER returned by the directory
-- function, so married / prefer-not members are not broadcast. Adult-gated 18+.
-- Visibility decision (founder, 2026-05-29): findable by ALL members (families
-- search on behalf); contact still consent-gated.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.members
  add column marital_status text
    check (marital_status in
      ('single', 'married', 'divorced', 'widowed', 'prefer_not_to_say')),
  add column open_to_matrimony boolean,
  add column matrimony_seeking text
    check (matrimony_seeking in ('bride', 'groom', 'companion'));

-- Member-editable (additive to the existing members UPDATE column grant; the
-- escalation-protected columns stay untouched).
grant update (marital_status, open_to_matrimony, matrimony_seeking)
  on public.members to authenticated;

-- Re-state members_directory() with the gated matrimony fields appended. The
-- returns-table signature changes, so this is drop+create. SQL functions with a
-- $$ string body are NOT dependency-tracked, so the chained
-- member_profession_directory() / member_capability_directory() keep resolving
-- members_directory() by name and need no change.
drop function if exists public.members_directory();

create function public.members_directory()
returns table (
  id                 uuid,
  full_name          text,
  surname            text,
  city_id            uuid,
  pincode            text,
  sub_community_id   uuid,
  gender             text,
  age_band           text,
  photo_url          text,
  bio                text,
  role               text,
  trust_level        smallint,
  id_verification    text,
  recognised_surname boolean,
  created_at         timestamptz,
  openly_contactable boolean,
  donor_blood_group  text,
  open_to_matrimony  boolean,
  matrimony_seeking  text,
  matrimony_age      int
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.id,
    m.full_name,
    m.surname,
    m.city_id,
    m.pincode,
    m.sub_community_id,
    m.gender,
    case
      when m.date_of_birth is null                    then null
      when age(m.date_of_birth) < interval '18 years' then '<18'
      when age(m.date_of_birth) < interval '26 years' then '18-25'
      when age(m.date_of_birth) < interval '36 years' then '26-35'
      when age(m.date_of_birth) < interval '51 years' then '36-50'
      when age(m.date_of_birth) < interval '66 years' then '51-65'
      else                                                 '65+'
    end as age_band,
    m.photo_url,
    m.bio,
    m.role,
    m.trust_level,
    m.id_verification,
    m.recognised_surname,
    m.created_at,
    m.openly_contactable,
    case
      when m.willing_to_donate is true
       and m.blood_group is not null
       and m.date_of_birth is not null
       and age(m.date_of_birth) >= interval '18 years'
       and age(m.date_of_birth) <  interval '66 years'
      then m.blood_group
      else null
    end as donor_blood_group,
    -- Matrimony: only signal an opt-in for an eligible (single/divorced/widowed)
    -- adult. Married / prefer-not / minors never surface as open.
    (m.open_to_matrimony is true
       and m.marital_status in ('single', 'divorced', 'widowed')
       and m.date_of_birth is not null
       and age(m.date_of_birth) >= interval '18 years') as open_to_matrimony,
    case
      when m.open_to_matrimony is true
       and m.marital_status in ('single', 'divorced', 'widowed')
       and m.date_of_birth is not null
       and age(m.date_of_birth) >= interval '18 years'
      then m.matrimony_seeking
      else null
    end as matrimony_seeking,
    -- Exact age, exposed ONLY for matrimony opt-ins (age matters for a match,
    -- and they consented by opting in). Everyone else keeps age_band only.
    case
      when m.open_to_matrimony is true
       and m.marital_status in ('single', 'divorced', 'widowed')
       and m.date_of_birth is not null
       and age(m.date_of_birth) >= interval '18 years'
      then extract(year from age(m.date_of_birth))::int
      else null
    end as matrimony_age
  from public.members m
  where m.deletion_requested_at is null;
$$;

comment on function public.members_directory() is
  'Directory-safe member fields (definer fn). Privacy boundary = column '
  'whitelist: excludes phone, email, raw DOB, raw marital_status, opt-in flags. '
  'Exposes gated donor + matrimony signals only. Auth-only.';

-- Drop+create reset the grants — re-apply (auth-only; not anon).
revoke all on function public.members_directory() from public, anon;
grant execute on function public.members_directory() to authenticated;
