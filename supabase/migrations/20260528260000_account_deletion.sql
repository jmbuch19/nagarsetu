-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0022 — Self-serve account deletion w/ grace period (Phase 1 §2/§8)
--
-- Founder choice: a member can request deletion themselves; the account is
-- deactivated immediately and permanently erased after a grace period (~30
-- days), cancellable by signing in before then. This migration adds the
-- request marker + deactivation propagation. The actual erase job (a
-- service-role cron that deletes auth.users < now-30d → cascade) is a separate
-- follow-up (needs SUPABASE_SERVICE_ROLE_KEY + CRON_SECRET + a scheduler).
--
--   • members.deletion_requested_at — null = active; set = in grace period
--     (deactivated, scheduled for erase). Member-settable (request/cancel) via
--     the column grant; the server actions set it to now() / null.
--   • A member with deletion_requested_at set is removed from the directory
--     (members_directory + chained views) and is unreachable (get_revealed_
--     contact returns nothing) — they're gone from others' view at once.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.members
  add column deletion_requested_at timestamptz;

create index members_deletion_requested_idx
  on public.members (deletion_requested_at)
  where deletion_requested_at is not null;  -- the purge cron scans this

-- Extend the member-editable grant so request/cancel (own row, RLS-scoped) works.
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
  willing_to_donate,
  deletion_requested_at
) on public.members to authenticated;

-- Re-state members_directory to EXCLUDE members pending deletion (propagates to
-- the chained profession/capability directories). Definer view; same column
-- whitelist + donor gating as migration 0021, now with the deletion filter.
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
  case
    when m.willing_to_donate is true
     and m.blood_group is not null
     and m.date_of_birth is not null
     and age(m.date_of_birth) >= interval '18 years'
     and age(m.date_of_birth) <  interval '66 years'
    then m.blood_group
    else null
  end as donor_blood_group
from public.members m
where m.deletion_requested_at is null;

grant select on public.members_directory to authenticated;
revoke select on public.members_directory from anon;

-- Don't reveal contact for a member who's pending deletion.
create or replace function public.get_revealed_contact(target uuid)
returns table (phone text, full_name text)
language sql
stable
security definer
set search_path = public
as $$
  select m.phone, m.full_name
  from public.members m
  where m.id = target
    and m.deletion_requested_at is null
    and target <> (select auth.uid())
    and (
      m.openly_contactable = true
      or exists (
        select 1
        from public.connection_requests cr
        where cr.status = 'approved'
          and (
            (cr.requester_id = (select auth.uid()) and cr.recipient_id = target)
            or (cr.recipient_id = (select auth.uid()) and cr.requester_id = target)
          )
      )
    );
$$;
