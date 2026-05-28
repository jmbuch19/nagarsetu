-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0024 — ID verification: private Storage bucket + submission trigger
-- (Phase 1 §2 — slice 1 of the ID verification flow)
--
-- A member can submit a government photo ID to start L2 verification (needed
-- later to host a stay / rent a vehicle). This slice covers SUBMISSION:
--   • a PRIVATE `id-documents` Storage bucket (5 MB, image/PDF only), scoped so
--     a member can only write/read their OWN folder ({member_id}/…); admins
--     can read all (for the review surface in slice 2).
--   • a trigger that flips members.id_verification 'none' → 'pending' when a
--     document verification row is inserted, so the profile reflects review
--     state (the column isn't member-grantable, so the trigger sets it).
--
-- The verifications table + the member INSERT policy (own pending, method
-- 'document') already exist from migration 0005. The admin review function +
-- surface (approve/reject → set id_verification='verified' + trust_level)
-- come in slice 2.
-- ─────────────────────────────────────────────────────────────────────────────

-- Private bucket. file_size_limit in bytes (5 MB). Only images + PDF.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'id-documents',
  'id-documents',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

-- Storage RLS: a member operates only within their own {member_id}/ folder;
-- admins may read any ID doc (for review). foldername(name)[1] is the first
-- path segment.
create policy "Members upload own ID docs"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'id-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Members read own ID docs (admins read all)"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'id-documents'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select public.is_admin())
    )
  );

create policy "Members replace own ID docs"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'id-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Members delete own ID docs"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'id-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Submission trigger: a new document verification puts the member into the
-- 'pending' review state (only from 'none' — never downgrade a verified member).
create or replace function public.set_id_verification_pending()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.method = 'document' and new.status = 'pending' then
    update public.members
      set id_verification = 'pending'
      where id = new.member_id
        and id_verification = 'none';
  end if;
  return new;
end;
$$;

create trigger trg_verifications_set_pending
  after insert on public.verifications
  for each row execute function public.set_id_verification_pending();
