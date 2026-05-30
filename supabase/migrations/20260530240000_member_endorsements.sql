-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0044 — Member endorsements ("praise") — public trust signal.
--
-- A member can publicly endorse another member they trust. Optional short
-- note ("upright practice", "honest with prices", "helped my mother quickly")
-- adds qualitative weight beyond the bare count. Public on the directory card
-- so the whole community can see who vouches for whom. One praise per pair;
-- endorser can revoke any time.
--
-- This is the foundation for member-backed promotion: rather than admin
-- vetting, the community signals commercial trust on its own. Weighting,
-- karma decay, expert-only votes, etc. can come later if the simple signal
-- isn't enough — the table shape is intentionally minimal so future iteration
-- doesn't need a rewrite.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.member_endorsements (
  id           uuid primary key default gen_random_uuid(),
  endorser_id  uuid not null references public.members(id) on delete cascade,
  recipient_id uuid not null references public.members(id) on delete cascade,
  note         text,
  created_at   timestamptz not null default now(),
  constraint member_endorsements_no_self
    check (endorser_id <> recipient_id),
  constraint member_endorsements_note_len
    check (note is null or char_length(note) <= 280),
  constraint member_endorsements_unique
    unique (endorser_id, recipient_id)
);

-- Lookup by recipient (the "show on card / profile" path).
create index member_endorsements_recipient_idx
  on public.member_endorsements (recipient_id, created_at desc);

-- Enable RLS — reads are public-within-community (the whole point), writes
-- are tight.
alter table public.member_endorsements enable row level security;

-- SELECT: any authenticated member can read. Endorsements are public trust
-- signals; the directory shows them by design.
create policy "Members read all endorsements"
  on public.member_endorsements
  for select
  to authenticated
  using (true);

-- INSERT: a member adds their own endorsement. Endorser must be the caller;
-- the unique constraint blocks dupes, the CHECK blocks self-praise.
create policy "Members add their own endorsement"
  on public.member_endorsements
  for insert
  to authenticated
  with check ((select auth.uid()) = endorser_id);

-- DELETE: only the endorser can revoke their own praise. Recipient cannot
-- remove praise about themselves (would invite both sock-puppet inflation
-- AND retaliatory deletion games — they ask the endorser to revoke if it's
-- contentious).
create policy "Endorser revokes own endorsement"
  on public.member_endorsements
  for delete
  to authenticated
  using ((select auth.uid()) = endorser_id);

-- Table grants — no UPDATE (endorsements are write-once; revoke + re-praise
-- to amend). Keeps the audit trail clean.
revoke all on public.member_endorsements from public, anon;
grant select, insert, delete on public.member_endorsements to authenticated;
