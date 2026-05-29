-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0033 — Convert the 5 directory/pulse VIEWS into SECURITY DEFINER
-- FUNCTIONS (clears Supabase advisor lint 0010 `security_definer_view`).
--
-- WHY: the directory + pulse views were intentionally `security_invoker = false`
-- (definer) because Postgres has no column-level RLS — they expose a SAFE column
-- whitelist of every member while `members` RLS stays SELECT-own. Flipping them
-- to `security_invoker = true` would BREAK them (directory → own row only; pulse
-- → all-zero for anon) or force exposing member rows. The advisor still flags
-- definer *views* as an error.
--
-- The lint targets VIEWS, not functions. A SECURITY DEFINER function with a
-- pinned search_path is the supported pattern for "expose a restricted
-- projection across an RLS boundary". So we drop the 5 views and re-create them
-- as STABLE SECURITY DEFINER functions with the IDENTICAL bodies, names, and
-- column shapes. The privacy boundary is unchanged — it is still the column
-- whitelist (no phone / email / raw DOB / opt-in flags ever leave).
--
-- PostgREST exposes set-returning STABLE functions at /rpc/<name> and lets the
-- client filter/order/paginate the result exactly like a view, so the app only
-- changes `.from("x")` → `.rpc("x")` — the rest of each query chain is unchanged.
--
-- Grants mirror the old view grants:
--   • directory fns  → authenticated only (revoke from public, anon)
--   • pulse fns      → anon + authenticated (the landing page is public)
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop dependents first (the two drill-down views read members_directory).
drop view if exists public.member_profession_directory;
drop view if exists public.member_capability_directory;
drop view if exists public.members_directory;
drop view if exists public.community_pulse;
drop view if exists public.community_pulse_by_profession;


-- 1. members_directory() ──────────────────────────────────────────────────────
-- Directory-safe member columns over `members`. age_band derived from DOB so the
-- raw date never leaves; donor_blood_group only when the member opted to donate
-- and is in the 18–65 window; pending-deletion members excluded.
create function public.members_directory()
returns table (
  id                 uuid,
  full_name          text,
  surname            text,
  city_id            uuid,
  pincode            text,
  sub_community_id   uuid,
  gender             text,
  age_band           text,
  photo_url          text,
  bio                text,
  role               text,
  trust_level        smallint,
  id_verification    text,
  recognised_surname boolean,
  created_at         timestamptz,
  openly_contactable boolean,
  donor_blood_group  text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.id,
    m.full_name,
    m.surname,
    m.city_id,
    m.pincode,
    m.sub_community_id,
    m.gender,
    case
      when m.date_of_birth is null                    then null
      when age(m.date_of_birth) < interval '18 years' then '<18'
      when age(m.date_of_birth) < interval '26 years' then '18-25'
      when age(m.date_of_birth) < interval '36 years' then '26-35'
      when age(m.date_of_birth) < interval '51 years' then '36-50'
      when age(m.date_of_birth) < interval '66 years' then '51-65'
      else                                                 '65+'
    end as age_band,
    m.photo_url,
    m.bio,
    m.role,
    m.trust_level,
    m.id_verification,
    m.recognised_surname,
    m.created_at,
    m.openly_contactable,
    case
      when m.willing_to_donate is true
       and m.blood_group is not null
       and m.date_of_birth is not null
       and age(m.date_of_birth) >= interval '18 years'
       and age(m.date_of_birth) <  interval '66 years'
      then m.blood_group
      else null
    end as donor_blood_group
  from public.members m
  where m.deletion_requested_at is null;
$$;

comment on function public.members_directory() is
  'Directory-safe member fields. Definer function (replaces the definer view, '
  'clears lint 0010). Privacy boundary = this column whitelist: excludes phone, '
  'email, raw DOB, opt-in flags. Auth-only.';


-- 2. member_profession_directory() ────────────────────────────────────────────
-- One row per (member, profession). Drill-down dimensions; chains through
-- members_directory() so the safe-column whitelist stays defined once.
create function public.member_profession_directory()
returns table (
  member_profession_id uuid,
  member_id            uuid,
  full_name            text,
  surname              text,
  gender               text,
  age_band             text,
  role                 text,
  trust_level          smallint,
  id_verification      text,
  recognised_surname   boolean,
  photo_url            text,
  city_id              uuid,
  city_name            text,
  city_state           text,
  city_country         text,
  pincode              text,
  sub_community_id     uuid,
  sub_community_name   text,
  profession_id        uuid,
  profession_name      text,
  specialty_id         uuid,
  specialty_name       text,
  years_experience     smallint,
  expertise_text       text,
  profession_status    text,
  profession_verified  boolean,
  profession_created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    mp.id           as member_profession_id,
    md.id           as member_id,
    md.full_name,
    md.surname,
    md.gender,
    md.age_band,
    md.role,
    md.trust_level,
    md.id_verification,
    md.recognised_surname,
    md.photo_url,
    md.city_id,
    c.name          as city_name,
    c.state         as city_state,
    c.country       as city_country,
    md.pincode,
    md.sub_community_id,
    sc.name         as sub_community_name,
    mp.profession_id,
    p.name          as profession_name,
    mp.specialty_id,
    sp.name         as specialty_name,
    mp.years_experience,
    mp.expertise_text,
    mp.status       as profession_status,
    mp.is_verified  as profession_verified,
    mp.created_at   as profession_created_at
  from public.member_professions mp
  join public.members_directory() md on md.id = mp.member_id
  join public.professions p           on p.id  = mp.profession_id
  left join public.specialties sp     on sp.id = mp.specialty_id
  left join public.cities c           on c.id  = md.city_id
  left join public.sub_communities sc on sc.id = md.sub_community_id;
$$;

comment on function public.member_profession_directory() is
  'Drill-down: one row per (member, profession). Definer function; same privacy '
  'boundary as members_directory().';


-- 3. member_capability_directory() ────────────────────────────────────────────
create function public.member_capability_directory()
returns table (
  member_capability_id  uuid,
  member_id             uuid,
  full_name             text,
  surname               text,
  gender                text,
  age_band              text,
  role                  text,
  trust_level           smallint,
  id_verification       text,
  recognised_surname    boolean,
  photo_url             text,
  city_id               uuid,
  city_name             text,
  city_state            text,
  city_country          text,
  pincode               text,
  sub_community_id      uuid,
  sub_community_name    text,
  capability_kind       text,
  capability_domain     text,
  capability_description text,
  is_offered            boolean,
  capability_created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    mc.id           as member_capability_id,
    md.id           as member_id,
    md.full_name,
    md.surname,
    md.gender,
    md.age_band,
    md.role,
    md.trust_level,
    md.id_verification,
    md.recognised_surname,
    md.photo_url,
    md.city_id,
    c.name          as city_name,
    c.state         as city_state,
    c.country       as city_country,
    md.pincode,
    md.sub_community_id,
    sc.name         as sub_community_name,
    mc.kind         as capability_kind,
    mc.domain       as capability_domain,
    mc.description  as capability_description,
    mc.is_offered,
    mc.created_at   as capability_created_at
  from public.member_capabilities mc
  join public.members_directory() md on md.id = mc.member_id
  left join public.cities c           on c.id  = md.city_id
  left join public.sub_communities sc on sc.id = md.sub_community_id;
$$;

comment on function public.member_capability_directory() is
  'Drill-down: one row per (member, capability). Definer function; same privacy '
  'boundary as members_directory().';


-- 4. community_pulse() ────────────────────────────────────────────────────────
-- Public landing-page state + proxy-activity counters. Single row.
create function public.community_pulse()
returns table (
  total_members                 bigint,
  total_professionals           bigint,
  total_doctors                 bigint,
  total_cities_represented      bigint,
  total_active_listings         bigint,
  total_business_listings       bigint,
  total_room_vehicle_listings   bigint,
  total_articles_published      bigint,
  total_connections_facilitated bigint,
  total_reviews                 bigint,
  total_stays_facilitated       bigint,
  total_rides_facilitated       bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from public.members where full_name is not null),
    (select count(distinct member_id) from public.member_professions),
    (select count(distinct mp.member_id)
       from public.member_professions mp
       join public.professions p on p.id = mp.profession_id
       where p.name = 'Doctor'),
    (select count(distinct city_id)
       from public.members where city_id is not null),
    (select count(*) from public.listings where status = 'active'),
    (select count(*)
       from public.listings l
       join public.listing_categories lc on lc.id = l.category_id
       where l.status = 'active' and lc.name = 'business'),
    (select count(*)
       from public.listings l
       join public.listing_categories lc on lc.id = l.category_id
       where l.status = 'active' and lc.name in ('room', 'vehicle')),
    (select count(*)
       from public.submissions s
       join public.magazine_issues mi on mi.id = s.issue_id
       where s.status = 'approved' and mi.status = 'published'),
    (select count(*) from public.inquiries where status = 'connected'),
    (select count(*) from public.reviews),
    (select count(*)
       from public.reviews r
       join public.listings l            on l.id = r.listing_id
       join public.listing_categories lc on lc.id = l.category_id
       where lc.name = 'room'),
    (select count(*)
       from public.reviews r
       join public.listings l            on l.id = r.listing_id
       join public.listing_categories lc on lc.id = l.category_id
       where lc.name = 'vehicle');
$$;

comment on function public.community_pulse() is
  'Public landing-page counters per SPEC §3.1. Definer function (replaces the '
  'definer view). Aggregate counts only — no rows, no PII. Anon + authenticated.';


-- 5. community_pulse_by_profession() ──────────────────────────────────────────
create function public.community_pulse_by_profession()
returns table (
  profession_id   uuid,
  profession_name text,
  member_count    int
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id                              as profession_id,
    p.name                            as profession_name,
    count(distinct mp.member_id)::int as member_count
  from public.professions p
  left join public.member_professions mp on mp.profession_id = p.id
  group by p.id, p.name
  order by member_count desc, p.name asc;
$$;

comment on function public.community_pulse_by_profession() is
  'Per-profession member counts for the landing "by category" line. Definer '
  'function (replaces the definer view). Aggregate only. Anon + authenticated.';


-- ── Grants ────────────────────────────────────────────────────────────────────
-- Directory functions: authenticated only. Revoke the default PUBLIC EXECUTE
-- (which would otherwise include anon) and grant explicitly.
revoke all on function public.members_directory()           from public, anon;
revoke all on function public.member_profession_directory() from public, anon;
revoke all on function public.member_capability_directory() from public, anon;
grant execute on function public.members_directory()           to authenticated;
grant execute on function public.member_profession_directory() to authenticated;
grant execute on function public.member_capability_directory() to authenticated;

-- Pulse functions: public landing surface → anon + authenticated.
revoke all on function public.community_pulse()               from public;
revoke all on function public.community_pulse_by_profession() from public;
grant execute on function public.community_pulse()               to anon, authenticated;
grant execute on function public.community_pulse_by_profession() to anon, authenticated;

-- Nudge PostgREST to reload its schema cache so /rpc/<name> is available.
notify pgrst, 'reload schema';
