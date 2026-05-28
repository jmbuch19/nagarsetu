-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0028 — Listing expiry cron (Phase 1 §4 — closes the lifecycle loop)
--
-- Period + payment + auto-closure go hand in hand: publishing sets
-- expires_at = now + term; this daily pg_cron job flips active listings to
-- 'expired' once that term elapses. Renewal already works — an expired listing
-- shows a Publish button (set_listing_status allows publish from 'expired'),
-- which re-activates a free listing for a fresh term (paid renewal rides the
-- payment flow when it lands).
--
-- pg_cron was enabled in migration 0023 (account-deletion purge). Done entirely
-- in Supabase — no Vercel cron.
--
-- Verify in the SQL editor:  select public.expire_listings();  (returns 0 now)
--                            select * from cron.job where jobname='expire-listings';
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.expire_listings()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with expired as (
    update public.listings
      set status = 'expired'
      where status = 'active'
        and expires_at is not null
        and expires_at < now()
      returning 1
  )
  select count(*) into v_count from expired;
  return v_count;
end;
$$;

revoke all on function public.expire_listings() from public, anon, authenticated;

-- Daily at 03:15 UTC (just before the account-deletion purge at 03:30).
select cron.schedule(
  'expire-listings',
  '15 3 * * *',
  $$ select public.expire_listings(); $$
);
