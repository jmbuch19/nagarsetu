-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0039 — get_revealed_contact() also returns email.
--
-- Senders now have three connector options from the directory: WhatsApp,
-- email, or in-app Connect-request. WhatsApp + email are both "direct reach"
-- with the SAME consent gate (openly_contactable OR an approved connection);
-- Connect stays the request-and-approve path for everyone else.
--
-- Signature change → drop + create. Same gating logic as the 0022 version,
-- with one cleanup: placeholder phones (`email:<uuid>` for email-onboarded
-- members who don't have a real WhatsApp number on file yet) are nulled so
-- the wa.me link path doesn't get built from junk. The client just doesn't
-- render a WhatsApp button when phone comes back null.
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
    and target <> (select auth.uid())
    and (
      m.openly_contactable = true
      or exists (
        select 1
        from public.connection_requests cr
        where cr.status = 'approved'
          and (
            (cr.requester_id = (select auth.uid()) and cr.recipient_id = m.id)
            or
            (cr.recipient_id = (select auth.uid()) and cr.requester_id = m.id)
          )
      )
    );
$$;

revoke all on function public.get_revealed_contact(uuid) from public, anon;
grant execute on function public.get_revealed_contact(uuid) to authenticated;
