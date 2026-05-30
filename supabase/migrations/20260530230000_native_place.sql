-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0043 — Add `native_place` to members (the "your roots" field).
--
-- "You belong to which native place?" is the first question two Nagars ask
-- each other. Even after generations in Ahmedabad / Mumbai / abroad, the
-- native place (Junagadh, Porbandar, Vadnagar, ...) is a permanent identity
-- anchor in this samaj's conversation. Adding here as free text — accept any
-- script, any spelling, no controlled list (the question is about the family
-- root, not a postal address). Optional. Cap at 120 chars to allow combined
-- entries like "Junagadh, Gujarat" or "જૂનાગઢ (Junagadh)".
--
-- Re-state members_directory() to expose the field so it's filterable +
-- displayable. Dependents (member_profession_directory, etc.) bind by name
-- and don't need changes.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.members
  add column if not exists native_place text;

alter table public.members
  drop constraint if exists members_native_place_len;
alter table public.members
  add constraint members_native_place_len
    check (native_place is null or char_length(native_place) <= 120);

-- Column-level UPDATE grant so members can write their own native_place via
-- the profile action. Same pattern as bio / surname (migration 0005). RLS
-- still owns the row boundary.
grant update (native_place) on public.members to authenticated;


-- Re-state members_directory() to include native_place. Returns-table
-- signature changes → drop+create.
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
  native_place       text,
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
    m.native_place,
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
  'Exposes gated donor + matrimony signals + native_place. Auth-only.';

revoke all on function public.members_directory() from public, anon;
grant execute on function public.members_directory() to authenticated;
