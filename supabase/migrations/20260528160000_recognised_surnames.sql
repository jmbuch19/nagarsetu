-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0017 — "Recognised Nagar surname" soft badge (Phase 1 §2)
--
-- A SIGNAL, NEVER A GATE (CLAUDE.md constraint #5 / AGENDA §2). A reference
-- list of Nagar surnames; when a member's surname matches, members.
-- recognised_surname flips true and the directory/profile shows a soft badge.
-- It never affects access, trust level, or eligibility for anything.
--
-- recognised_surname is NOT in the member UPDATE column grant (migrations
-- 0005/0014/0016) — members can't self-claim it. A BEFORE trigger derives it
-- from the reference list whenever surname is set, so it stays honest.
--
-- ⚠ THE SEED LIST IS A STARTER, NOT CANON. Nagar surnames are culturally
-- specific and the founder is the authority — curate this list (add/remove)
-- via admin before launch. Over/under-inclusion only changes a soft badge,
-- never access, but accuracy still matters for trust. Matching is on the
-- normalised form lower(btrim(surname)); add Gujarati-script spellings as
-- separate rows when needed.
-- ─────────────────────────────────────────────────────────────────────────────


-- 1. Reference table ─────────────────────────────────────────────────────────
create table public.nagar_surnames (
  surname    text primary key,           -- normalised: lower(btrim())
  created_at timestamptz not null default now()
);

comment on table public.nagar_surnames is
  'Reference list of recognised Nagar surnames (normalised lower/trim). '
  'Drives the members.recognised_surname soft badge — signal only, never a '
  'gate. Founder-curated starter; refine via admin before launch.';


-- 2. Seed (STARTER — founder to curate) ──────────────────────────────────────
-- Commonly-cited Nagar Brahmin surnames. Deliberately conservative — excludes
-- surnames shared broadly across Gujarati communities (e.g. Shah, Parikh) to
-- avoid false positives. Stored normalised (lowercase).
insert into public.nagar_surnames (surname) values
  ('mehta'),
  ('buch'),
  ('vyas'),
  ('dave'),
  ('raval'),
  ('rawal'),
  ('trivedi'),
  ('joshi'),
  ('pandya'),
  ('bhatt'),
  ('thaker'),
  ('thakar'),
  ('vaidya'),
  ('desai'),
  ('naik'),
  ('pathak'),
  ('shukla'),
  ('antani'),
  ('chhaya'),
  ('kotak'),
  ('munshi'),
  ('dhruv'),
  ('divetia'),
  ('nanavati'),
  ('master'),
  ('bakshi'),
  ('kavi')
on conflict (surname) do nothing;


-- 3. Trigger: derive members.recognised_surname ──────────────────────────────
-- SECURITY DEFINER so it can read nagar_surnames regardless of the caller's
-- RLS, and so the derivation is independent of the member's column grants
-- (recognised_surname is set by the trigger on NEW, not named in the member's
-- UPDATE statement — column grants restrict the statement's column list, not
-- trigger-assigned values).
create or replace function public.set_recognised_surname()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.recognised_surname := (
    new.surname is not null
    and exists (
      select 1
      from public.nagar_surnames ns
      where ns.surname = lower(btrim(new.surname))
    )
  );
  return new;
end;
$$;

-- Fire only when surname is involved (insert, or an update that sets surname).
create trigger trg_members_recognised_surname
  before insert or update of surname on public.members
  for each row execute function public.set_recognised_surname();


-- 4. RLS on nagar_surnames ───────────────────────────────────────────────────
-- Members-readable reference data (a future admin/profile UI may list it);
-- writes are admin/service-role only. The trigger reads it via SECURITY
-- DEFINER, so the feature works regardless of these grants.
alter table public.nagar_surnames enable row level security;

create policy "Authenticated can read nagar_surnames"
  on public.nagar_surnames
  for select
  using ((select auth.uid()) is not null);

revoke select on public.nagar_surnames from anon;
revoke insert, update, delete on public.nagar_surnames from anon, authenticated;


-- 5. Backfill existing members ───────────────────────────────────────────────
-- Direct UPDATE (migration owner bypasses the member column grant). No-op
-- while the community is empty, but keeps the column correct if any member
-- already has a surname set.
update public.members m
set recognised_surname = exists (
  select 1
  from public.nagar_surnames ns
  where ns.surname = lower(btrim(m.surname))
)
where m.surname is not null;
