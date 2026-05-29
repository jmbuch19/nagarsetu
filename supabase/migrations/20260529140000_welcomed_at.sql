-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0032 — members.welcomed_at (send-once welcome email flag)
--
-- Set when the welcome email is sent (in /auth/callback on first sign-in), so
-- it only ever goes out once. Member-grantable (a member setting it early just
-- skips their welcome — harmless). Re-grants the full member-editable column
-- whitelist (carried from 0022) plus welcomed_at.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.members
  add column welcomed_at timestamptz;

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
  deletion_requested_at,
  welcomed_at
) on public.members to authenticated;
