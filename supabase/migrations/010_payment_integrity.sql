-- 010: Payment integrity and durable Stripe webhook processing.
--
-- This migration is intentionally additive and idempotent. It must be applied
-- before deploying the matching webhook/claim routes. It does NOT decide the
-- product policy for revoking viewing entitlements after a refund; refunds are
-- recorded accurately while existing entitlements remain untouched.

-- Account deletion sets this before touching Stripe. Checkout routes check it
-- before and after session creation so they can never return a payable session
-- once deletion has begun.
alter table public.profiles
  add column if not exists deletion_requested_at timestamptz,
  add column if not exists vip_payment_blocked boolean not null default false,
  add column if not exists vip_cancel_at_period_end boolean not null default false;

-- ---------------------------------------------------------------------------
-- 1. One durable processing record per Stripe Event.
-- ---------------------------------------------------------------------------

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  object_id text,
  status text not null default 'processing'
    check (status in ('processing', 'processed', 'failed')),
  attempt_count integer not null default 1 check (attempt_count > 0),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.stripe_webhook_events enable row level security;
revoke all on public.stripe_webhook_events from anon, authenticated;
grant all on public.stripe_webhook_events to service_role;

-- Atomically claims a new/failed/stale event. A concurrent delivery receives
-- "busy" and must retry; a completed delivery receives "processed" and can be
-- acknowledged without repeating fulfillment.
create or replace function public.claim_stripe_webhook_event(
  p_event_id text,
  p_event_type text,
  p_object_id text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status text;
  current_updated_at timestamptz;
begin
  insert into public.stripe_webhook_events (
    event_id, event_type, object_id, status
  ) values (
    p_event_id, p_event_type, p_object_id, 'processing'
  )
  on conflict (event_id) do nothing;

  if found then
    return 'acquired';
  end if;

  select status, updated_at
    into current_status, current_updated_at
    from public.stripe_webhook_events
    where event_id = p_event_id
    for update;

  if current_status = 'processed' then
    return 'processed';
  end if;

  if current_status = 'processing'
     and current_updated_at >= now() - interval '10 minutes' then
    return 'busy';
  end if;

  update public.stripe_webhook_events
    set status = 'processing',
        event_type = p_event_type,
        object_id = p_object_id,
        attempt_count = attempt_count + 1,
        last_error = null,
        updated_at = now()
    where event_id = p_event_id;

  return 'acquired';
end;
$$;

revoke all on function public.claim_stripe_webhook_event(text, text, text)
  from public, anon, authenticated;
grant execute on function public.claim_stripe_webhook_event(text, text, text)
  to service_role;

-- ---------------------------------------------------------------------------
-- 2. Provider identifiers are domain-level idempotency keys.
-- ---------------------------------------------------------------------------

-- Regular UNIQUE constraints allow multiple NULLs and can be targeted by
-- PostgREST onConflict. Existing production data was audited before this
-- migration was authored; duplicate non-null identifiers must be reconciled
-- before applying if that changes.
do $$ begin
  alter table public.purchases
    add constraint purchases_stripe_session_id_key unique (stripe_session_id);
-- PostgreSQL reports an existing constraint-backed index as duplicate_table
-- (42P07), while some versions/objects report duplicate_object (42710).
-- Accept either only for this fixed canonical constraint name.
exception
  when duplicate_object or duplicate_table then null;
end $$;

do $$ begin
  alter table public.purchases
    add constraint purchases_stripe_payment_intent_key unique (stripe_payment_intent);
exception
  when duplicate_object or duplicate_table then null;
end $$;

alter table public.purchases
  add column if not exists refunded_cents integer not null default 0,
  add column if not exists refunded_at timestamptz,
  add column if not exists subtotal_cents integer,
  add column if not exists tax_cents integer not null default 0,
  add column if not exists total_cents integer;

-- amount_cents historically meant the gross amount charged. Preserve that
-- field for existing readers while making pretax revenue and collected tax
-- explicit. Re-running this migration never overwrites tax-aware rows.
update public.purchases
set subtotal_cents = coalesce(
      subtotal_cents,
      amount_cents - coalesce(tax_cents, 0)
    ),
    total_cents = coalesce(total_cents, amount_cents)
where subtotal_cents is null
   or total_cents is null;

-- An existing financial row with no amount is not safe to reinterpret. Fail
-- deployment for explicit reconciliation instead of silently backfilling 0.
alter table public.purchases
  alter column subtotal_cents set not null,
  alter column total_cents set not null;

alter table public.purchases
  drop constraint if exists purchases_financial_amounts_check;
alter table public.purchases
  add constraint purchases_financial_amounts_check check (
    amount_cents >= 0
    and subtotal_cents >= 0
    and tax_cents >= 0
    and total_cents >= 0
    and amount_cents = total_cents
    and subtotal_cents + tax_cents = total_cents
  ) not valid;
alter table public.purchases
  validate constraint purchases_financial_amounts_check;

-- The production schema retained older CHECK constraints even after migration
-- 008 rebuilt this table. Expand them before the refund RPC or VIP invoice
-- handler can write their canonical values. Dropping/re-adding fixed names is
-- intentionally idempotent and fails deployment if an unknown historical
-- value needs explicit reconciliation.
alter table public.purchases
  drop constraint if exists purchases_status_check;
alter table public.purchases
  add constraint purchases_status_check check (
    status in (
      'pending',
      'completed',
      'refunded',
      'partially_refunded',
      'failed',
      'disputed',
      'disputed_lost'
    )
  ) not valid;
alter table public.purchases
  validate constraint purchases_status_check;

alter table public.purchases
  drop constraint if exists purchases_type_check;
alter table public.purchases
  add constraint purchases_type_check check (
    type in ('merch', 'series_unlock', 'subscription', 'vip_renewal')
  ) not valid;
alter table public.purchases
  validate constraint purchases_type_check;

-- Granting access and reconciling an adverse provider event must serialize on
-- the same purchase row. If a grant commits first, a later full refund/dispute
-- deletes it; if the adverse event commits first, this function refuses to
-- resurrect it. A different newer purchase_id is never overwritten.
create or replace function public.grant_series_entitlement_for_purchase(
  p_purchase_id uuid,
  p_user_id uuid,
  p_series_slug text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  purchase_row public.purchases%rowtype;
  affected integer := 0;
begin
  select * into purchase_row
    from public.purchases
    where id = p_purchase_id
    for update;

  if not found
     or p_user_id is null
     or coalesce(trim(p_series_slug), '') = ''
     or purchase_row.user_id is distinct from p_user_id
     or purchase_row.type <> 'series_unlock'
     or purchase_row.series_slug is distinct from p_series_slug
     or purchase_row.status not in ('completed', 'partially_refunded')
     or coalesce(purchase_row.refunded_cents, 0) >= purchase_row.total_cents
     or purchase_row.subtotal_cents <> 199
     or purchase_row.currency <> 'usd' then
    return false;
  end if;

  insert into public.entitlements (user_id, series_slug, purchase_id)
  values (p_user_id, p_series_slug, p_purchase_id)
  on conflict (user_id, series_slug) do update
    set purchase_id = excluded.purchase_id
    where public.entitlements.purchase_id is null
       or public.entitlements.purchase_id = excluded.purchase_id;
  get diagnostics affected = row_count;

  -- A different purchase already owns this access. That is still access-safe,
  -- but callers should not claim that this older purchase performed the grant.
  return affected > 0;
end;
$$;

revoke all on function public.grant_series_entitlement_for_purchase(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.grant_series_entitlement_for_purchase(uuid, uuid, text)
  to service_role;

-- A won/closed VIP dispute may restore access only after the webhook verifies
-- the provider subscription is still active and canonical. Lock every invoice
-- row for that subscription before checking for any remaining adverse payment.
drop function if exists public.restore_vip_access_after_payment_resolution(
  uuid, uuid, text, timestamptz
);
drop function if exists public.restore_vip_access_after_payment_resolution(
  uuid, uuid, text, timestamptz, boolean
);
create function public.restore_vip_access_after_payment_resolution(
  p_purchase_id uuid,
  p_user_id uuid,
  p_subscription_id text,
  p_expires_at timestamptz,
  p_cancel_at_period_end boolean
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  purchase_row public.purchases%rowtype;
  restored_id uuid;
begin
  if p_user_id is null or coalesce(trim(p_subscription_id), '') = '' then
    return false;
  end if;

  -- Deterministic ordering avoids two invoice resolutions locking the same
  -- subscription's purchase rows in opposite order.
  perform id from public.purchases
    where type = 'vip_renewal'
      and metadata->>'subscription_id' = p_subscription_id
    order by id
    for update;

  select * into purchase_row
    from public.purchases
    where id = p_purchase_id;
  if not found
     or purchase_row.user_id is distinct from p_user_id
     or purchase_row.type <> 'vip_renewal'
     or purchase_row.metadata->>'subscription_id' is distinct from p_subscription_id
     or purchase_row.status not in ('completed', 'partially_refunded') then
    return false;
  end if;

  if exists (
    select 1 from public.purchases
    where type = 'vip_renewal'
      and user_id = p_user_id
      and metadata->>'subscription_id' = p_subscription_id
      and status in ('refunded', 'disputed', 'disputed_lost')
  ) then
    return false;
  end if;

  update public.profiles
    set is_vip = true,
        vip_expires_at = p_expires_at,
        vip_payment_blocked = false,
        vip_cancel_at_period_end = coalesce(p_cancel_at_period_end, false),
        updated_at = now()
    where id = p_user_id
      and stripe_subscription_id = p_subscription_id
      and deletion_requested_at is null
    returning id into restored_id;
  return restored_id is not null;
end;
$$;

revoke all on function public.restore_vip_access_after_payment_resolution(
  uuid, uuid, text, timestamptz, boolean
) from public, anon, authenticated;
grant execute on function public.restore_vip_access_after_payment_resolution(
  uuid, uuid, text, timestamptz, boolean
) to service_role;

create table if not exists public.stripe_refunds (
  stripe_refund_id text primary key,
  stripe_charge_id text,
  stripe_payment_intent text,
  purchase_id uuid references public.purchases(id) on delete set null,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'usd',
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.stripe_refunds enable row level security;
revoke all on public.stripe_refunds from anon, authenticated;
grant all on public.stripe_refunds to service_role;

create index if not exists stripe_refunds_payment_intent_idx
  on public.stripe_refunds (stripe_payment_intent);

-- Serializes cumulative refund updates for a PaymentIntent. Stripe can send
-- refund.* and charge.refunded for the same money; returning only the positive
-- delta prevents duplicate negative-revenue events across those deliveries.
-- DROP is required because PostgreSQL cannot CREATE OR REPLACE a function
-- whose table return shape changed from an earlier payment-integrity draft.
drop function if exists public.reconcile_purchase_refund(text, integer);
create function public.reconcile_purchase_refund(
  p_payment_intent text,
  p_refunded_cents integer
)
returns table (
  purchase_id uuid,
  purchase_user_id uuid,
  purchase_type text,
  purchase_session_id text,
  purchase_amount_cents integer,
  purchase_subtotal_cents integer,
  purchase_tax_cents integer,
  purchase_total_cents integer,
  total_refunded_cents integer,
  refund_delta_cents integer,
  purchase_status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  purchase_row public.purchases%rowtype;
  canonical_refund integer;
  prior_refund integer;
begin
  if p_payment_intent is null then
    return;
  end if;

  select *
    into purchase_row
    from public.purchases
    where stripe_payment_intent = p_payment_intent
    for update;

  if not found then
    return;
  end if;

  prior_refund := greatest(coalesce(purchase_row.refunded_cents, 0), 0);
  canonical_refund := greatest(
    prior_refund,
    least(
      greatest(coalesce(p_refunded_cents, 0), 0),
      greatest(coalesce(purchase_row.total_cents, 0), 0)
    )
  );

  update public.purchases
    set refunded_cents = canonical_refund,
        refunded_at = case
          when canonical_refund > 0 then coalesce(refunded_at, now())
          else null
        end,
        status = case
          when canonical_refund > 0
           and canonical_refund >= greatest(coalesce(total_cents, 0), 0)
            then 'refunded'
          when canonical_refund > 0 then 'partially_refunded'
          else status
        end
    where id = purchase_row.id
    returning status into purchase_status;

  if canonical_refund > 0
     and canonical_refund >= greatest(coalesce(purchase_row.total_cents, 0), 0)
     and purchase_row.type = 'series_unlock' then
    delete from public.entitlements as entitlement
      where entitlement.purchase_id = purchase_row.id;
  elsif canonical_refund > 0
     and canonical_refund >= greatest(coalesce(purchase_row.total_cents, 0), 0)
     and purchase_row.type = 'vip_renewal'
     and purchase_row.user_id is not null
     and coalesce(purchase_row.metadata->>'subscription_id', '') <> '' then
    update public.profiles
      set is_vip = false,
          vip_expires_at = null,
          vip_payment_blocked = true,
          vip_cancel_at_period_end = false,
          updated_at = now()
      where id = purchase_row.user_id
        and stripe_subscription_id = purchase_row.metadata->>'subscription_id';
  end if;

  purchase_id := purchase_row.id;
  purchase_user_id := purchase_row.user_id;
  purchase_type := purchase_row.type;
  purchase_session_id := purchase_row.stripe_session_id;
  purchase_amount_cents := coalesce(purchase_row.amount_cents, 0);
  purchase_subtotal_cents := coalesce(purchase_row.subtotal_cents, 0);
  purchase_tax_cents := coalesce(purchase_row.tax_cents, 0);
  purchase_total_cents := coalesce(purchase_row.total_cents, 0);
  total_refunded_cents := canonical_refund;
  refund_delta_cents := canonical_refund - prior_refund;
  return next;
end;
$$;

revoke all on function public.reconcile_purchase_refund(text, integer)
  from public, anon, authenticated;
grant execute on function public.reconcile_purchase_refund(text, integer)
  to service_role;

-- ---------------------------------------------------------------------------
-- 3. Manual support recovery for historical guest purchases.
-- ---------------------------------------------------------------------------

-- This is deliberately service-role-only and is NOT exposed by an automatic
-- auth callback. Historical auto-confirmed accounts do not prove mailbox
-- ownership; support must independently verify a claimant before invoking it.

create or replace function public.claim_pending_entitlements(
  p_user_id uuid,
  p_email text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(trim(p_email));
  claimed_count integer := 0;
begin
  if p_user_id is null or normalized_email = '' then
    return 0;
  end if;

  -- Ensure a valid profile FK, then serialize claims for the same historical
  -- email even if two support operators accidentally choose different users.
  perform 1 from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'Profile not found for entitlement claim';
  end if;

  perform 1
    from public.pending_entitlements
    where lower(email) = normalized_email
    for update;

  select count(distinct series_slug)::integer
    into claimed_count
    from public.pending_entitlements
    where lower(email) = normalized_email;

  insert into public.entitlements as existing_entitlement (
    user_id, series_slug, purchase_id
  )
    select p_user_id, pending.series_slug, pending.purchase_id
      from (
        select distinct on (series_slug) series_slug, purchase_id
          from public.pending_entitlements
          where lower(email) = normalized_email
          order by series_slug, created_at desc
      ) as pending
    on conflict (user_id, series_slug) do update
      set purchase_id = coalesce(
        excluded.purchase_id,
        existing_entitlement.purchase_id
      );

  insert into public.saved_list (user_id, series_slug, created_at)
    select p_user_id, pending.series_slug, now()
      from (
        select distinct series_slug
          from public.pending_entitlements
          where lower(email) = normalized_email
      ) as pending
    on conflict (user_id, series_slug) do nothing;

  delete from public.pending_entitlements
    where lower(email) = normalized_email;

  return claimed_count;
end;
$$;

revoke all on function public.claim_pending_entitlements(uuid, text)
  from public, anon, authenticated;
grant execute on function public.claim_pending_entitlements(uuid, text)
  to service_role;
