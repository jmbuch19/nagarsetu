-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0006 — Trust economy schema (Phase 1 §1, slice 3)
--
-- Seven tables that hold the actual offers / coordination / connections /
-- social proof / moderation surface:
--   listings           — the unified Create-a-Listing hub output
--   availability       — indicative date windows (soft status, never a lock)
--   inquiries          — seeker's "I'm interested" → provider's Lead Inbox
--   saved_alerts       — receiver-side "notify me when X is listed"
--   reviews            — two-way social proof
--   reports            — reactive moderation feed (extended later for CEA + scholarships)
--   requests           — seeker-side demand posts (PG Seeker etc.); FREE
--
-- RLS in migration 0007. Listings also carry the §7.1 paid-listing lifecycle
-- fields (published_at / expires_at / price_paid / term_days_paid) so the
-- payment flow lands without needing an ALTER TABLE later.
-- ─────────────────────────────────────────────────────────────────────────────


-- listings ───────────────────────────────────────────────────────────────────
-- One entry per offer; category drives the form, status drives lifecycle.
-- Address fields scoped per the "Minimal location" decision: business/service
-- listings provide full address+hours+service_area; room/PG/vehicle give
-- area+city+pincode and share exact location member-to-member on connect.
create table public.listings (
  id                uuid primary key default gen_random_uuid(),
  member_id         uuid not null references public.members(id) on delete cascade,
  category_id       uuid not null references public.listing_categories(id),
  title             text not null,
  description       text,
  time_binding      text not null
                    check (time_binding in ('date_range','slot','departure','inventory','always')),
  price_text        text,                        -- free text — money is offline
  location_city_id  uuid references public.cities(id),
  pincode           text,
  area_text         text,                        -- neighborhood / area within the city
  address           text,                        -- full street address (business/service only)
  service_area      text,                        -- "covers Mumbai + Pune" — business/service
  hours             text,                        -- "Mon-Sat 10-7" — business/service
  contact_whatsapp  text,                        -- per-listing override; falls back to members.phone
  contact_phone     text,
  view_count        integer not null default 0,
  fee_paid          boolean not null default false,
  status            text not null default 'draft'
                    check (status in ('draft','active','paused','expired')),
  -- §7.1 paid-listing lifecycle (filled by the listing-fee payment flow):
  published_at      timestamptz,
  expires_at        timestamptz,
  price_paid        integer,                     -- minor units (paise) at purchase
  term_days_paid    smallint,                    -- term snapshotted at purchase
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index listings_member_id_idx        on public.listings (member_id);
create index listings_category_id_idx      on public.listings (category_id);
create index listings_location_city_id_idx on public.listings (location_city_id);
create index listings_status_idx           on public.listings (status);
create index listings_expires_at_idx       on public.listings (expires_at) where status = 'active';
create index listings_active_recent_idx    on public.listings (created_at desc) where status = 'active';

-- FTS on title + description (simple config — handles Gujarati + English without stemming).
create index listings_fts_idx
  on public.listings
  using gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '')));

create trigger trg_listings_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();


-- availability ───────────────────────────────────────────────────────────────
-- Indicative date windows for a listing. The app never hard-locks a slot
-- (SPEC §4: "availability is a coordination aid, not a booking").
create table public.availability (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.listings(id) on delete cascade,
  start_date  date not null,
  end_date    date not null,
  status      text not null default 'available'
              check (status in ('available','tentative','blocked')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (start_date <= end_date)
);

create index availability_listing_id_idx on public.availability (listing_id);
create index availability_dates_idx      on public.availability (start_date, end_date);
create index availability_status_idx     on public.availability (listing_id, status);

create trigger trg_availability_updated_at
  before update on public.availability
  for each row execute function public.set_updated_at();


-- inquiries ──────────────────────────────────────────────────────────────────
-- Seeker's "I'm interested" event. Becomes the provider's lead in their
-- Lead Inbox. Channel records the seeker's preferred contact method —
-- in_app | whatsapp | phone (per SPEC §7.06).
create table public.inquiries (
  id              uuid primary key default gen_random_uuid(),
  listing_id      uuid not null references public.listings(id) on delete cascade,
  seeker_id       uuid not null references public.members(id) on delete cascade,
  requested_start date,                          -- nullable: only for date_range/departure listings
  requested_end   date,
  requested_qty   integer,                       -- nullable: only for inventory listings
  message         text,
  channel         text not null default 'in_app'
                  check (channel in ('in_app','whatsapp','phone')),
  status          text not null default 'open'
                  check (status in ('open','connected','closed')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (requested_start is null or requested_end is null or requested_start <= requested_end),
  check (requested_qty is null or requested_qty > 0)
);

create index inquiries_listing_id_idx       on public.inquiries (listing_id);
create index inquiries_seeker_id_idx        on public.inquiries (seeker_id);
create index inquiries_status_idx           on public.inquiries (status);
create index inquiries_listing_created_idx  on public.inquiries (listing_id, created_at desc);

create trigger trg_inquiries_updated_at
  before update on public.inquiries
  for each row execute function public.set_updated_at();


-- saved_alerts ───────────────────────────────────────────────────────────────
-- Receiver-side nudge: "notify me when X is listed". Nulls mean "any".
create table public.saved_alerts (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.members(id) on delete cascade,
  category_id uuid references public.listing_categories(id),    -- null = any category
  city_id     uuid references public.cities(id),                -- null = anywhere
  keyword     text,                                              -- null = no keyword filter
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (member_id, category_id, city_id, keyword)
);

create index saved_alerts_member_id_idx   on public.saved_alerts (member_id);
create index saved_alerts_category_id_idx on public.saved_alerts (category_id) where category_id is not null;
create index saved_alerts_city_id_idx     on public.saved_alerts (city_id) where city_id is not null;

create trigger trg_saved_alerts_updated_at
  before update on public.saved_alerts
  for each row execute function public.set_updated_at();


-- reviews ────────────────────────────────────────────────────────────────────
-- Two-way social proof. listing_id is nullable so members can review each
-- other in a general (non-listing) context too.
create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid references public.listings(id) on delete set null,
  author_id   uuid not null references public.members(id) on delete cascade,
  subject_id  uuid not null references public.members(id) on delete cascade,
  rating      smallint not null check (rating between 1 and 5),
  body        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (author_id <> subject_id)              -- no self-reviews
);

create index reviews_subject_id_idx on public.reviews (subject_id);
create index reviews_listing_id_idx on public.reviews (listing_id) where listing_id is not null;
create index reviews_author_id_idx  on public.reviews (author_id);

create trigger trg_reviews_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();


-- reports ────────────────────────────────────────────────────────────────────
-- Reactive moderation queue. listing_id is nullable so a report can target
-- a member without targeting a specific listing. CEA and scholarship report
-- columns are added via ALTER in their respective slices (already noted in
-- AGENDA §7c + §7b).
create table public.reports (
  id                 uuid primary key default gen_random_uuid(),
  reporter_id        uuid not null references public.members(id) on delete cascade,
  subject_member_id  uuid not null references public.members(id) on delete cascade,
  listing_id         uuid references public.listings(id) on delete set null,
  reason             text not null,
  details            text,
  status             text not null default 'open'
                     check (status in ('open','reviewing','actioned','dismissed')),
  action_taken       text,
  reviewed_by        uuid references public.members(id) on delete set null,
  reviewed_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (reporter_id <> subject_member_id),
  -- decision rows must record the reviewer:
  check ((status in ('actioned','dismissed')) = (reviewed_by is not null))
);

create index reports_status_idx            on public.reports (status);
create index reports_subject_member_id_idx on public.reports (subject_member_id);
create index reports_listing_id_idx        on public.reports (listing_id) where listing_id is not null;
create index reports_reporter_id_idx       on public.reports (reporter_id);

create trigger trg_reports_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();


-- requests ───────────────────────────────────────────────────────────────────
-- Seeker-side demand posts (PG Seeker, "looking for a room/ride/tutor").
-- Always FREE per the connector model.
create table public.requests (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid not null references public.members(id) on delete cascade,
  category_id   uuid not null references public.listing_categories(id),
  area_text     text,
  city_id       uuid references public.cities(id),
  budget_text   text,
  needed_from   date,
  needed_to     date,
  gender_pref   text,                                -- for PG: 'male'|'female'|'any'
  food_pref     text,                                -- for PG: 'veg'|'jain'|'any'
  details       text,
  status        text not null default 'open'
                check (status in ('open','fulfilled','closed')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (needed_from is null or needed_to is null or needed_from <= needed_to)
);

create index requests_member_id_idx   on public.requests (member_id);
create index requests_category_id_idx on public.requests (category_id);
create index requests_city_id_idx     on public.requests (city_id);
create index requests_status_idx      on public.requests (status);
create index requests_needed_from_idx on public.requests (needed_from) where needed_from is not null;

create trigger trg_requests_updated_at
  before update on public.requests
  for each row execute function public.set_updated_at();
