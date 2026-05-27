-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0010 — Payments schema (Phase 1 §1, slice 5)
--
-- The payments table is the ONLY money-handling table in Nagarsetu. It records
-- exactly one thing: a listing fee paid to publish a commercial listing.
-- Per CLAUDE.md hard constraints #1–#4:
--   • the app is a connector, not a cashier — no member-to-member money
--   • no commission, ever
--   • only in-app money = the listing fee
--   • belonging is free; selling carries a fee
--
-- Connector integrity enforced at the schema layer (not only RLS), so it
-- holds even if a future bug, fixture, or admin script tries to mint a
-- member-to-member row:
--   • listing_id NOT NULL — every payment ties to a listing
--   • a BEFORE INSERT/UPDATE trigger asserts payments.member_id equals
--     listings.member_id (payer = listing owner)
--   • status machine: created → paid | failed | refunded
--   • snapshot amount + currency + term_days_paid onto the payment row at
--     purchase (mirrors the listings.price_paid / term_days_paid lock from
--     slice 3 — admin price changes never retroactively rewrite receipts)
--
-- Gateway: Razorpay (Phase 1 — single gateway). SPEC's `gateway_ref` field
-- is split into gateway_order_id (Razorpay `order_xxxxx`, set at order
-- creation) + gateway_payment_id (`pay_xxxxx`, set on successful capture) +
-- gateway_signature (HMAC verified server-side before flipping to 'paid').
-- The split is required by Razorpay's two-phase flow; widening to additional
-- gateways later is a CHECK list change, not a schema change.
--
-- RLS in migration 0011. No member-facing write policy will exist — the
-- server-verified payment flow runs with the service_role key.
-- ─────────────────────────────────────────────────────────────────────────────


-- payments ───────────────────────────────────────────────────────────────────
create table public.payments (
  id                  uuid primary key default gen_random_uuid(),
  member_id           uuid not null references public.members(id) on delete restrict,
  listing_id          uuid not null references public.listings(id) on delete restrict,
  -- Snapshot of the price/term that was current at purchase. Admin can later
  -- change the pricing config; this row stays frozen at the amount the member
  -- actually paid, in the currency they paid it in, for the term they bought.
  amount              integer not null check (amount > 0),     -- minor units (paise for INR)
  currency            text    not null default 'INR'
                      check (currency in ('INR')),             -- widen list as gateway coverage expands
  term_days_paid      smallint not null
                      check (term_days_paid between 1 and 365),
  -- State machine. 'created' is the row that pairs with a Razorpay order;
  -- 'paid' is set only after the server has verified the gateway signature;
  -- 'failed' records a gateway-side failure (member can retry by creating a
  -- new payment row); 'refunded' supersedes a prior 'paid' (admin action).
  status              text    not null default 'created'
                      check (status in ('created','paid','failed','refunded')),
  gateway             text    not null default 'razorpay'
                      check (gateway in ('razorpay')),
  gateway_order_id    text    not null unique,                 -- Razorpay order_xxxxx (always set at insert)
  gateway_payment_id  text    unique,                          -- Razorpay pay_xxxxx (set on capture)
  gateway_signature   text,                                    -- HMAC verified server-side (audit)
  paid_at             timestamptz,                             -- set when status flips to 'paid'
  failed_reason       text,                                    -- gateway failure code/message
  refunded_at         timestamptz,                             -- set when status flips to 'refunded'
  refund_reason       text,                                    -- admin note on refund
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  -- Status integrity:
  -- A successful capture ('paid') and a post-capture refund ('refunded') both
  -- carry the gateway_payment_id and paid_at. Only 'refunded' carries
  -- refunded_at. A 'created' or 'failed' row carries neither paid_at nor
  -- refunded_at (it may carry gateway_payment_id if the gateway reported it
  -- alongside a failure, so payment_id is not pinned by 'created'/'failed').
  check ((status in ('paid','refunded')) = (paid_at is not null)),
  check ((status in ('paid','refunded')) = (gateway_payment_id is not null)),
  check ((status = 'refunded') = (refunded_at is not null))
);

-- Hot indexes:
--   member_id   — per-member receipt history (the only member-visible query)
--   listing_id  — the listing's payment(s); used by the renewal flow to find
--                 the most recent successful payment for a given listing
--   status      — admin reconciliation queue ('created' beyond N minutes,
--                 anomalies, etc.) — also used by a future cron to expire
--                 stuck 'created' rows
--   created_at  — admin newest-first listing
-- Partial latest-paid index supports the renewal lookup directly.
create index payments_member_id_idx   on public.payments (member_id);
create index payments_listing_id_idx  on public.payments (listing_id);
create index payments_status_idx      on public.payments (status);
create index payments_created_at_idx  on public.payments (created_at desc);
create index payments_listing_paid_idx
  on public.payments (listing_id, paid_at desc) where status = 'paid';

create trigger trg_payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();


-- enforce_payment_payer_is_listing_owner() ───────────────────────────────────
-- Schema-layer guarantee that the payments table cannot record a
-- member-to-member transfer. The trigger looks up the listing's owner and
-- asserts payments.member_id matches; it also rejects payments referencing
-- a missing listing (belt-and-braces against the FK firing later in the
-- statement).
--
-- search_path pinned to public so a hostile or shadowed schema cannot
-- redirect the listings reference. SECURITY DEFINER is NOT used — the
-- trigger only ever runs under service_role (the sole writer to payments),
-- which already has full read access to listings, so privilege elevation
-- buys nothing and adds surface.
create or replace function public.enforce_payment_payer_is_listing_owner()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_owner uuid;
begin
  select member_id into v_owner
    from public.listings
    where id = new.listing_id;
  if v_owner is null then
    raise exception
      'payments.listing_id % does not reference an existing listing',
      new.listing_id;
  end if;
  if v_owner <> new.member_id then
    raise exception
      'payments.member_id (%) must equal the owner of listing % (owner=%)',
      new.member_id, new.listing_id, v_owner;
  end if;
  return new;
end;
$$;

create trigger trg_payments_payer_is_listing_owner
  before insert or update of member_id, listing_id on public.payments
  for each row execute function public.enforce_payment_payer_is_listing_owner();
