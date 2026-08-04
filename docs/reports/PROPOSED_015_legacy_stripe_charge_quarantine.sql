-- PROPOSAL ONLY -- DO NOT APPLY OR SEED WITHOUT PAYMENT-OWNER REVIEW.
--
-- Candidate migration 015: quarantine provider Charge/PaymentIntent pairs from
-- the predecessor VERZA payment system. These rows are financial evidence, not
-- application purchases. Nothing in this migration grants access, identifies a
-- current user, or links a current catalog item.

begin;

create table if not exists public.legacy_stripe_charge_quarantine (
  stripe_charge_id text primary key
    check (stripe_charge_id ~ '^ch_[A-Za-z0-9_]+$'),
  stripe_payment_intent text not null
    check (stripe_payment_intent ~ '^pi_[A-Za-z0-9_]+$'),
  source_system text not null default 'predecessor_verza_direct_payment_intent'
    check (source_system = 'predecessor_verza_direct_payment_intent'),
  livemode boolean not null check (livemode),
  provider_charge_status text not null
    check (provider_charge_status in ('failed', 'succeeded')),
  paid boolean not null,
  amount_cents integer not null check (amount_cents > 0),
  amount_refunded_cents integer not null default 0
    check (
      amount_refunded_cents >= 0
      and amount_refunded_cents <= amount_cents
    ),
  currency text not null
    check (currency = lower(currency) and currency ~ '^[a-z]{3}$'),
  disputed boolean not null default false,
  provider_description text,
  -- Hash the obsolete database UUIDs. They are not proof of a current identity
  -- and must never be foreign-keyed to current profiles or content.
  legacy_user_reference_sha256 text
    check (legacy_user_reference_sha256 ~ '^[0-9a-f]{64}$'),
  legacy_show_reference_sha256 text
    check (legacy_show_reference_sha256 ~ '^[0-9a-f]{64}$'),
  provider_created_at timestamptz not null,
  first_verified_at timestamptz not null default now(),
  last_provider_observed_at timestamptz not null default now(),
  review_note text not null default 'Unresolved predecessor payment; no current purchase or entitlement authority',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (provider_charge_status = 'failed' and not paid and amount_refunded_cents = 0)
    or (provider_charge_status = 'succeeded' and paid)
  )
);

create index if not exists legacy_stripe_charge_quarantine_pi_idx
  on public.legacy_stripe_charge_quarantine (stripe_payment_intent);
create index if not exists legacy_stripe_charge_quarantine_state_idx
  on public.legacy_stripe_charge_quarantine (
    provider_charge_status,
    disputed,
    amount_refunded_cents
  );

alter table public.legacy_stripe_charge_quarantine enable row level security;
revoke all on table public.legacy_stripe_charge_quarantine
  from public, anon, authenticated;
grant select, insert, update on table public.legacy_stripe_charge_quarantine
  to service_role;

comment on table public.legacy_stripe_charge_quarantine is
  'Provider-verified predecessor Stripe Charge evidence. Rows have no authority to create purchases, identify current users, or grant entitlements.';
comment on column public.legacy_stripe_charge_quarantine.legacy_user_reference_sha256 is
  'SHA-256 of the obsolete provider metadata user_id; deliberately not a current profile foreign key.';
comment on column public.legacy_stripe_charge_quarantine.legacy_show_reference_sha256 is
  'SHA-256 of the obsolete provider metadata show_id; deliberately not a current content foreign key.';

-- A quarantined provider reference must never be repurposed as a current
-- purchase. Deliberate future migration would require payment-owner review and
-- an explicit replacement migration, rather than an ad hoc support write.
create or replace function public.reject_quarantined_purchase_reference()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.stripe_payment_intent is not null
     and exists (
       select 1
       from public.legacy_stripe_charge_quarantine as quarantine
       where quarantine.stripe_payment_intent = new.stripe_payment_intent
     ) then
    raise exception 'Quarantined Stripe PaymentIntent cannot become a purchase';
  end if;
  return new;
end;
$$;

revoke all on function public.reject_quarantined_purchase_reference()
  from public, anon, authenticated;

drop trigger if exists reject_quarantined_purchase_reference
  on public.purchases;
create trigger reject_quarantined_purchase_reference
before insert or update of stripe_payment_intent on public.purchases
for each row execute function public.reject_quarantined_purchase_reference();

-- Future webhook code may call this only after retrieving the provider's
-- current Charge. It updates an already reviewed/seeded row and never inserts
-- a new quarantine record. A false result is an alert-worthy unknown orphan.
create or replace function public.reconcile_quarantined_stripe_charge(
  p_charge_id text,
  p_payment_intent text,
  p_charge_status text,
  p_paid boolean,
  p_amount_cents integer,
  p_amount_refunded_cents integer,
  p_currency text,
  p_disputed boolean,
  p_provider_observed_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  quarantine_row public.legacy_stripe_charge_quarantine%rowtype;
begin
  if coalesce(trim(p_charge_id), '') = ''
     or coalesce(trim(p_payment_intent), '') = ''
     or p_charge_status not in ('failed', 'succeeded')
     or p_amount_cents <= 0
     or p_amount_refunded_cents < 0
     or p_amount_refunded_cents > p_amount_cents
     or coalesce(trim(p_currency), '') = ''
     or p_provider_observed_at is null then
    raise exception 'Invalid quarantined Stripe Charge reconciliation input';
  end if;

  select *
    into quarantine_row
    from public.legacy_stripe_charge_quarantine
    where stripe_charge_id = p_charge_id
      and stripe_payment_intent = p_payment_intent
    for update;

  if not found then
    return false;
  end if;

  if quarantine_row.amount_cents <> p_amount_cents
     or quarantine_row.currency <> lower(p_currency) then
    raise exception 'Quarantined Stripe Charge conflicts with verified evidence';
  end if;

  -- A delayed provider event must not regress a newer canonical observation.
  if p_provider_observed_at < quarantine_row.last_provider_observed_at then
    return true;
  end if;

  if p_amount_refunded_cents < quarantine_row.amount_refunded_cents then
    raise exception 'Quarantined Stripe refund total cannot decrease';
  end if;

  update public.legacy_stripe_charge_quarantine
    set provider_charge_status = p_charge_status,
        paid = p_paid,
        amount_refunded_cents = p_amount_refunded_cents,
        disputed = p_disputed,
        last_provider_observed_at = p_provider_observed_at,
        updated_at = now()
    where stripe_charge_id = p_charge_id;

  return true;
end;
$$;

revoke all on function public.reconcile_quarantined_stripe_charge(
  text, text, text, boolean, integer, integer, text, boolean, timestamptz
) from public, anon, authenticated;
grant execute on function public.reconcile_quarantined_stripe_charge(
  text, text, text, boolean, integer, integer, text, boolean, timestamptz
) to service_role;

-- No INSERT seed statements belong in the migration. A separate reviewed
-- script must retrieve every live Stripe object, validate the exact aggregate,
-- hash obsolete metadata references in memory, and insert only approved IDs.

commit;
