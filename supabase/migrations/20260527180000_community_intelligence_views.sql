-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0013 — Community Intelligence aggregate views (Phase 1 §1, final
-- data-model slice — SPEC §3 + §3.1)
--
-- This slice ships the views that power:
--   • The Directory (cross-member member-finding) — SPEC §3
--   • The "scoop" drill-down (country → city → profession → specialty +
--     capability/age/gender/sub-community/status) — SPEC §3
--   • The public landing-page "Community Pulse" counters — SPEC §3.1
--
-- Five views in total. Three are auth-only; two are anon-readable (Pulse).
--
-- ───── A note on SECURITY DEFINER VIEWS (intentional RLS bypass) ─────────────
-- The directory + pulse views are created WITHOUT `security_invoker = true`,
-- so they run with the migration owner's privileges and bypass RLS on the
-- underlying tables. This is INTENTIONAL — `members` RLS is SELECT-own + admin
-- (slice 2), but the Directory requires every authenticated member to see
-- *some* dimensions of every other member. We cannot loosen RLS on `members`
-- because Postgres lacks column-level RLS — exposing safe columns and hiding
-- sensitive ones is exactly what views are for here.
--
-- The privacy boundary is enforced by the column whitelist in each view:
--   IN  → id, full_name, surname, city_id, pincode, sub_community_id, gender,
--         age_band (derived), photo_url, bio, role, trust_level,
--         id_verification status, recognised_surname, created_at
--   OUT → phone, email, raw date_of_birth, opt_in_email, opt_in_whatsapp
--
-- The Supabase Security Advisor will surface a "security definer view"
-- warning on these — that warning is the intended signal and should be
-- acknowledged in the dashboard. If/when Supabase ships a finer-grained
-- pattern (e.g. invoker view + SECURITY DEFINER function returning a
-- restricted column set), revisit.
--
-- ───── Materialization ──────────────────────────────────────────────────────
-- For Phase 1 (hundreds of members) these regular views are fast enough on
-- existing indexes. SPEC §3 calls for materialized views as counts grow —
-- promote each view to MATERIALIZED with a pg_cron refresh job in §9
-- (Launch polish, data-gated) once a real perf signal appears.
-- ─────────────────────────────────────────────────────────────────────────────


-- 1. members_directory ────────────────────────────────────────────────────────
-- Backfills the `members_public` slot that slice 2's audit explicitly
-- deferred to "the §3 Directory slice". Exposes profile-safe columns for
-- every member; the directory list page reads this.
--
-- `age_band` is derived from date_of_birth so the raw DOB can stay hidden.
-- The bands match a typical community-app spread:
--   <18 · 18-25 · 26-35 · 36-50 · 51-65 · 65+
-- These align with the age dimensions Community Intelligence uses for
-- drill-down ("members 26-35 in Rajkot").
create view public.members_directory
with (security_invoker = false)
as
select
  m.id,
  m.full_name,
  m.surname,
  m.city_id,
  m.pincode,
  m.sub_community_id,
  m.gender,
  case
    when m.date_of_birth is null                              then null
    when age(m.date_of_birth) < interval '18 years'           then '<18'
    when age(m.date_of_birth) < interval '26 years'           then '18-25'
    when age(m.date_of_birth) < interval '36 years'           then '26-35'
    when age(m.date_of_birth) < interval '51 years'           then '36-50'
    when age(m.date_of_birth) < interval '66 years'           then '51-65'
    else                                                           '65+'
  end as age_band,
  m.photo_url,
  m.bio,
  m.role,
  m.trust_level,
  m.id_verification,
  m.recognised_surname,
  m.created_at
from public.members m;

comment on view public.members_directory is
  'Directory-safe member fields. Definer view — bypasses RLS on members. '
  'Excludes phone, email, raw DOB, and opt-in flags. The privacy boundary '
  'IS this column whitelist. Auth-only (anon has no SELECT grant).';


-- 2. member_profession_directory ──────────────────────────────────────────────
-- One row per (member, profession) — supports the SPEC §3 drill-down:
-- country → state → city/PIN → profession → specialty, additionally
-- filterable by status (current/retired/studying), sub_community, gender,
-- age_band, trust_level.
--
-- Chains through members_directory so the safe-column whitelist + the
-- age_band derivation stay defined in one place (DRY).
create view public.member_profession_directory
with (security_invoker = false)
as
select
  mp.id                       as member_profession_id,
  md.id                       as member_id,
  md.full_name,
  md.surname,
  md.gender,
  md.age_band,
  md.role,
  md.trust_level,
  md.id_verification,
  md.recognised_surname,
  md.photo_url,
  -- City dimensions (drill-down country → state → city → pincode)
  md.city_id,
  c.name                      as city_name,
  c.state                     as city_state,
  c.country                   as city_country,
  md.pincode,
  -- Sub-community dimension
  md.sub_community_id,
  sc.name                     as sub_community_name,
  -- Profession + specialty dimensions
  mp.profession_id,
  p.name                      as profession_name,
  mp.specialty_id,
  sp.name                     as specialty_name,
  mp.years_experience,
  mp.expertise_text,
  mp.status                   as profession_status,
  mp.is_verified              as profession_verified,
  mp.created_at               as profession_created_at
from public.member_professions mp
join public.members_directory md on md.id = mp.member_id
join public.professions p        on p.id  = mp.profession_id
left join public.specialties sp  on sp.id = mp.specialty_id
left join public.cities c        on c.id  = md.city_id
left join public.sub_communities sc on sc.id = md.sub_community_id;

comment on view public.member_profession_directory is
  'Drill-down dimension table: one row per (member, profession). Powers '
  'SPEC §3 multi-dimensional aggregation. Definer view — same privacy '
  'boundary as members_directory.';


-- 3. member_capability_directory ──────────────────────────────────────────────
-- One row per (member, capability). Powers the "open to second opinions /
-- willing to mentor" capability-layer of the drill-down per SPEC §3
-- (the actionable layer — who is REACHABLE for help, not just who exists).
create view public.member_capability_directory
with (security_invoker = false)
as
select
  mc.id                       as member_capability_id,
  md.id                       as member_id,
  md.full_name,
  md.surname,
  md.gender,
  md.age_band,
  md.role,
  md.trust_level,
  md.id_verification,
  md.recognised_surname,
  md.photo_url,
  -- City dimensions
  md.city_id,
  c.name                      as city_name,
  c.state                     as city_state,
  c.country                   as city_country,
  md.pincode,
  -- Sub-community dimension
  md.sub_community_id,
  sc.name                     as sub_community_name,
  -- Capability dimensions
  mc.kind                     as capability_kind,
  mc.domain                   as capability_domain,
  mc.description              as capability_description,
  mc.is_offered,
  mc.created_at               as capability_created_at
from public.member_capabilities mc
join public.members_directory md on md.id = mc.member_id
left join public.cities c        on c.id  = md.city_id
left join public.sub_communities sc on sc.id = md.sub_community_id;

comment on view public.member_capability_directory is
  'Drill-down dimension table: one row per (member, capability). Powers '
  'the capability layer of SPEC §3 (who is reachable for help). Definer '
  'view — same privacy boundary as members_directory.';


-- 4. community_pulse ─────────────────────────────────────────────────────────
-- Public landing-page state counts per SPEC §3.1. Anon-readable.
--
-- One row, many columns — the landing page reads `select * from
-- community_pulse` and renders the row.
--
-- Connector-safe wording in mind: counts are state and proxy-events
-- (reviews / connections facilitated), NEVER money or "bookings".
--
-- Per-metric threshold guards (SPEC §3.1: "a counter only goes live once
-- it crosses a minimum") are NOT enforced here — they live in §9 (Launch
-- polish, data-gated) once an admin pricing/settings table exists. App
-- currently applies threshold logic client-side.
create view public.community_pulse
with (security_invoker = false)
as
select
  -- Members who have completed profile (full_name set is the minimum
  -- signal — it's the first required field after the OTP-only signup).
  (select count(*) from public.members where full_name is not null)
    as total_members,
  -- Anyone with a member_professions row (current/retired/studying — a
  -- studying member who later mentors is still part of the professional
  -- circle per the role-fluidity principle).
  (select count(distinct member_id) from public.member_professions)
    as total_professionals,
  -- Doctors — the historical core of the Setusarjan community.
  (select count(distinct mp.member_id)
     from public.member_professions mp
     join public.professions p on p.id = mp.profession_id
     where p.name = 'Doctor')
    as total_doctors,
  -- Distinct cities with at least one member.
  (select count(distinct city_id)
     from public.members
     where city_id is not null)
    as total_cities_represented,
  -- All active listings.
  (select count(*) from public.listings where status = 'active')
    as total_active_listings,
  -- Business listings (the "Total Businesses Listed" line on landing).
  (select count(*)
     from public.listings l
     join public.listing_categories lc on lc.id = l.category_id
     where l.status = 'active' and lc.name = 'business')
    as total_business_listings,
  -- Room + vehicle listings (combined hospitality + mobility).
  (select count(*)
     from public.listings l
     join public.listing_categories lc on lc.id = l.category_id
     where l.status = 'active' and lc.name in ('room', 'vehicle'))
    as total_room_vehicle_listings,
  -- Approved submissions in published issues (SPEC §3.1 "Articles
  -- Published"). The double-status check ensures unpublished issues don't
  -- inflate the count.
  (select count(*)
     from public.submissions s
     join public.magazine_issues mi on mi.id = s.issue_id
     where s.status = 'approved' and mi.status = 'published')
    as total_articles_published,
  -- Connector-safe activity proxy: inquiries the seeker + provider both
  -- moved to 'connected'. Worded "facilitated", NEVER "booked" — see
  -- SPEC §3.1 connector wording rule.
  (select count(*) from public.inquiries where status = 'connected')
    as total_connections_facilitated,
  -- Reviews are a second proxy. Total reviews across the trust economy.
  (select count(*) from public.reviews)
    as total_reviews,
  -- Stays + rides facilitated via the review-as-proxy pattern (SPEC §3.1).
  (select count(*)
     from public.reviews r
     join public.listings l            on l.id = r.listing_id
     join public.listing_categories lc on lc.id = l.category_id
     where lc.name = 'room')
    as total_stays_facilitated,
  (select count(*)
     from public.reviews r
     join public.listings l            on l.id = r.listing_id
     join public.listing_categories lc on lc.id = l.category_id
     where lc.name = 'vehicle')
    as total_rides_facilitated;

comment on view public.community_pulse is
  'Public landing-page state + proxy-activity counters per SPEC §3.1. '
  'Definer view. Anon + authenticated may SELECT. Per-metric threshold '
  'guard is app-side until §9 Launch polish ships the admin config table.';


-- 5. community_pulse_by_profession ───────────────────────────────────────────
-- Per-profession breakdown for the SPEC §3.1 "Total Professionals (by
-- category)" line. Ordered most-to-least so the landing page can render the
-- top N without an ORDER BY at query time.
create view public.community_pulse_by_profession
with (security_invoker = false)
as
select
  p.id                              as profession_id,
  p.name                            as profession_name,
  count(distinct mp.member_id)::int as member_count
from public.professions p
left join public.member_professions mp on mp.profession_id = p.id
group by p.id, p.name
order by member_count desc, p.name asc;

comment on view public.community_pulse_by_profession is
  'Per-profession member counts for the landing-page "by category" line. '
  'Definer view. Anon + authenticated may SELECT.';


-- ── Grants ──────────────────────────────────────────────────────────────────
-- Directory views: authenticated only (members find each other).
grant select on public.members_directory             to authenticated;
grant select on public.member_profession_directory   to authenticated;
grant select on public.member_capability_directory   to authenticated;

-- Pulse views: anon + authenticated (the landing page is public).
grant select on public.community_pulse               to anon, authenticated;
grant select on public.community_pulse_by_profession to anon, authenticated;

-- Explicitly NOT granting to anon for the directory views — directory is a
-- members-only surface. Anon would otherwise inherit SELECT through the
-- default public-schema grant if we ever loosen it; this revoke makes the
-- intent explicit.
revoke select on public.members_directory           from anon;
revoke select on public.member_profession_directory from anon;
revoke select on public.member_capability_directory from anon;


-- ─────────────────────────────────────────────────────────────────────────────
-- Summary
--   members_directory             → auth-only · safe-column whitelist over
--                                   `members` · derives age_band from DOB
--   member_profession_directory   → auth-only · drill-down dimension table
--                                   (country/state/city/PIN/profession/
--                                    specialty/status/age/gender/sub-community)
--   member_capability_directory   → auth-only · capability drill-down
--                                   (kind/domain/city/age/gender)
--   community_pulse               → anon-public · 12 state + proxy counters
--   community_pulse_by_profession → anon-public · per-profession breakdown
--
--   All five are intentionally definer (security_invoker = false). The
--   privacy boundary is the column whitelist — phone, email, raw DOB, and
--   opt-in flags are never exposed through any view.
-- ─────────────────────────────────────────────────────────────────────────────
