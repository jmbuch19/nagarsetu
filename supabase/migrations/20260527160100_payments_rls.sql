-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0011 — Payments RLS (Phase 1 §1, slice 5)
--
-- The payments table is the strictest in Nagarsetu:
--   • Members SELECT their own payments (receipt history). Admins SELECT all
--     (reconciliation, refunds). No other read path — receipts are private.
--   • No member-facing INSERT / UPDATE / DELETE policy exists. The ONLY
--     writer is the server-verified Razorpay flow running under the
--     service_role key. This is a deliberate, structural defense of the
--     AUDIT.md checklist item "Payment verified server-side against the
--     gateway (never trust client success)." A client cannot synthesise a
--     'paid' row even if it discovered the table name.
--   • anon is fully revoked — payments are not a public surface.
--   • The connector-integrity invariant (payer = listing owner) is enforced
--     at the schema layer via the trigger in 0010, so it holds whether the
--     writer is service_role, an admin, or a future test fixture.
-- ─────────────────────────────────────────────────────────────────────────────


alter table public.payments enable row level security;

create policy "Members read own payments; admins see all"
  on public.payments
  for select
  using (auth.uid() = member_id or public.is_admin());

-- No INSERT policy → INSERTs from authenticated/anon are denied.
-- No UPDATE policy → UPDATEs from authenticated/anon are denied.
-- No DELETE policy → DELETEs from authenticated/anon are denied.
-- service_role bypasses RLS and is the sole writer (server-verified flow).

-- Defense in depth: revoke the default Supabase table-level write grants so
-- even a future RLS misconfiguration upstream cannot permit a client write.
revoke insert, update, delete on public.payments from authenticated;
revoke insert, update, delete on public.payments from anon;

-- anon should not see that payments exist at all. RLS would already filter
-- to 0 rows (no policy includes anon), but revoking the SELECT grant means
-- the request fails at the grant layer rather than silently returning empty.
revoke select on public.payments from anon;


-- ─────────────────────────────────────────────────────────────────────────────
-- Summary of reach after this migration:
--   payments → SELECT own (member) + admin sees all
--            → INSERT / UPDATE / DELETE: service_role only (no policy +
--              grants revoked from authenticated and anon)
--            → anon: no access (SELECT grant revoked; no policy)
-- ─────────────────────────────────────────────────────────────────────────────
