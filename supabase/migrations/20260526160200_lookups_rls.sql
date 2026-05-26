-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0003 — Lookup RLS lockdown (Phase 1 §1, follow-up to slice 1)
--
-- Enables RLS on all 6 lookup tables and adds a single read-everyone policy
-- on each. With RLS on and no INSERT/UPDATE/DELETE policies, those operations
-- are DENIED for the `anon` and `authenticated` roles. The `service_role`
-- bypasses RLS by design — admin/backend code manages lookup contents.
--
-- Lookups are public data by definition (autocomplete, public directory
-- filters, magazine genres), so `select using (true)` is the right ceiling
-- on read.
--
-- Cities INSERT policy (for the member "suggest a city" flow) lands when
-- the §2 Auth profile UI is built — at that point we add a policy allowing
-- `authenticated` to INSERT cities with `status = 'pending'` only. Until
-- then, all writes are admin-only.
-- ─────────────────────────────────────────────────────────────────────────────

-- cities ─────────────────────────────────────────────────────────────────────
alter table public.cities enable row level security;
create policy "Anyone can read approved or merged cities (and their own pending)"
  on public.cities for select using (true);
-- NOTE: when the suggest-a-city UI lands, refine the SELECT policy to hide
-- other members' pending suggestions, and add an INSERT policy for
-- `authenticated` with a `with check (status = 'pending')` clause.

-- sub_communities ────────────────────────────────────────────────────────────
alter table public.sub_communities enable row level security;
create policy "Anyone can read sub_communities"
  on public.sub_communities for select using (true);

-- professions ────────────────────────────────────────────────────────────────
alter table public.professions enable row level security;
create policy "Anyone can read professions"
  on public.professions for select using (true);

-- specialties ────────────────────────────────────────────────────────────────
alter table public.specialties enable row level security;
create policy "Anyone can read specialties"
  on public.specialties for select using (true);

-- listing_categories ─────────────────────────────────────────────────────────
alter table public.listing_categories enable row level security;
create policy "Anyone can read listing_categories"
  on public.listing_categories for select using (true);

-- genres ─────────────────────────────────────────────────────────────────────
alter table public.genres enable row level security;
create policy "Anyone can read genres"
  on public.genres for select using (true);
