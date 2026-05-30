-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0040 — Let a requester WITHDRAW their own pending connection
-- request.
--
-- Today: a member sends a request to another → status='pending'. If they
-- change their mind or want to re-send with a different note, they're stuck —
-- the UNIQUE (requester_id, recipient_id) constraint blocks a fresh request
-- and there's no DELETE path for the requester.
--
-- Fix: a delete policy that lets the requester remove their OWN pending
-- request. Plain DELETE (no audit trail — these are abandoned, not adjudicated;
-- the recipient never approved or declined). Re-request becomes possible after
-- withdrawal.
--
-- Existing policies stay intact: INSERT remains gated to the requester,
-- UPDATE remains the recipient-only approve/decline path.
-- ─────────────────────────────────────────────────────────────────────────────

create policy "Requester withdraws own pending request"
  on public.connection_requests
  for delete
  to authenticated
  using (
    (select auth.uid()) = requester_id
    and status = 'pending'
  );
