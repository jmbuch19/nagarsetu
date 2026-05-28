-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0016 — Directory contact reveal + member-to-member connections
-- (Phase 1 §3: "Permissioned contact reveal")
--
-- The directory lets members FIND each other (existing definer views from
-- migration 0013). This slice adds REACH-via-consent — the hybrid model:
--   • members.openly_contactable — a member's "anyone may reach me directly"
--     switch (default false). When true, any authenticated member can reveal
--     their WhatsApp without an approve step.
--   • connection_requests — the default path: A requests, B approves, then
--     contact is mutually revealable.
--   • get_revealed_contact() — the ONLY way another member's phone leaves the
--     DB. SECURITY DEFINER; returns the phone ONLY when consent holds
--     (target is openly_contactable OR an approved request links the pair).
--
-- members.phone is NEVER exposed through any view or table grant to other
-- members (RLS on members is SELECT-own + admin). This function is the single,
-- audited reveal path.
-- ─────────────────────────────────────────────────────────────────────────────


-- 1. members.openly_contactable ──────────────────────────────────────────────
alter table public.members
  add column openly_contactable boolean not null default false;

-- Re-establish the member-editable column whitelist (migrations 0005 + 0014)
-- PLUS openly_contactable. role / trust_level / id_verification /
-- recognised_surname / phone / terms_* remain admin/trigger-managed.
revoke update on public.members from authenticated;
grant update (
  email,
  full_name,
  surname,
  city_id,
  pincode,
  sub_community_id,
  gender,
  date_of_birth,
  photo_url,
  bio,
  opt_in_email,
  opt_in_whatsapp,
  openly_contactable
) on public.members to authenticated;


-- 2. connection_requests ─────────────────────────────────────────────────────
-- The default request → approve path. One row per directed pair
-- (requester → recipient). On approval, contact is revealable BOTH ways
-- (both parties have now consented to the connection).
create table public.connection_requests (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references public.members(id) on delete cascade,
  recipient_id  uuid not null references public.members(id) on delete cascade,
  note          text check (char_length(note) <= 500),   -- short intro from requester
  context       text check (char_length(context) <= 120),-- optional "why" e.g. "guidance: Cardiology"
  status        text not null default 'pending'
                check (status in ('pending','approved','declined')),
  created_at    timestamptz not null default now(),
  responded_at  timestamptz,
  updated_at    timestamptz not null default now(),
  check (requester_id <> recipient_id),
  -- A responded request (approved/declined) must record when; a pending one must not.
  check ((status in ('approved','declined')) = (responded_at is not null)),
  unique (requester_id, recipient_id)
);

create index connection_requests_recipient_idx
  on public.connection_requests (recipient_id, status);   -- recipient inbox
create index connection_requests_requester_idx
  on public.connection_requests (requester_id, status);   -- requester outbox

create trigger trg_connection_requests_updated_at
  before update on public.connection_requests
  for each row execute function public.set_updated_at();


-- 3. connection_requests RLS ─────────────────────────────────────────────────
alter table public.connection_requests enable row level security;

-- SELECT: either party (and admin) sees the request.
create policy "Parties read own connection requests"
  on public.connection_requests
  for select
  using (
    (select auth.uid()) = requester_id
    or (select auth.uid()) = recipient_id
    or (select public.is_admin())
  );

-- INSERT: requester creates their own request, always 'pending', never self.
create policy "Members create own connection request"
  on public.connection_requests
  for insert
  with check (
    (select auth.uid()) = requester_id
    and requester_id <> recipient_id
    and status = 'pending'
    and responded_at is null
  );

-- UPDATE: only the recipient responds (approve/decline).
create policy "Recipient responds to connection request"
  on public.connection_requests
  for update
  using ((select auth.uid()) = recipient_id)
  with check ((select auth.uid()) = recipient_id);

-- No DELETE policy → requests are an audit trail; withdrawal is a future path.

-- Column grants: requester sets requester_id/recipient_id/note/context on
-- INSERT; recipient sets only status/responded_at on UPDATE. This blocks a
-- recipient from rewriting the note/context or re-pointing the request.
revoke insert on public.connection_requests from authenticated;
grant insert (
  requester_id,
  recipient_id,
  note,
  context
) on public.connection_requests to authenticated;

revoke update on public.connection_requests from authenticated;
grant update (
  status,
  responded_at
) on public.connection_requests to authenticated;


-- 4. get_revealed_contact() ──────────────────────────────────────────────────
-- The single audited path by which one member's phone reaches another.
-- SECURITY DEFINER so it can read members.phone past RLS, but it returns a
-- row ONLY when consent holds:
--   • target is openly_contactable, OR
--   • an APPROVED connection_request links the caller and the target
--     (either direction — approval is mutual consent).
-- Returns 0 rows (not an error) when consent is absent, so the caller simply
-- gets "no contact available".
create or replace function public.get_revealed_contact(target uuid)
returns table (phone text, full_name text)
language sql
stable
security definer
set search_path = public
as $$
  select m.phone, m.full_name
  from public.members m
  where m.id = target
    and target <> (select auth.uid())          -- never via this path for self
    and (
      m.openly_contactable = true
      or exists (
        select 1
        from public.connection_requests cr
        where cr.status = 'approved'
          and (
            (cr.requester_id = (select auth.uid()) and cr.recipient_id = target)
            or (cr.recipient_id = (select auth.uid()) and cr.requester_id = target)
          )
      )
    );
$$;

revoke all on function public.get_revealed_contact(uuid) from public, anon;
grant execute on function public.get_revealed_contact(uuid) to authenticated;


-- 5. Expose openly_contactable in the directory view ─────────────────────────
-- Add the contactability flag to members_directory so the directory UI can
-- branch the Connect affordance (reveal directly vs. request→approve). It is
-- a preference, not sensitive PII — safe to expose. Appended at the end so
-- `create or replace view` is column-compatible; the chained views
-- (member_profession_directory / member_capability_directory) select named
-- columns from members_directory and are unaffected.
create or replace view public.members_directory
with (security_invoker = false)
as
select
  m.id,
  m.full_name,
  m.surname,
  m.city_id,
  m.pincode,
  m.sub_community_id,
  m.gender,
  case
    when m.date_of_birth is null                              then null
    when age(m.date_of_birth) < interval '18 years'           then '<18'
    when age(m.date_of_birth) < interval '26 years'           then '18-25'
    when age(m.date_of_birth) < interval '36 years'           then '26-35'
    when age(m.date_of_birth) < interval '51 years'           then '36-50'
    when age(m.date_of_birth) < interval '66 years'           then '51-65'
    else                                                           '65+'
  end as age_band,
  m.photo_url,
  m.bio,
  m.role,
  m.trust_level,
  m.id_verification,
  m.recognised_surname,
  m.created_at,
  m.openly_contactable
from public.members m;

grant select on public.members_directory to authenticated;
revoke select on public.members_directory from anon;
