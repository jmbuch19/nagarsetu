-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0020 — More "what can you offer" kinds (Phase 1 §2)
--
-- Founder direction (2026-05-28): the capability dropdown had only
-- expert_guidance / mentor / other. Add authentic સેવા-aligned options:
--   • volunteer_time — give time: elder care (non-medical), companionship,
--     community help
--   • creative       — share creative work (writing, poetry, art, music) —
--     also captures a member's creative leaning so the magazine/creative
--     platform can invite contributions later
--   • open_to_work   — available for part-time / full-time work
--
-- Only the CHECK on member_capabilities.kind changes; existing rows
-- (expert_guidance / mentor / other) remain valid.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.member_capabilities
  drop constraint member_capabilities_kind_check;

alter table public.member_capabilities
  add constraint member_capabilities_kind_check
  check (kind in (
    'expert_guidance',
    'mentor',
    'volunteer_time',
    'creative',
    'open_to_work',
    'other'
  ));
