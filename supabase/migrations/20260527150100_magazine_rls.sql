-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0009 — Magazine RLS (Phase 1 §1, slice 4)
--
-- RLS policies for magazine_issues + submissions. Patterns used:
--   - is_editor() helper covers editor + admin (mirrors is_admin from 0005)
--   - magazine_issues: published rows visible to anon (guest browse shows
--     latest cover, AGENDA §3); other statuses editor + admin only
--   - submissions: author sees own (any status); editor + admin see all;
--     other authenticated members do not see individual rows (aggregate
--     "articles published" counter comes from a SECURITY DEFINER view in
--     slice 6, not direct table access)
--   - Authors can edit content fields only while status='submitted'; decision
--     fields blocked via column grants + a status-pin WITH CHECK
-- ─────────────────────────────────────────────────────────────────────────────


-- is_editor() helper ─────────────────────────────────────────────────────────
-- Returns true for role IN ('editor','admin'). Editors curate the magazine;
-- admins are the super-user. SECURITY DEFINER for the same reason as
-- is_admin: avoids RLS recursion on members.
create or replace function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.members
    where id = auth.uid() and role in ('editor','admin')
  );
$$;


-- magazine_issues ────────────────────────────────────────────────────────────
alter table public.magazine_issues enable row level security;

create policy "Published issues public; editors + admins see all"
  on public.magazine_issues
  for select
  using (status = 'published' or public.is_editor());

create policy "Editors + admins create issues"
  on public.magazine_issues
  for insert
  with check (public.is_editor());

create policy "Editors + admins update issues"
  on public.magazine_issues
  for update
  using (public.is_editor())
  with check (public.is_editor());

create policy "Editors + admins delete issues"
  on public.magazine_issues
  for delete
  using (public.is_editor());

-- Grant SELECT to anon so guests can fetch the latest published issue
-- (landing-page magazine-cover teaser, AGENDA §3). The SELECT policy above
-- still filters to status='published' for non-editors.
grant select on public.magazine_issues to anon;


-- submissions ────────────────────────────────────────────────────────────────
alter table public.submissions enable row level security;

create policy "Author sees own; editors + admins see all"
  on public.submissions
  for select
  using (auth.uid() = author_id or public.is_editor());
-- Other authenticated members do NOT see raw submission rows. The
-- "articles published" public counter aggregates via a SECURITY DEFINER
-- view added in slice 6.

create policy "Author submits own (status='submitted', no decision fields)"
  on public.submissions
  for insert
  with check (
    auth.uid() = author_id
    and status = 'submitted'
    and issue_id is null
    and pull_quote is null
    and reviewed_by is null
    and reviewed_at is null
    and review_notes is null
  );

create policy "Author edits own while submitted (content fields only)"
  on public.submissions
  for update
  using (auth.uid() = author_id and status = 'submitted')
  with check (
    auth.uid() = author_id
    and status = 'submitted'
    and issue_id is null
    and pull_quote is null
    and reviewed_by is null
    and reviewed_at is null
    and review_notes is null
  );

create policy "Editors + admins curate any submission"
  on public.submissions
  for update
  using (public.is_editor())
  with check (public.is_editor());

create policy "Author withdraws own while still submitted"
  on public.submissions
  for delete
  using (auth.uid() = author_id and status = 'submitted');

create policy "Editors + admins delete any submission"
  on public.submissions
  for delete
  using (public.is_editor());

-- Column-level grants:
-- INSERT — author specifies content + classification only; curation fields
-- (status, issue_id, pull_quote, reviewed_*, review_notes) are blocked at
-- the grant level + further pinned by the WITH CHECK above.
revoke insert on public.submissions from authenticated;
grant insert (
  author_id,
  genre_id,
  title,
  body,
  image_url,
  city_text
) on public.submissions to authenticated;

-- UPDATE — content + curation fields all allowed at the grant level; the
-- author UPDATE policy's WITH CHECK pins decision fields to NULL/'submitted'
-- so authors can't promote/assign their own work, while the editor UPDATE
-- policy can touch anything.
revoke update on public.submissions from authenticated;
grant update (
  genre_id,
  title,
  body,
  image_url,
  city_text,
  pull_quote,
  status,
  issue_id,
  reviewed_by,
  reviewed_at,
  review_notes
) on public.submissions to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- Summary of reach after this migration:
--   magazine_issues → SELECT 'published' visible to anon + authenticated;
--                     all statuses to editor + admin; CRUD editor + admin
--   submissions     → SELECT own (author) + editor + admin; INSERT own as
--                     'submitted' with curation fields NULL; UPDATE content
--                     fields while 'submitted' (author) OR anything (editor);
--                     DELETE own while 'submitted' OR any (editor)
-- ─────────────────────────────────────────────────────────────────────────────
