-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0027 — Reveal a listing's contact (Phase 1 §4/§5)
--
-- When a member expresses interest in an active listing, the connect step
-- needs the provider's contact as a wa.me deep-link. The provider's
-- members.phone isn't readable cross-member (RLS SELECT-own), so this
-- SECURITY DEFINER function returns the contact for an ACTIVE listing only:
-- the per-listing contact if set, else the owner's phone. The provider
-- published the offer expecting to be contacted, so revealing it to an
-- authenticated member viewing the active listing is by design (connector
-- model). Returns null for non-active listings.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.get_listing_contact(p_listing_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif(btrim(l.contact_whatsapp), ''),
    nullif(btrim(l.contact_phone), ''),
    m.phone
  )
  from public.listings l
  join public.members m on m.id = l.member_id
  where l.id = p_listing_id
    and l.status = 'active';
$$;

revoke all on function public.get_listing_contact(uuid) from public, anon;
grant execute on function public.get_listing_contact(uuid) to authenticated;
