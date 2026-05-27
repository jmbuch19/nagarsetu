-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0008 — Magazine schema (Phase 1 §1, slice 4)
--
-- Two tables that hold the auto-magazine engine (SPEC §6):
--   magazine_issues — one row per Setusarjan issue; lifecycle
--                     open → curating → rendered → published
--   submissions     — member submissions (article/poem/etc.); assigned to an
--                     issue by the editor when approved
--
-- RLS in migration 0009.
--
-- Conventions (uuid pk where it's a new entity, created_at + updated_at +
-- set_updated_at trigger) match slices 1–3. genre_id references the genres
-- lookup seeded in slice 1 (લેખ, ચિંતન, કવિતા, ગઝલ, …).
-- ─────────────────────────────────────────────────────────────────────────────


-- magazine_issues ────────────────────────────────────────────────────────────
-- One per Setusarjan issue. issue_number is the public identifier (Ank 87,
-- 88, …) — unique and used in the title page. publish_date is set when the
-- editor moves the issue to 'published'; rendered_pdf_url is set when the
-- fixed-template render produces the PDF.
create table public.magazine_issues (
  id                uuid primary key default gen_random_uuid(),
  issue_number      integer not null unique check (issue_number > 0),
  publish_date      date,                       -- required at status='published'
  status            text not null default 'open'
                    check (status in ('open','curating','rendered','published')),
  rendered_pdf_url  text,                       -- required at status in ('rendered','published')
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- Lifecycle integrity: a rendered/published issue must have a PDF; a
  -- published issue must have a publish_date.
  check (status not in ('rendered','published') or rendered_pdf_url is not null),
  check (status <> 'published' or publish_date is not null)
);

create index magazine_issues_status_idx
  on public.magazine_issues (status);
create index magazine_issues_publish_date_idx
  on public.magazine_issues (publish_date desc) where status = 'published';

create trigger trg_magazine_issues_updated_at
  before update on public.magazine_issues
  for each row execute function public.set_updated_at();


-- submissions ────────────────────────────────────────────────────────────────
-- One per member submission. issue_id is nullable: a submission lives
-- unassigned until an editor approves it into an open/curating issue. status
-- flow is submitted → approved | rejected (editor-driven). city_text is the
-- author's city as it appears under their byline in the rendered magazine
-- (snapshot at submission time, not a live join to cities — the byline
-- shouldn't shift if the author later moves).
--
-- Decision fields (reviewed_by / reviewed_at / review_notes / pull_quote /
-- issue_id) are editor-managed; author column grants in 0009 block them.
create table public.submissions (
  id            uuid primary key default gen_random_uuid(),
  issue_id      uuid references public.magazine_issues(id) on delete set null,
  author_id     uuid not null references public.members(id) on delete cascade,
  genre_id      uuid not null references public.genres(id),
  title         text not null,
  body          text not null,
  image_url     text,
  city_text     text,                            -- author's city for the byline
  pull_quote    text,                            -- Claude-suggested, editor-approved
  status        text not null default 'submitted'
                check (status in ('submitted','approved','rejected')),
  reviewed_by   uuid references public.members(id) on delete set null,
  reviewed_at   timestamptz,
  review_notes  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- Decision rows must record the reviewer (mirrors reports in slice 3).
  check ((status in ('approved','rejected')) = (reviewed_by is not null)),
  check ((status in ('approved','rejected')) = (reviewed_at is not null)),
  -- A submission can only be assigned to an issue once approved.
  check (issue_id is null or status = 'approved')
);

create index submissions_issue_id_idx
  on public.submissions (issue_id) where issue_id is not null;
create index submissions_author_id_idx
  on public.submissions (author_id);
create index submissions_genre_id_idx
  on public.submissions (genre_id);
create index submissions_status_idx
  on public.submissions (status);
create index submissions_pending_inbox_idx
  on public.submissions (created_at desc) where status = 'submitted';

-- FTS on title + body (simple config — handles Gujarati + English without
-- stemming, same approach as listings).
create index submissions_fts_idx
  on public.submissions
  using gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(body, '')));

create trigger trg_submissions_updated_at
  before update on public.submissions
  for each row execute function public.set_updated_at();
