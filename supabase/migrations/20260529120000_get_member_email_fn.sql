-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0031 — Relationship-gated member email lookup (Phase 1, test-phase
-- notifications)
--
-- For cross-member notification emails (a lead on your listing, a connection
-- request) the app needs the *recipient's* email, which RLS keeps SELECT-own.
-- This SECURITY DEFINER function returns it ONLY when a real relationship
-- already links the caller and the target — an inquiry on either's listing, or
-- a connection request between them — so it can't be used to harvest emails.
-- The email is consumed server-side (to send), never returned to a client.
--
-- TEMPORARY (test phase): once WhatsApp OTP/WABA is live, lead/connection
-- notifications move to WhatsApp Utility templates + in-app; this fn can be
-- dropped (or kept for in-app/email fallback). Excludes members pending deletion.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.get_member_email(p_member_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select m.email
  from public.members m
  where m.id = p_member_id
    and m.email is not null
    and m.deletion_requested_at is null
    and (
      exists (
        select 1
        from public.inquiries i
        join public.listings l on l.id = i.listing_id
        where (i.seeker_id = (select auth.uid()) and l.member_id = p_member_id)
           or (l.member_id = (select auth.uid()) and i.seeker_id = p_member_id)
      )
      or exists (
        select 1
        from public.connection_requests cr
        where (cr.requester_id = (select auth.uid()) and cr.recipient_id = p_member_id)
           or (cr.recipient_id = (select auth.uid()) and cr.requester_id = p_member_id)
      )
    );
$$;

revoke all on function public.get_member_email(uuid) from public, anon;
grant execute on function public.get_member_email(uuid) to authenticated;
