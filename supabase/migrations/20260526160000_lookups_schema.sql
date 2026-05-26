-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0001 — Lookup tables (Phase 1 §1, first slice)
--
-- Six controlled lists that the rest of the data model + Community Intelligence
-- aggregations depend on. RLS is added in a later slice — these tables are
-- empty + harmless until core tables exist.
--
-- Convention (per SPEC §2): every table gets `id uuid pk default gen_random_uuid()`,
-- `created_at`, `updated_at` (auto-bumped via the trigger function below).
-- ─────────────────────────────────────────────────────────────────────────────

-- Trigger function: keep `updated_at` in sync on every row update.
-- Reused across every table in this migration and all subsequent slices.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- cities ─────────────────────────────────────────────────────────────────────
-- Global from day one (SPEC §1.5 / MEMORY). India + diaspora hubs in seed.
create table public.cities (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  state      text,
  country    text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, state, country)
);

create index cities_country_idx on public.cities (country);
create index cities_state_idx   on public.cities (state);
create index cities_name_idx    on public.cities (name);

create trigger trg_cities_updated_at
  before update on public.cities
  for each row execute function public.set_updated_at();


-- sub_communities ────────────────────────────────────────────────────────────
-- Nagar sub-groups (Vadnagara, Visnagara, Sathodara, …). Gujarati names —
-- the name itself IS in Gujarati.
create table public.sub_communities (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_sub_communities_updated_at
  before update on public.sub_communities
  for each row execute function public.set_updated_at();


-- professions ────────────────────────────────────────────────────────────────
create table public.professions (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_professions_updated_at
  before update on public.professions
  for each row execute function public.set_updated_at();


-- specialties ────────────────────────────────────────────────────────────────
-- Cascading off profession (Doctor → Cardiology, Engineer → Software, etc.).
create table public.specialties (
  id            uuid primary key default gen_random_uuid(),
  profession_id uuid not null references public.professions(id) on delete cascade,
  name          text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (profession_id, name)
);

create index specialties_profession_id_idx on public.specialties (profession_id);

create trigger trg_specialties_updated_at
  before update on public.specialties
  for each row execute function public.set_updated_at();


-- listing_categories ─────────────────────────────────────────────────────────
-- The unified "Create a Listing" hub categories (SPEC §2 / §7.05).
-- `time_binding` drives the category-specific form (SPEC §4 table).
create table public.listing_categories (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique
               check (name in ('business','room','vehicle','pg','goods','tour','service','expert','education')),
  time_binding text not null
               check (time_binding in ('date_range','slot','departure','inventory','always')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger trg_listing_categories_updated_at
  before update on public.listing_categories
  for each row execute function public.set_updated_at();


-- genres ─────────────────────────────────────────────────────────────────────
-- Magazine genres (Setusarjan). Names in Gujarati per SPEC §2.
create table public.genres (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_genres_updated_at
  before update on public.genres
  for each row execute function public.set_updated_at();


-- NOTE: RLS is NOT yet enabled on any of these. Phase 1 §1 next slices add
-- the core/trust-economy/etc. tables + the RLS pass per AGENDA.
