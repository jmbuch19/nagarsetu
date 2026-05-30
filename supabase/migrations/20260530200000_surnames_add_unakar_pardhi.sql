-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0041 — Add 'unakar' and 'pardhi' to nagar_surnames.
--
-- Founder addition on 2026-05-30. Same pattern as 0037: idempotent INSERT
-- (ON CONFLICT do nothing), then a re-backfill of recognised_surname for any
-- existing member whose surname matches one of the new entries. Surname stays
-- an indicator, not a gate (Hard Constraint #5).
-- ─────────────────────────────────────────────────────────────────────────────

insert into public.nagar_surnames (surname) values
  ('unakar'),
  ('pardhi')
on conflict (surname) do nothing;

-- Re-backfill: any existing member whose surname is now recognised gets the
-- flag set. (The 0017 trigger only fires on member surname writes, not on
-- list growth.)
update public.members m
set recognised_surname = exists (
  select 1
  from public.nagar_surnames ns
  where ns.surname = lower(btrim(m.surname))
)
where m.surname is not null;
