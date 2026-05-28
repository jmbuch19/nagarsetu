-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0019 — Lock full_name + date_of_birth once set (Phase 1 §2)
--
-- Founder rule (2026-05-28): a member's full_name and date_of_birth never
-- change once set; every other profile field stays editable. The profile form
-- renders them read-only after first save and the updateProfile action skips
-- them, but this BEFORE-UPDATE trigger is the hard guarantee — even a tampered
-- direct API write (members has a member UPDATE column grant on these) cannot
-- change them once non-null. Values are silently kept (not raised) so a normal
-- save that re-sends the same value never errors.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.prevent_immutable_profile_change()
returns trigger
language plpgsql
as $$
begin
  if old.full_name is not null
     and new.full_name is distinct from old.full_name then
    new.full_name := old.full_name;
  end if;

  if old.date_of_birth is not null
     and new.date_of_birth is distinct from old.date_of_birth then
    new.date_of_birth := old.date_of_birth;
  end if;

  return new;
end;
$$;

create trigger trg_members_immutable_name_dob
  before update on public.members
  for each row execute function public.prevent_immutable_profile_change();
