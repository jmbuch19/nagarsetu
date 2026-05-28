-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0023 — Purge cron for account deletion (Phase 1 §2/§8)
--
-- Completes the self-serve deletion flow (migration 0022): a daily pg_cron job
-- permanently erases accounts whose 30-day grace period has elapsed. Done
-- entirely inside Supabase (pg_cron) — no Vercel Cron, no CRON_SECRET, no
-- service-role key in the app.
--
-- Deleting the auth.users row cascades through members.id (ON DELETE CASCADE)
-- and onward to every member-owned row (professions, capabilities, connection
-- requests, etc.) — a clean DPDP erasure in one statement.
--
-- After this migration, verify in the Supabase SQL editor:
--   select public.purge_deleted_accounts();   -- returns 0 now (nothing aged out yet)
--   select * from cron.job where jobname = 'purge-deleted-accounts';
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pg_cron;

-- The erase. SECURITY DEFINER so it runs with the (postgres) owner's rights to
-- delete auth.users. Member-callable execution is revoked — only the cron
-- (and an admin in the SQL editor) runs it.
create or replace function public.purge_deleted_accounts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with purged as (
    delete from auth.users
    where id in (
      select id
      from public.members
      where deletion_requested_at is not null
        and deletion_requested_at < now() - interval '30 days'
    )
    returning 1
  )
  select count(*) into v_count from purged;
  return v_count;
end;
$$;

revoke all on function public.purge_deleted_accounts() from public, anon, authenticated;

-- Daily at 03:30 UTC. cron.schedule upserts by job name.
select cron.schedule(
  'purge-deleted-accounts',
  '30 3 * * *',
  $$ select public.purge_deleted_accounts(); $$
);
