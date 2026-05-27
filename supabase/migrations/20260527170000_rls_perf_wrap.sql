-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0012 — RLS performance wrap (Phase 1 §1, audit pass for "RLS
-- policies on every table")
--
-- Wraps every per-row `auth.uid()`, `public.is_admin()`, and
-- `public.is_editor()` call inside existing RLS policies in a `(select ...)`
-- subquery. Postgres caches the result of a `SELECT` initplan and reuses it
-- across every row — turning a per-row function call into a single
-- evaluation per query.
--
-- Reference: Supabase Postgres best-practices skill (installed in the repo
-- at `.agents/skills/supabase-postgres-best-practices/`), file
-- `references/security-rls-performance.md` — flagged as a CRITICAL-priority
-- rule with "5–10× faster RLS queries with proper patterns" (100×+ on
-- 1M-row tables).
--
-- Slices 2–5 shipped with the bare form. This audit-pass migration rewrites
-- in place via ALTER POLICY (Postgres supports modifying USING / WITH CHECK
-- expressions on an existing policy — no drop-and-recreate, no policy gap).
-- Behaviour is identical; only the plan changes.
--
-- Audit findings recorded alongside this fix:
--   • 20 / 20 tables have RLS enabled (slices 0c + 2 + 3 + 4 + 5)
--   • Every table has at least one policy OR is service-role-only by design
--     (payments — writes are service_role; clients have SELECT-own only)
--   • Lookup tables (6) use `using (true)`; no auth.uid() to wrap
--   • Helpers `public.is_admin()` and `public.is_editor()` are stable +
--     parameterless → identical wrap pattern applies
-- ─────────────────────────────────────────────────────────────────────────────


-- ── Core (slice 2) ──────────────────────────────────────────────────────────

alter policy "Members can read own row (admin sees all)"
  on public.members
  using ((select auth.uid()) = id or (select public.is_admin()));

alter policy "Members can update own row"
  on public.members
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

alter policy "Authenticated can read member_professions"
  on public.member_professions
  using ((select auth.uid()) is not null);

alter policy "Members manage own member_professions"
  on public.member_professions
  using ((select auth.uid()) = member_id)
  with check ((select auth.uid()) = member_id);

alter policy "Authenticated can read member_capabilities"
  on public.member_capabilities
  using ((select auth.uid()) is not null);

alter policy "Members manage own member_capabilities"
  on public.member_capabilities
  using ((select auth.uid()) = member_id)
  with check ((select auth.uid()) = member_id);

alter policy "Members read own verifications (admin sees all)"
  on public.verifications
  using ((select auth.uid()) = member_id or (select public.is_admin()));

alter policy "Members create own pending verification request"
  on public.verifications
  with check (
    (select auth.uid()) = member_id
    and method in ('referral','document')
    and status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
  );

alter policy "Admins update verifications"
  on public.verifications
  using ((select public.is_admin()))
  with check ((select public.is_admin()));


-- ── Trust economy (slice 3) ─────────────────────────────────────────────────

alter policy "Active listings public to authenticated; own + admin see all"
  on public.listings
  using (
    status = 'active'
    or member_id = (select auth.uid())
    or (select public.is_admin())
  );

alter policy "Members create own listings"
  on public.listings
  with check ((select auth.uid()) = member_id);

alter policy "Members update own listings"
  on public.listings
  using ((select auth.uid()) = member_id)
  with check ((select auth.uid()) = member_id);

alter policy "Members delete own listings"
  on public.listings
  using ((select auth.uid()) = member_id);

alter policy "Availability visible if parent listing is visible"
  on public.availability
  using (
    exists (
      select 1 from public.listings l
      where l.id = availability.listing_id
        and (
          l.status = 'active'
          or l.member_id = (select auth.uid())
          or (select public.is_admin())
        )
    )
  );

alter policy "Listing owner manages availability"
  on public.availability
  using (
    exists (
      select 1 from public.listings l
      where l.id = availability.listing_id and l.member_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.listings l
      where l.id = availability.listing_id and l.member_id = (select auth.uid())
    )
  );

alter policy "Seeker sees own + listing owner sees inbox + admin sees all"
  on public.inquiries
  using (
    (select auth.uid()) = seeker_id
    or exists (
      select 1 from public.listings l
      where l.id = inquiries.listing_id and l.member_id = (select auth.uid())
    )
    or (select public.is_admin())
  );

alter policy "Seeker creates own inquiry against a visible listing"
  on public.inquiries
  with check (
    (select auth.uid()) = seeker_id
    and exists (
      select 1 from public.listings l
      where l.id = listing_id
        and (
          l.status = 'active'
          or l.member_id = (select auth.uid())
          or (select public.is_admin())
        )
    )
  );

alter policy "Seeker or listing owner updates inquiry status"
  on public.inquiries
  using (
    (select auth.uid()) = seeker_id
    or exists (
      select 1 from public.listings l
      where l.id = inquiries.listing_id and l.member_id = (select auth.uid())
    )
  );

alter policy "Members manage own saved_alerts"
  on public.saved_alerts
  using ((select auth.uid()) = member_id)
  with check ((select auth.uid()) = member_id);

alter policy "Authenticated can read reviews"
  on public.reviews
  using ((select auth.uid()) is not null);

alter policy "Members create own reviews"
  on public.reviews
  with check ((select auth.uid()) = author_id and author_id <> subject_id);

alter policy "Members update own reviews"
  on public.reviews
  using ((select auth.uid()) = author_id)
  with check ((select auth.uid()) = author_id);

alter policy "Members delete own reviews"
  on public.reviews
  using ((select auth.uid()) = author_id);

alter policy "Reporter sees own + admin sees all"
  on public.reports
  using ((select auth.uid()) = reporter_id or (select public.is_admin()));

alter policy "Members file own reports"
  on public.reports
  with check (
    (select auth.uid()) = reporter_id
    and status = 'open'
    and reviewed_by is null
    and reviewed_at is null
    and action_taken is null
  );

alter policy "Admins update reports (status / action / reviewer)"
  on public.reports
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

alter policy "Authenticated can read requests"
  on public.requests
  using ((select auth.uid()) is not null);

alter policy "Members manage own requests"
  on public.requests
  using ((select auth.uid()) = member_id)
  with check ((select auth.uid()) = member_id);


-- ── Magazine (slice 4) ──────────────────────────────────────────────────────

alter policy "Published issues public; editors + admins see all"
  on public.magazine_issues
  using (status = 'published' or (select public.is_editor()));

alter policy "Editors + admins create issues"
  on public.magazine_issues
  with check ((select public.is_editor()));

alter policy "Editors + admins update issues"
  on public.magazine_issues
  using ((select public.is_editor()))
  with check ((select public.is_editor()));

alter policy "Editors + admins delete issues"
  on public.magazine_issues
  using ((select public.is_editor()));

alter policy "Author sees own; editors + admins see all"
  on public.submissions
  using ((select auth.uid()) = author_id or (select public.is_editor()));

alter policy "Author submits own (status='submitted', no decision fields)"
  on public.submissions
  with check (
    (select auth.uid()) = author_id
    and status = 'submitted'
    and issue_id is null
    and pull_quote is null
    and reviewed_by is null
    and reviewed_at is null
    and review_notes is null
  );

alter policy "Author edits own while submitted (content fields only)"
  on public.submissions
  using ((select auth.uid()) = author_id and status = 'submitted')
  with check (
    (select auth.uid()) = author_id
    and status = 'submitted'
    and issue_id is null
    and pull_quote is null
    and reviewed_by is null
    and reviewed_at is null
    and review_notes is null
  );

alter policy "Editors + admins curate any submission"
  on public.submissions
  using ((select public.is_editor()))
  with check ((select public.is_editor()));

alter policy "Author withdraws own while still submitted"
  on public.submissions
  using ((select auth.uid()) = author_id and status = 'submitted');

alter policy "Editors + admins delete any submission"
  on public.submissions
  using ((select public.is_editor()));


-- ── Payments (slice 5) ──────────────────────────────────────────────────────

alter policy "Members read own payments; admins see all"
  on public.payments
  using ((select auth.uid()) = member_id or (select public.is_admin()));


-- ─────────────────────────────────────────────────────────────────────────────
-- Summary
--   39 policies altered across 14 tables (members, member_professions,
--   member_capabilities, verifications, listings, availability, inquiries,
--   saved_alerts, reviews, reports, requests, magazine_issues, submissions,
--   payments). 6 lookup tables (cities, sub_communities, professions,
--   specialties, listing_categories, genres) untouched — they use
--   `using (true)` and have no per-row function calls to wrap.
-- ─────────────────────────────────────────────────────────────────────────────
