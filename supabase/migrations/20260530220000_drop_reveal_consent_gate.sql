-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0042 — Drop the openly_contactable / approved-connection gate
-- inside get_revealed_contact().
--
-- The prior policy: openly_contactable=false on the recipient → no contact
-- reveal until they approve an in-app connection request. In practice this
-- made urgent reach impossible — a fellow Nagar in a "need them fast" moment
-- (medical question, blood, mentorship) stayed locked out on WhatsApp + email
-- behind an in-app approval the recipient might not see for hours/days.
--
-- New policy: the directory listing itself IS the reach consent. Once a member
-- joins and accepts terms, being reachable on WhatsApp + email is the whole
-- point. Phone + email are still NEVER displayed publicly — they're embedded
-- in wa.me / mailto: links at the moment of click — but they no longer require
-- a second gate. openly_contactable stays in the DB as a soft preference (UI
-- copy updated to reflect this; future enhancement may surface it as a
-- "prefers in-app request first" badge on the card).
--
-- Self-exclusion (target <> auth.uid()) and soft-delete check (deletion_
-- requested_at is null) remain. Placeholder phone (`email:%`) is still nulled
-- so the WhatsApp link path doesn't build on junk.
-- ─────────────────────────────────────────────────────────────────────────────

drop function if exists public.get_revealed_contact(uuid);

create or replace function public.get_revealed_contact(target uuid)
returns table (phone text, email text, full_name text)
language sql
stable
security definer
set search_path = public
as $$
  select
    case when m.phone like 'email:%' then null else m.phone end as phone,
    m.email,
    m.full_name
  from public.members m
  where m.id = target
    and m.deletion_requested_at is null
    and target <> (select auth.uid());
$$;

revoke all on function public.get_revealed_contact(uuid) from public, anon;
grant execute on function public.get_revealed_contact(uuid) to authenticated;
