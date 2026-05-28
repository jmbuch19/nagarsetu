-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0021 — Blood group + donor matching (Phase 1 §3)
--
-- Founder direction (2026-05-28): capture blood group + willingness to donate
-- on the profile (both OPTIONAL), and let the directory surface eligible
-- donors. Blood group is health-adjacent / sensitive (DPDP) — so the privacy
-- design is:
--   • A member's blood_group + willing_to_donate live on their own row
--     (members RLS = SELECT-own), shown only on their own profile.
--   • The directory view exposes `donor_blood_group` ONLY when the member
--     is willing_to_donate AND in the donation age window AND has a group set.
--     A non-willing / out-of-range member's blood group NEVER reaches other
--     members. Opt-in, purpose-limited to donor matching; contact still
--     consent-gated by the connection flow.
--
-- Donation age window: 18–65 (India NBTC). Encoded in the view; adjust here if
-- guidance changes.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.members
  add column blood_group text
    check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  add column willing_to_donate boolean;

-- Extend the member-editable column grant (migrations 0005/0014/0016) with the
-- two new optional fields.
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
  opt_in_whatsapp,
  openly_contactable,
  blood_group,
  willing_to_donate
) on public.members to authenticated;

-- Re-state members_directory with donor_blood_group appended. Definer view
-- (security_invoker = false) — same privacy boundary as before; the new column
-- is gated on willingness + age so it's only populated for actual donors.
create or replace view public.members_directory
with (security_invoker = false)
as
select
  m.id,
  m.full_name,
  m.surname,
  m.city_id,
  m.pincode,
  m.sub_community_id,
  m.gender,
  case
    when m.date_of_birth is null                              then null
    when age(m.date_of_birth) < interval '18 years'           then '<18'
    when age(m.date_of_birth) < interval '26 years'           then '18-25'
    when age(m.date_of_birth) < interval '36 years'           then '26-35'
    when age(m.date_of_birth) < interval '51 years'           then '36-50'
    when age(m.date_of_birth) < interval '66 years'           then '51-65'
    else                                                           '65+'
  end as age_band,
  m.photo_url,
  m.bio,
  m.role,
  m.trust_level,
  m.id_verification,
  m.recognised_surname,
  m.created_at,
  m.openly_contactable,
  -- Donor surfacing: blood group exposed to other members ONLY when the member
  -- opted in (willing_to_donate) AND is in the 18–65 window AND set a group.
  case
    when m.willing_to_donate is true
     and m.blood_group is not null
     and m.date_of_birth is not null
     and age(m.date_of_birth) >= interval '18 years'
     and age(m.date_of_birth) <  interval '66 years'
    then m.blood_group
    else null
  end as donor_blood_group
from public.members m;

grant select on public.members_directory to authenticated;
revoke select on public.members_directory from anon;
