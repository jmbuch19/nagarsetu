-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0015 — member_professions INSERT column grant (Phase 1 §2)
--
-- Closes a gap from migration 0005: `is_verified` was column-protected on
-- UPDATE but NOT on INSERT. A member could therefore self-set
-- `is_verified = true` at insert time and spoof the admin-set credential
-- badge (which the profile UI now displays). This re-grants INSERT on only the
-- member-settable columns — mirroring the existing UPDATE grant, plus
-- `member_id` (the RLS WITH CHECK "auth.uid() = member_id" forces it to the
-- caller). `is_verified`, `id`, `created_at`, `updated_at` fall back to their
-- defaults; `is_verified` becomes admin/service-role-only on both INSERT and
-- UPDATE, matching the posture already used for `verifications` in 0005.
--
-- No data change, no policy change — only the column-level INSERT privilege.
-- ─────────────────────────────────────────────────────────────────────────────

revoke insert on public.member_professions from authenticated;
grant insert (
  member_id,
  profession_id,
  specialty_id,
  years_experience,
  expertise_text,
  status
) on public.member_professions to authenticated;
