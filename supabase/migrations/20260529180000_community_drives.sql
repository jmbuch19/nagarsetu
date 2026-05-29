-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0034 — Community Drives (admin-published) — feature "1a".
--
-- An admin rallies the community around a blood need, an emergency, a help
-- request, or an announcement. Drives surface in-app (landing banner + feed).
-- PUBLIC read by design (founder decision 2026-05-29): visible to anyone,
-- including non-members / site visitors — a barrier-free way for an outsider to
-- help a community member. Content is admin-authored, so what's public is
-- admin-curated (incl. the optional contact line).
--
-- This is the LIGHT drive surface — it never touches money. The heavyweight,
-- document-backed, verified, money-flows-donor→family Help Drives (SPEC §7.4)
-- remain a separate future module.
--
-- Reach channels: in-app pull now. Email push (consent-gated) and WhatsApp
-- push (post-WABA) are deferred — see memory "community-drives-feature".
-- ─────────────────────────────────────────────────────────────────────────────

create table public.drives (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null
                check (kind in ('blood','emergency','help','announcement')),
  title         text not null check (char_length(title) between 1 and 140),
  body          text not null check (char_length(body) between 1 and 2000),
  city_id       uuid references public.cities(id),               -- optional location
  blood_group   text                                             -- optional, for blood drives
                check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  contact_name  text check (char_length(contact_name) <= 120),   -- optional; PUBLIC
  contact_info  text check (char_length(contact_info) <= 200),   -- optional; PUBLIC (admin-curated)
  status        text not null default 'active'
                check (status in ('active','closed')),
  starts_at     timestamptz not null default now(),
  expires_at    timestamptz,                                     -- null = no auto-expiry
  created_by    uuid references public.members(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Fast path for the public banner: active, unexpired drives, newest first.
create index drives_active_idx
  on public.drives (created_at desc)
  where status = 'active';

create trigger trg_drives_updated_at
  before update on public.drives
  for each row execute function public.set_updated_at();


-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.drives enable row level security;

-- Public read: active + unexpired drives visible to EVERYONE (anon included).
create policy "Active drives are public"
  on public.drives
  for select
  using (
    status = 'active'
    and (expires_at is null or expires_at > now())
  );

-- Admins additionally see all drives (closed/expired) for management.
create policy "Admins read all drives"
  on public.drives
  for select
  to authenticated
  using ((select public.is_admin()));

-- Only admins create / edit / close / delete.
create policy "Admins insert drives"
  on public.drives
  for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "Admins update drives"
  on public.drives
  for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins delete drives"
  on public.drives
  for delete
  to authenticated
  using ((select public.is_admin()));


-- ── Grants ────────────────────────────────────────────────────────────────────
-- Read for everyone (RLS narrows to active+unexpired for non-admins); writes for
-- authenticated, but RLS pins them to admins. No member can ever write a drive.
grant select on public.drives to anon, authenticated;
grant insert, update, delete on public.drives to authenticated;
