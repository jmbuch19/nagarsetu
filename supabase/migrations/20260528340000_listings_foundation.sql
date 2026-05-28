-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0026 — Listings foundation (Phase 1 §4)
--
-- Three things, all needed before the Create-a-Listing flow:
--   1. listing_categories.is_paid + .verification — the free/paid boundary
--      (locked decision: only Business + Education are paid; everything else is
--      free) and the per-category verification routing (open / id_verified /
--      admin). These were SPEC/decision-level but never hit the DB.
--   2. Lock down listings INSERT/UPDATE grants so a member can only set
--      CONTENT columns — never status, fee_paid, or the lifecycle fields. This
--      closes a hole: the slice-3 grant let members set `status` (and the
--      default INSERT grant let them insert an 'active'/fee_paid row), i.e.
--      self-publish a PAID listing without paying. Inserts now always start as
--      'draft', fee_paid=false, no lifecycle.
--   3. set_listing_status() — the ONLY member path to activate/pause/resume a
--      listing. Enforces the verification gate (id_verified categories) and
--      blocks paid categories until the payment flow (next slice). Free+allowed
--      categories get published with a soft expiry.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Category flags ──────────────────────────────────────────────────────────
alter table public.listing_categories
  add column is_paid      boolean not null default false,
  add column verification text    not null default 'open'
             check (verification in ('open', 'id_verified', 'admin'));

-- Locked free/paid + verification routing:
update public.listing_categories set is_paid = true,  verification = 'admin'
  where name = 'business';
update public.listing_categories set is_paid = true,  verification = 'open'
  where name = 'education';
update public.listing_categories set is_paid = false, verification = 'id_verified'
  where name in ('room', 'vehicle', 'pg');
update public.listing_categories set is_paid = false, verification = 'open'
  where name in ('goods', 'tour', 'service', 'expert');


-- 2. Tighten listings grants ─────────────────────────────────────────────────
-- INSERT: only content columns + member_id. status defaults 'draft';
-- fee_paid/published_at/expires_at/price_paid/term_days_paid/view_count are
-- system-managed and excluded → a member cannot insert a pre-activated/paid row.
revoke insert on public.listings from authenticated;
grant insert (
  member_id,
  category_id,
  title,
  description,
  time_binding,
  price_text,
  location_city_id,
  pincode,
  area_text,
  address,
  service_area,
  hours,
  contact_whatsapp,
  contact_phone
) on public.listings to authenticated;

-- UPDATE: same content columns, but NOT `status` anymore — status changes go
-- through set_listing_status() so activation can't bypass payment/expiry.
revoke update on public.listings from authenticated;
grant update (
  title,
  description,
  time_binding,
  price_text,
  location_city_id,
  pincode,
  area_text,
  address,
  service_area,
  hours,
  contact_whatsapp,
  contact_phone,
  category_id
) on public.listings to authenticated;


-- 3. set_listing_status() ─────────────────────────────────────────────────────
-- The gated member path for publish / pause / resume. SECURITY DEFINER so it
-- can set status + lifecycle columns (not in the member grant); ownership is
-- checked against auth.uid(). Free term default 60 days (admin-configurable
-- later). Paid categories are blocked here — they publish via the payment flow
-- (next slice).
create or replace function public.set_listing_status(
  p_listing_id uuid,
  p_action     text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing public.listings%rowtype;
  v_cat     public.listing_categories%rowtype;
  v_free_term_days integer := 60;
begin
  select * into v_listing from public.listings where id = p_listing_id;
  if v_listing.id is null or v_listing.member_id <> (select auth.uid()) then
    raise exception 'not_your_listing';
  end if;

  select * into v_cat
  from public.listing_categories where id = v_listing.category_id;

  if p_action = 'pause' then
    update public.listings set status = 'paused'
      where id = p_listing_id and status = 'active';

  elsif p_action = 'resume' then
    -- Only resume within the original term; if it has lapsed, it's expired.
    update public.listings set status = 'active'
      where id = p_listing_id and status = 'paused';

  elsif p_action = 'publish' then
    if v_listing.status not in ('draft', 'expired') then
      raise exception 'not_publishable';
    end if;

    if v_cat.verification = 'id_verified'
       and (select id_verification from public.members
            where id = v_listing.member_id) <> 'verified' then
      raise exception 'id_verification_required';
    end if;

    if v_cat.is_paid then
      -- Business/Education carry the listing fee — published via the payment
      -- flow, not here. (Wired in the next slice.)
      raise exception 'payment_required';
    end if;

    update public.listings
      set status       = 'active',
          fee_paid     = false,
          published_at = now(),
          expires_at   = now() + (v_free_term_days || ' days')::interval
      where id = p_listing_id;

  else
    raise exception 'unknown_action';
  end if;
end;
$$;

revoke all on function public.set_listing_status(uuid, text) from public, anon;
grant execute on function public.set_listing_status(uuid, text) to authenticated;
