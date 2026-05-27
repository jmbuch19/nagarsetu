-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0007 — Trust economy RLS (Phase 1 §1, slice 3)
--
-- RLS policies for the 7 trust-economy tables. Patterns used:
--   - Status-aware SELECT on listings: active visible to all; draft/paused/
--     expired only to owner + admin
--   - Cross-table SELECT on availability + inquiries (depend on listing
--     visibility via EXISTS subquery)
--   - System-managed columns on listings (fee_paid, lifecycle, view_count)
--     blocked at the column-grant level
--   - reports SELECT scoped to reporter + admin (privacy); UPDATE admin-only
-- ─────────────────────────────────────────────────────────────────────────────


-- listings ───────────────────────────────────────────────────────────────────
alter table public.listings enable row level security;

create policy "Active listings public to authenticated; own + admin see all"
  on public.listings
  for select
  using (
    status = 'active'
    or member_id = auth.uid()
    or public.is_admin()
  );

create policy "Members create own listings"
  on public.listings
  for insert
  with check (auth.uid() = member_id);

create policy "Members update own listings"
  on public.listings
  for update
  using (auth.uid() = member_id)
  with check (auth.uid() = member_id);

create policy "Members delete own listings"
  on public.listings
  for delete
  using (auth.uid() = member_id);

-- Column-level UPDATE grants: members manage content + status, but system
-- fields (fee_paid, lifecycle, view_count) are admin/service-role only —
-- payment flow sets fee_paid + price_paid + term_days_paid + published_at +
-- expires_at; view_count is bumped by the read path.
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
  category_id,
  status
) on public.listings to authenticated;


-- availability ───────────────────────────────────────────────────────────────
alter table public.availability enable row level security;

create policy "Availability visible if parent listing is visible"
  on public.availability
  for select
  using (
    exists (
      select 1 from public.listings l
      where l.id = availability.listing_id
        and (l.status = 'active' or l.member_id = auth.uid() or public.is_admin())
    )
  );

create policy "Listing owner manages availability"
  on public.availability
  for all
  using (
    exists (
      select 1 from public.listings l
      where l.id = availability.listing_id and l.member_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.listings l
      where l.id = availability.listing_id and l.member_id = auth.uid()
    )
  );


-- inquiries ──────────────────────────────────────────────────────────────────
alter table public.inquiries enable row level security;

create policy "Seeker sees own + listing owner sees inbox + admin sees all"
  on public.inquiries
  for select
  using (
    auth.uid() = seeker_id
    or exists (
      select 1 from public.listings l
      where l.id = inquiries.listing_id and l.member_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "Seeker creates own inquiry against a visible listing"
  on public.inquiries
  for insert
  with check (
    auth.uid() = seeker_id
    and exists (
      select 1 from public.listings l
      where l.id = listing_id
        and (l.status = 'active' or l.member_id = auth.uid() or public.is_admin())
    )
  );

create policy "Seeker or listing owner updates inquiry status"
  on public.inquiries
  for update
  using (
    auth.uid() = seeker_id
    or exists (
      select 1 from public.listings l
      where l.id = inquiries.listing_id and l.member_id = auth.uid()
    )
  );
-- No DELETE policy → DELETE denied (preserve lead history). Admins use
-- service_role for any cleanup.

-- Column-level UPDATE grant: both seeker + owner can flip status; seeker
-- can also tweak the message/dates pre-connect; channel selection stays
-- editable. Other fields locked.
revoke update on public.inquiries from authenticated;
grant update (
  message,
  requested_start,
  requested_end,
  requested_qty,
  channel,
  status
) on public.inquiries to authenticated;


-- saved_alerts ───────────────────────────────────────────────────────────────
alter table public.saved_alerts enable row level security;

create policy "Members manage own saved_alerts"
  on public.saved_alerts
  for all
  using (auth.uid() = member_id)
  with check (auth.uid() = member_id);


-- reviews ────────────────────────────────────────────────────────────────────
alter table public.reviews enable row level security;

create policy "Authenticated can read reviews"
  on public.reviews
  for select
  using (auth.uid() is not null);
-- Reviews are public social proof — visible to all authenticated members
-- (anon doesn't see reviews; aggregate counts on landing page come from
-- a future SECURITY DEFINER view, not direct table access).

create policy "Members create own reviews"
  on public.reviews
  for insert
  with check (auth.uid() = author_id and author_id <> subject_id);

create policy "Members update own reviews"
  on public.reviews
  for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "Members delete own reviews"
  on public.reviews
  for delete
  using (auth.uid() = author_id);


-- reports ────────────────────────────────────────────────────────────────────
alter table public.reports enable row level security;

create policy "Reporter sees own + admin sees all"
  on public.reports
  for select
  using (auth.uid() = reporter_id or public.is_admin());
-- Subject of the report deliberately does NOT see reports against them.
-- DISPUTE.md flow surfaces admin actions to the subject separately.

create policy "Members file own reports"
  on public.reports
  for insert
  with check (
    auth.uid() = reporter_id
    and status = 'open'
    and reviewed_by is null
    and reviewed_at is null
    and action_taken is null
  );

create policy "Admins update reports (status / action / reviewer)"
  on public.reports
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- No DELETE → moderation audit preserved.

-- Column-level INSERT grant: reporter specifies the target + the why;
-- decision fields blocked. WITH CHECK above also enforces nulls.
revoke insert on public.reports from authenticated;
grant insert (
  reporter_id,
  subject_member_id,
  listing_id,
  reason,
  details
) on public.reports to authenticated;


-- requests ───────────────────────────────────────────────────────────────────
alter table public.requests enable row level security;

create policy "Authenticated can read requests"
  on public.requests
  for select
  using (auth.uid() is not null);
-- Demand-side posts are public to authenticated (providers browse to reach
-- out). Anon doesn't see them.

create policy "Members manage own requests"
  on public.requests
  for all
  using (auth.uid() = member_id)
  with check (auth.uid() = member_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- Summary of authenticated reach after this migration:
--   listings        → SELECT active + own + admin; INSERT/UPDATE/DELETE own;
--                     fee/lifecycle/view_count columns grant-protected
--   availability    → SELECT if parent visible; write-all if owner of parent
--   inquiries       → SELECT own (as seeker or listing owner) + admin;
--                     INSERT as seeker against visible listing; UPDATE
--                     status/dates/message; no DELETE (audit)
--   saved_alerts    → CRUD own only
--   reviews         → SELECT public-to-authenticated; CRUD own (no self-review)
--   reports         → SELECT own + admin; INSERT own (decision fields
--                     grant-blocked); UPDATE admin-only; no DELETE (audit)
--   requests        → SELECT public-to-authenticated; CRUD own
-- ─────────────────────────────────────────────────────────────────────────────
