-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0005 — Core RLS (Phase 1 §1, slice 2)
--
-- RLS policies for members / member_professions / member_capabilities /
-- verifications. Defaults are restrictive: members can only SELECT their own
-- row (admins see all); admin-only fields are blocked at the column-grant
-- level for additional safety.
--
-- DEFERRED to §3 Directory slice: a cross-member public-fields view
-- (members_public). Directory + intelligence will read that view; raw
-- members table stays self-only. Until then, no UI hits the members table
-- across rows — explicit limit, not an oversight.
-- ─────────────────────────────────────────────────────────────────────────────


-- is_admin() helper ──────────────────────────────────────────────────────────
-- SECURITY DEFINER bypasses RLS for the inner read, breaking the otherwise-
-- infinite recursion (members RLS uses is_admin, is_admin reads members).
-- The function is hardcoded to check the current caller's own role — no
-- arbitrary lookup, so the elevated privilege is tightly scoped.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.members
    where id = auth.uid() and role = 'admin'
  );
$$;


-- members ────────────────────────────────────────────────────────────────────
alter table public.members enable row level security;

create policy "Members can read own row (admin sees all)"
  on public.members
  for select
  using (auth.uid() = id or public.is_admin());

create policy "Members can update own row"
  on public.members
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No INSERT policy → INSERTs from anon/authenticated are denied. The auth
-- bootstrap trigger (handle_new_auth_user) uses SECURITY DEFINER to bypass
-- and create the initial members row. Admin writes go via service_role.

-- No DELETE policy → DELETEs are denied. Cascade from auth.users(on delete)
-- handles real deletion when an account is removed by admin.

-- Column-level UPDATE grants: members can update profile fields but NOT
-- role / trust_level / id_verification / recognised_surname / phone.
-- Those are admin-managed (service_role bypasses these grants).
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
) on public.members to authenticated;


-- member_professions ─────────────────────────────────────────────────────────
alter table public.member_professions enable row level security;

create policy "Authenticated can read member_professions"
  on public.member_professions
  for select
  using (auth.uid() is not null);
-- Cross-member reads OK — powers directory + intelligence drill-down + FTS
-- on expertise_text. Not joined to sensitive members columns at the RLS
-- level; app/view layer controls what's exposed.

create policy "Members manage own member_professions"
  on public.member_professions
  for all
  using (auth.uid() = member_id)
  with check (auth.uid() = member_id);
-- `for all` covers INSERT + UPDATE + DELETE. `using` gates UPDATE/DELETE;
-- `with check` gates INSERT/UPDATE — together they confine writes to own.

-- Column-level guard: `is_verified` is admin-set (it marks the credential
-- as admin-confirmed); members shouldn't flip it.
revoke update on public.member_professions from authenticated;
grant update (
  profession_id,
  specialty_id,
  years_experience,
  expertise_text,
  status
) on public.member_professions to authenticated;


-- member_capabilities ────────────────────────────────────────────────────────
alter table public.member_capabilities enable row level security;

create policy "Authenticated can read member_capabilities"
  on public.member_capabilities
  for select
  using (auth.uid() is not null);
-- Reads are open across members (Community Intelligence: "9 doctors open
-- to second opinions" — needs cross-member counts of capabilities).

create policy "Members manage own member_capabilities"
  on public.member_capabilities
  for all
  using (auth.uid() = member_id)
  with check (auth.uid() = member_id);


-- verifications ──────────────────────────────────────────────────────────────
alter table public.verifications enable row level security;

create policy "Members read own verifications (admin sees all)"
  on public.verifications
  for select
  using (auth.uid() = member_id or public.is_admin());

create policy "Members create own pending verification request"
  on public.verifications
  for insert
  with check (
    auth.uid() = member_id
    and method in ('referral','document')   -- vouch initiated by the voucher; see follow-up
    and status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
  );
-- Members start their OWN verification only as 'pending', cannot self-decide.
-- The vouch flow ("I vouch for X") must be initiated by the voucher, not the
-- subject — otherwise a member could claim anyone vouched for them. The
-- separate INSERT policy for vouch lands when the verification UI is built
-- in §2 Auth (it'll require `auth.uid() = voucher_member_id` and
-- `method = 'vouch'`).

create policy "Admins update verifications"
  on public.verifications
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- No member DELETE — keeping verification history is part of the audit trail.

-- Column-level INSERT grant: members can set method + voucher_member_id +
-- notes at request time; status / reviewed_by / reviewed_at are set on
-- review (and the WITH CHECK above forces them to be null/'pending' on
-- INSERT regardless). Admins use service_role to update review fields.
revoke insert on public.verifications from authenticated;
grant insert (
  member_id,
  method,
  voucher_member_id,
  notes
) on public.verifications to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- Summary of authenticated reach after this migration:
--   members              → SELECT own row only (admin = all); UPDATE own
--                          row's profile columns only
--   member_professions   → SELECT all rows; INSERT/UPDATE/DELETE own only;
--                          is_verified column grant-protected
--   member_capabilities  → SELECT all rows; INSERT/UPDATE/DELETE own only
--   verifications        → SELECT own + admin sees all; INSERT own pending
--                          only (status/reviewer columns grant-protected);
--                          UPDATE admin-only
-- ─────────────────────────────────────────────────────────────────────────────
