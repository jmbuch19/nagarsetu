-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0004 — Core schema (Phase 1 §1, slice 2)
--
-- Four tables that hold the actual people + what they do + what they offer +
-- their verification state:
--   members (linked 1:1 to auth.users, profile fields nullable until filled)
--   member_professions (cascading profession→specialty + expertise_text + years)
--   member_capabilities (consent-gated guidance / mentor / other offers)
--   verifications (admin-reviewed L2 ID verification + voucher / referral history)
--
-- RLS is added in migration 0005.
--
-- Key design choices documented inline. Conventions (uuid pk where it's a new
-- entity, created_at + updated_at + set_updated_at trigger) match slice 1.
-- ─────────────────────────────────────────────────────────────────────────────


-- members ────────────────────────────────────────────────────────────────────
-- 1:1 with auth.users: members.id IS auth.users.id. Created automatically
-- via the auth trigger below at OTP success; profile fields stay NULL until
-- the member completes profile. App reads `is_profile_complete()` to gate
-- features that require a full profile.
--
-- Per MEMORY locked decisions:
--   - "Sign-up = tiny": only id + phone at row creation
--   - "Profile fields": required = full_name, surname, city_id, pincode,
--     gender, date_of_birth; optional = email, photo, sub_community_id, bio
--   - "Minimal location": city + PIN only on profile, no home address
--   - Role + trust_level + id_verification are admin-managed (column grants
--     in migration 0005 prevent members updating them)
create table public.members (
  id                 uuid primary key references auth.users(id) on delete cascade,
  phone              text not null unique,
  email              text unique,                       -- optional per SPEC; allows multiple NULLs
  full_name          text,
  surname            text,
  city_id            uuid references public.cities(id),
  pincode            text,
  sub_community_id   uuid references public.sub_communities(id),
  gender             text check (gender in ('male','female','other','prefer_not_to_say')),
  date_of_birth      date,
  photo_url          text,
  bio                text,
  role               text not null default 'member'
                     check (role in ('member','editor','admin')),
  trust_level        smallint not null default 0
                     check (trust_level between 0 and 3),
  id_verification    text not null default 'none'
                     check (id_verification in ('none','pending','verified')),
  recognised_surname boolean not null default false,
  opt_in_email       boolean not null default false,
  opt_in_whatsapp    boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index members_city_id_idx          on public.members (city_id);
create index members_sub_community_id_idx on public.members (sub_community_id);
create index members_role_idx             on public.members (role);
create index members_id_verification_idx  on public.members (id_verification);
create index members_surname_idx          on public.members (surname);  -- recognised-surname matching

create trigger trg_members_updated_at
  before update on public.members
  for each row execute function public.set_updated_at();


-- auth.users → members bootstrap trigger ─────────────────────────────────────
-- Fires after Supabase Auth creates an auth.users row (OTP success). Inserts
-- a minimal members row keyed by the same uuid. SECURITY DEFINER + explicit
-- search_path so it runs even though anon/authenticated can't INSERT directly
-- (RLS is added in 0005).
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.phone is not null then
    insert into public.members (id, phone)
    values (new.id, new.phone)
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();


-- Helper: is_profile_complete ────────────────────────────────────────────────
-- Returns true when the required profile fields are all filled. App uses
-- this to gate actions that need a complete profile.
create or replace function public.is_profile_complete(member_id uuid)
returns boolean
language sql
stable
as $$
  select
    full_name        is not null
    and surname      is not null
    and city_id      is not null
    and pincode      is not null
    and gender       is not null
    and date_of_birth is not null
  from public.members
  where id = member_id;
$$;


-- member_professions ─────────────────────────────────────────────────────────
-- One row per member-profession combo. A doctor who is also studying for an
-- MBA gets two rows (Doctor: current, Student: studying). expertise_text is
-- the freeform "what I actually did" — the 30-years-turnkey detail the
-- controlled-list specialty can't carry. FTS-indexed below.
create table public.member_professions (
  id                uuid primary key default gen_random_uuid(),
  member_id         uuid not null references public.members(id) on delete cascade,
  profession_id     uuid not null references public.professions(id),
  specialty_id      uuid references public.specialties(id),
  years_experience  smallint check (years_experience between 0 and 99),
  expertise_text    text check (char_length(expertise_text) <= 280),
  status            text not null default 'current'
                    check (status in ('current','retired','studying')),
  is_verified       boolean not null default false,    -- admin-verified credential, distinct from id_verification
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (member_id, profession_id)
);

create index member_professions_member_id_idx     on public.member_professions (member_id);
create index member_professions_profession_id_idx on public.member_professions (profession_id);
create index member_professions_specialty_id_idx  on public.member_professions (specialty_id);
create index member_professions_status_idx        on public.member_professions (status);

-- FTS index on expertise_text. 'simple' config = no stemming → works for both
-- Gujarati and English. Switch to a richer config if/when a Gujarati-aware
-- text-search dictionary becomes useful.
create index member_professions_expertise_fts_idx
  on public.member_professions
  using gin (to_tsvector('simple', coalesce(expertise_text, '')));

create trigger trg_member_professions_updated_at
  before update on public.member_professions
  for each row execute function public.set_updated_at();


-- member_capabilities ────────────────────────────────────────────────────────
-- Non-paid સેવા offers — what a member will help with. Consent-gated; never
-- inferred. Distinct from member_professions.expertise_text ("what I do")
-- per the MEMORY locked-decision callout.
create table public.member_capabilities (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.members(id) on delete cascade,
  kind        text not null check (kind in ('expert_guidance','mentor','other')),
  domain      text not null,                            -- e.g. "Cardiology", "Turnkey Project Management"
  description text,                                     -- freeform "what I'll help with"
  is_offered  boolean not null default true,            -- false = recorded but not actively offering
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (member_id, kind, domain)                      -- prevent dupe capability rows
);

create index member_capabilities_member_id_idx  on public.member_capabilities (member_id);
create index member_capabilities_kind_idx       on public.member_capabilities (kind);
create index member_capabilities_offered_idx    on public.member_capabilities (is_offered) where is_offered;

create trigger trg_member_capabilities_updated_at
  before update on public.member_capabilities
  for each row execute function public.set_updated_at();


-- verifications ──────────────────────────────────────────────────────────────
-- History of L2 ID-verification attempts + referral / vouch records. Multiple
-- rows per member allowed (history). The members.id_verification column is
-- the current STATE; verifications is the LOG.
create table public.verifications (
  id                  uuid primary key default gen_random_uuid(),
  member_id           uuid not null references public.members(id) on delete cascade,
  method              text not null check (method in ('referral','document','vouch')),
  voucher_member_id   uuid references public.members(id) on delete set null,  -- when method = vouch
  status              text not null default 'pending'
                      check (status in ('pending','reviewing','approved','rejected')),
  reviewed_by         uuid references public.members(id) on delete set null,  -- admin who reviewed
  reviewed_at         timestamptz,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check ((status in ('approved','rejected')) = (reviewed_by is not null))     -- decision rows must record the reviewer
);

create index verifications_member_id_idx on public.verifications (member_id);
create index verifications_status_idx    on public.verifications (status);

create trigger trg_verifications_updated_at
  before update on public.verifications
  for each row execute function public.set_updated_at();
