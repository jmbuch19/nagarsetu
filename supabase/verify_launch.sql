-- ════════════════════════════════════════════════════════════════════════
-- verify_launch.sql — Jay Hatkesh (Nagarsetu) live-DB pre-launch verification
--
-- WHERE: Supabase Dashboard → SQL Editor (runs as the `postgres` role, which
--        can see every table, policy, grant and function).
-- WHY:   Confirms the LIVE database matches the audited migrations — RLS on
--        every table, policies present, no privileged column writable by a
--        client role, SECURITY DEFINER functions locked down, views present.
--
-- HOW TO READ:
--   • BLOCK 1 returns ONE result table. Paste the whole thing back.
--   • Row "0. SUMMARY" tallies issues — it should say  total issues = 0 · ALL OK.
--   • Every row's `status` should be OK.
--   • Sections "2. stray RLS-off" and "4. priv-col write" should produce
--     ZERO rows. A row appearing there = a real problem.
--   • BLOCK 2 (cron + storage) are separate small queries — run each on its own.
-- ════════════════════════════════════════════════════════════════════════


-- ─────────────────────────── BLOCK 1 — master check ───────────────────────
with expected(tbl) as (
  values ('cities'),('sub_communities'),('professions'),('specialties'),
         ('listing_categories'),('genres'),('nagar_surnames'),('members'),
         ('member_professions'),('member_capabilities'),('verifications'),
         ('listings'),('availability'),('inquiries'),('saved_alerts'),
         ('reviews'),('reports'),('requests'),('magazine_issues'),
         ('submissions'),('payments'),('connection_requests'),('drives')
),

-- 1. every expected table exists, has RLS enabled, and has ≥1 policy
tbl_check as (
  select
    '1. tables+RLS'::text as check_group,
    e.tbl::text           as item,
    case
      when c.oid is null              then 'MISSING TABLE'
      when not c.relrowsecurity       then 'exists — RLS OFF'
      else 'exists · RLS ON · '
           || (select count(*) from pg_policies p
               where p.schemaname='public' and p.tablename=e.tbl)::text
           || ' policies'
    end::text as result,
    case
      when c.oid is null        then 'FAIL'
      when not c.relrowsecurity then 'FAIL'
      when (select count(*) from pg_policies p
            where p.schemaname='public' and p.tablename=e.tbl) = 0 then 'FAIL'
      else 'OK'
    end::text as status
  from expected e
  left join pg_class c
    on c.relname = e.tbl
   and c.relnamespace = 'public'::regnamespace
   and c.relkind = 'r'
),

-- 2. ANY public base table with RLS disabled (catches surprises too) → should be empty
extra_rls as (
  select '2. stray RLS-off'::text as check_group, t.tablename::text as item,
         'public table with RLS DISABLED'::text as result, 'FAIL'::text as status
  from pg_tables t
  join pg_class c
    on c.relname = t.tablename and c.relnamespace = 'public'::regnamespace
  where t.schemaname = 'public'
    and not c.relrowsecurity
    and t.tablename not in (select tbl from expected)
),

-- 3. every SECURITY DEFINER function must pin search_path
secdef as (
  select '3. definer fns'::text as check_group, p.proname::text as item,
         coalesce(array_to_string(p.proconfig, ', '), '(no settings)')::text as result,
         case
           when p.proconfig is not null
            and exists (select 1 from unnest(p.proconfig) x
                        where x like 'search_path=%')
           then 'OK' else 'FAIL'
         end::text as status
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prosecdef
),

-- 4. privileged columns must NOT be writable by a client role → should be empty
priv_cols as (
  select '4. priv-col write'::text as check_group,
         (t.tbl || '.' || t.col || '  (' || t.priv || ' as authenticated)')::text as item,
         'PRIVILEGED COLUMN IS WRITABLE — grant should be revoked'::text as result,
         'FAIL'::text as status
  from (values
    ('members','role','UPDATE'),
    ('members','trust_level','UPDATE'),
    ('members','id_verification','UPDATE'),
    ('members','recognised_surname','UPDATE'),
    ('members','phone','UPDATE'),
    ('members','terms_accepted_at','UPDATE'),
    ('members','terms_version','UPDATE'),
    ('member_professions','is_verified','UPDATE'),
    ('member_professions','is_verified','INSERT'),
    ('listings','fee_paid','UPDATE'),
    ('listings','status','UPDATE'),
    ('listings','published_at','UPDATE'),
    ('listings','expires_at','UPDATE'),
    ('listings','price_paid','UPDATE'),
    ('listings','term_days_paid','UPDATE')
  ) as t(tbl,col,priv)
  where has_column_privilege('authenticated',
          ('public.' || t.tbl)::regclass, t.col, t.priv)
),

-- 5. directory/pulse surfaces present as FUNCTIONS (migration 0033 converted
--    the 5 definer views → definer functions to clear lint 0010)
fns_chk as (
  select '5. directory/pulse fns'::text as check_group, v.expv::text as item,
         case when p.proname is null then 'MISSING FUNCTION' else 'present (function)' end::text as result,
         case when p.proname is null then 'FAIL' else 'OK' end::text as status
  from (values ('members_directory'),('community_pulse'),
               ('community_pulse_by_profession'),
               ('member_profession_directory'),
               ('member_capability_directory')) as v(expv)
  left join pg_proc p
    on p.pronamespace='public'::regnamespace and p.proname = v.expv
),

-- 6. definer-function EXECUTE grants → should be empty
--    A SECURITY DEFINER fn runs as its owner (postgres, RLS-bypassing), so the
--    real gate is WHO may call it. Reveal/admin fns must not be anon-callable;
--    cron fns must not be callable by ANY client role.
def_exec as (
  select '6. definer EXECUTE'::text as check_group,
         (p.proname || '  [anon can EXECUTE]')::text as item,
         'sensitive definer fn callable by anon — should be revoked'::text as result,
         'FAIL'::text as status
  from pg_proc p
  where p.pronamespace='public'::regnamespace and p.prosecdef
    and p.proname in ('get_revealed_contact','get_listing_contact',
                      'get_request_contact','get_member_email',
                      'set_listing_status','admin_review_verification',
                      'admin_close_post',
                      'members_directory','member_profession_directory',
                      'member_capability_directory')
    and has_function_privilege('anon', p.oid, 'EXECUTE')
  union all
  select '6. definer EXECUTE'::text,
         (p.proname || '  [client role can EXECUTE]')::text,
         'cron-only definer fn callable by a client role — should be revoked'::text,
         'FAIL'::text
  from pg_proc p
  where p.pronamespace='public'::regnamespace and p.prosecdef
    and p.proname in ('purge_deleted_accounts','expire_listings')
    and (has_function_privilege('anon', p.oid, 'EXECUTE')
         or has_function_privilege('authenticated', p.oid, 'EXECUTE'))
),

-- 0. summary tally
summary as (
  select '0. SUMMARY'::text as check_group,
         'total issues found'::text as item,
         (
           (select count(*) from tbl_check where status='FAIL')
         + (select count(*) from extra_rls)
         + (select count(*) from secdef where status='FAIL')
         + (select count(*) from priv_cols)
         + (select count(*) from fns_chk where status='FAIL')
         + (select count(*) from def_exec)
         )::text as result,
         case when (
           (select count(*) from tbl_check where status='FAIL')
         + (select count(*) from extra_rls)
         + (select count(*) from secdef where status='FAIL')
         + (select count(*) from priv_cols)
         + (select count(*) from fns_chk where status='FAIL')
         + (select count(*) from def_exec)
         ) = 0 then 'ALL OK' else 'REVIEW' end::text as status
)

select * from summary
union all select * from tbl_check
union all select * from extra_rls
union all select * from secdef
union all select * from priv_cols
union all select * from fns_chk
union all select * from def_exec
order by check_group, status, item;


-- ───────────────────── BLOCK 2 — supplementary (run separately) ───────────
-- These touch the cron / storage schemas; run each on its own. If pg_cron
-- isn't enabled, query 6 errors with "schema cron does not exist" — harmless.

-- 6. Scheduled jobs — expect: expire_listings, purge_deleted_accounts
-- select jobname, schedule, active from cron.job order by jobname;

-- 7. Storage buckets — expect: id-documents · public=false · 5242880 · image+pdf
-- select id, public, file_size_limit, allowed_mime_types from storage.buckets;

-- 8. Storage policies on objects — expect 4 (insert/select/update/delete), all
--    scoped to id-documents folder = auth.uid()
-- select policyname, cmd, roles from pg_policies
-- where schemaname='storage' and tablename='objects' order by policyname;
