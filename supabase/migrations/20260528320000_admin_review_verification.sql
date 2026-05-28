-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0025 — Admin review of ID verifications (Phase 1 §2 — slice 2)
--
-- The one path by which a member's id_verification + trust_level get set to
-- "verified" / L2. SECURITY DEFINER + is_admin()-gated: any authenticated user
-- may call it, but it raises unless the caller is an admin. Runs as the owner
-- so it can write the admin-managed members columns (id_verification,
-- trust_level) that are NOT in the member UPDATE grant.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.admin_review_verification(
  p_verification_id uuid,
  p_approve         boolean,
  p_notes           text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member uuid;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  select member_id into v_member
  from public.verifications
  where id = p_verification_id;

  if v_member is null then
    raise exception 'verification not found';
  end if;

  update public.verifications
    set status      = case when p_approve then 'approved' else 'rejected' end,
        reviewed_by = (select auth.uid()),
        reviewed_at = now(),
        notes       = p_notes
    where id = p_verification_id;

  if p_approve then
    -- L2 = ID-verified (can host stays / rent vehicles). greatest() never
    -- downgrades a member already at a higher trust level.
    update public.members
      set id_verification = 'verified',
          trust_level     = greatest(trust_level, 2)
      where id = v_member;
  else
    -- Reset to 'none' so the member can re-submit. Leave trust_level alone.
    update public.members
      set id_verification = 'none'
      where id = v_member
        and id_verification = 'pending';
  end if;
end;
$$;

revoke all on function public.admin_review_verification(uuid, boolean, text)
  from public, anon;
grant execute on function public.admin_review_verification(uuid, boolean, text)
  to authenticated;
