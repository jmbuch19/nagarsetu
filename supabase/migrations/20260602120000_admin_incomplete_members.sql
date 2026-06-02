-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0045 — admin_list_incomplete_members() + admin_get_member_email():
-- the "nudge half-started profiles" admin surface.
--
-- During the email pilot, members sign up (phone + email + consent bootstrap)
-- but many never come back to fill the required profile fields. RLS on members
-- is SELECT-own, so an admin cannot see other members' rows or addresses. These
-- two SECURITY DEFINER functions — both gated on is_admin(), mirroring
-- admin_close_post / admin_review_verification — let the admin:
--   1. list members whose required profile is still incomplete, with which
--      fields are missing, so they can be nudged, and
--   2. resolve a member's email server-side so the app can re-send them a
--      sign-in link (the email is consumed by the send action, never returned
--      to a browser by the send path).
--
-- "Incomplete" mirrors the /profile REQUIRED_FIELDS exactly: full_name,
-- surname, city_id, pincode, gender, date_of_birth. Members pending deletion
-- are excluded.
--
-- TEMPORARY framing (test phase): the re-send uses the email sign-in link. At
-- WABA cutover the nudge moves to a WhatsApp Utility template; these functions
-- stay useful as the "who hasn't finished onboarding" query.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.admin_list_incomplete_members()
returns table (
  id          uuid,
  email       text,
  full_name   text,
  created_at  timestamptz,
  welcomed_at timestamptz,
  missing     text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.id,
    m.email,
    m.full_name,
    m.created_at,
    m.welcomed_at,
    array_to_string(array_remove(array[
      case when m.full_name     is null or m.full_name = '' then 'name'    end,
      case when m.surname       is null or m.surname  = '' then 'surname' end,
      case when m.city_id       is null                    then 'city'    end,
      case when m.pincode       is null or m.pincode  = '' then 'PIN'     end,
      case when m.gender        is null                    then 'gender'  end,
      case when m.date_of_birth is null                    then 'DOB'     end
    ], null), ', ') as missing
  from public.members m
  where (select public.is_admin())
    and m.deletion_requested_at is null
    and (
      m.full_name is null or m.full_name = '' or
      m.surname is null or m.surname = '' or
      m.city_id is null or
      m.pincode is null or m.pincode = '' or
      m.gender is null or
      m.date_of_birth is null
    )
  order by m.created_at desc;
$$;

revoke all on function public.admin_list_incomplete_members() from public, anon;
grant execute on function public.admin_list_incomplete_members() to authenticated;

-- Resolve a single member's email by id — admin only. Used by the relogin-link
-- send action so it never has to trust a client-supplied address. Returns NULL
-- (no row) for non-admins, unknown ids, addressless members, or members
-- pending deletion.
create or replace function public.admin_get_member_email(p_member_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select m.email
  from public.members m
  where m.id = p_member_id
    and (select public.is_admin())
    and m.email is not null
    and m.deletion_requested_at is null;
$$;

revoke all on function public.admin_get_member_email(uuid) from public, anon;
grant execute on function public.admin_get_member_email(uuid) to authenticated;
