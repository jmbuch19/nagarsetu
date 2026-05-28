-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0029 — Reveal a request's contact (Phase 1 §4 — seeker side)
--
-- A member browsing open Requests can tap "I can help" to reach the seeker.
-- The seeker's members.phone isn't cross-member readable (RLS SELECT-own), so
-- this SECURITY DEFINER function returns it for an OPEN request only — the
-- seeker posted publicly seeking responses, so revealing their contact to an
-- authenticated member is by design (connector model). Returns null otherwise.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.get_request_contact(p_request_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select m.phone
  from public.requests r
  join public.members m on m.id = r.member_id
  where r.id = p_request_id
    and r.status = 'open';
$$;

revoke all on function public.get_request_contact(uuid) from public, anon;
grant execute on function public.get_request_contact(uuid) to authenticated;
