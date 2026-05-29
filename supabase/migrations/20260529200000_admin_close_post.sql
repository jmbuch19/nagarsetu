-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0035 — admin_close_post(): let an admin close ANOTHER member's
-- stale listing or request (the cross-owner moderation case behind the
-- "Happening now" rail + feed).
--
-- Members already close their OWN posts (set_listing_status / the requests
-- status action, both owner-gated). Admins could not touch other members'
-- posts — `status` is column-grant-protected and RLS is owner-scoped. So this
-- SECURITY DEFINER function (gated on is_admin()) is the clean path, mirroring
-- set_listing_status / admin_review_verification.
--
-- Closing maps to each post's terminal "no longer live" state:
--   listing → 'expired'   request → 'closed'
-- which removes it from the active/open queries (feed, rail) everywhere.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.admin_close_post(p_kind text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (select public.is_admin()) then
    raise exception 'not_admin';
  end if;

  if p_kind = 'listing' then
    update public.listings set status = 'expired'
      where id = p_id and status in ('active', 'paused', 'draft');
  elsif p_kind = 'request' then
    update public.requests set status = 'closed'
      where id = p_id and status = 'open';
  else
    raise exception 'bad_kind';
  end if;
end;
$$;

revoke all on function public.admin_close_post(text, uuid) from public, anon;
grant execute on function public.admin_close_post(text, uuid) to authenticated;
