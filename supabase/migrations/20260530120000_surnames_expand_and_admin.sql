-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0037 — Expand nagar_surnames with founder's curated list + admin
-- function to add more (the "smart engine" admin-flag side).
--
-- The reference list in migration 0017 was an explicit STARTER. Founder provided
-- the next batch on 2026-05-30 — adding here (idempotent via ON CONFLICT). Then
-- a re-backfill in case existing members had any of these as their surname
-- before the row was added.
--
-- Plus: admin_add_recognised_surname() — admin-only path used by /admin/surnames
-- to (a) insert a newly-vetted Nagar surname, AND (b) retroactively flip
-- recognised_surname=true for every existing member whose surname matches. Both
-- writes are normally protected: nagar_surnames writes are revoked from
-- authenticated, and members.recognised_surname isn't in the member UPDATE
-- grant. SECURITY DEFINER + is_admin() check is the clean path (mirrors
-- admin_close_post / admin_review_verification).
-- ─────────────────────────────────────────────────────────────────────────────

-- Founder's list (2026-05-30). Some entries overlap with the 0017 starter and
-- are no-ops via ON CONFLICT. "Vasavada (Desai)" was interpreted as Vasavada +
-- Desai as separate recognised entries; Desai was already seeded in 0017.
insert into public.nagar_surnames (surname) values
  ('acharya'),
  ('anjaria'),
  ('avashia'),
  ('baxi'),
  ('dhebar'),
  ('dholakia'),
  ('dixit'),
  ('ghoda'),
  ('ghodadra'),
  ('hathi'),
  ('hazrat'),
  ('jathal'),
  ('jha'),
  ('jikar'),
  ('joshipura'),
  ('kachchhi'),
  ('kharod'),
  ('kikani'),
  ('majmudar'),
  ('mankad'),
  ('mankodi'),
  ('oza'),
  ('pota'),
  ('rana'),
  ('rindani'),
  ('swadia'),
  ('vachharajani'),
  ('vaishnav'),
  ('vasavada'),
  ('vatsaraj'),
  ('ved'),
  ('vora')
on conflict (surname) do nothing;

-- Re-backfill: any existing member whose surname is now (or was already)
-- recognised gets the flag set. The 0017 trigger only fires on member surname
-- writes, not on list growth.
update public.members m
set recognised_surname = exists (
  select 1
  from public.nagar_surnames ns
  where ns.surname = lower(btrim(m.surname))
)
where m.surname is not null;


-- admin_add_recognised_surname(p_name) ─────────────────────────────────────────
-- Used by /admin/surnames: admin reviews members whose surname isn't on the
-- list, and either confirms it's a genuine Nagar surname (calls this) or
-- leaves it. Calling this inserts the normalised surname AND retroactively
-- recognises every existing member whose surname matches.
create or replace function public.admin_add_recognised_surname(p_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_norm text := lower(btrim(p_name));
begin
  if not (select public.is_admin()) then
    raise exception 'not_admin';
  end if;
  if v_norm = '' or v_norm is null then
    raise exception 'empty_name';
  end if;

  insert into public.nagar_surnames (surname) values (v_norm)
  on conflict (surname) do nothing;

  -- Flip recognised_surname for every existing member with this surname.
  update public.members
  set recognised_surname = true
  where lower(btrim(surname)) = v_norm
    and recognised_surname is distinct from true;
end;
$$;

revoke all on function public.admin_add_recognised_surname(text) from public, anon;
grant execute on function public.admin_add_recognised_surname(text) to authenticated;
