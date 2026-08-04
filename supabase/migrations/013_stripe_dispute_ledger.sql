-- 013: Durable, provider-idempotent Stripe dispute history.
--
-- Disputes can begin long after Checkout fulfillment, can be delivered out of
-- order, and can outlive deletion of the payer's application account. Keep the
-- provider and financial state without email or another direct identifier.

create table if not exists public.stripe_disputes (
  stripe_dispute_id text primary key,
  stripe_charge_id text not null,
  stripe_payment_intent text,
  purchase_id uuid references public.purchases(id) on delete set null,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null,
  status text not null,
  reason text,
  charge_disputed boolean not null default true,
  charge_refunded_cents integer not null default 0
    check (charge_refunded_cents >= 0),
  last_event_created_at bigint not null,
  last_event_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stripe_disputes_payment_intent_idx
  on public.stripe_disputes (stripe_payment_intent);
create index if not exists stripe_disputes_purchase_idx
  on public.stripe_disputes (purchase_id);

alter table public.stripe_disputes enable row level security;
revoke all on table public.stripe_disputes from anon, authenticated;
grant all on table public.stripe_disputes to service_role;

comment on table public.stripe_disputes is
  'Service-only Stripe dispute ledger. Contains provider/financial state only and survives account deletion.';

-- Lock the dispute and matching purchase together. Event creation time plus a
-- terminal-state rank prevents a delayed older delivery from overwriting a
-- newer resolution; the webhook also retrieves the current Dispute and Charge
-- from Stripe instead of trusting the possibly stale event snapshot.
-- DROP is required when upgrading the earlier 11-argument draft to the
-- access-policy-aware signature.
drop function if exists public.reconcile_stripe_dispute(
  text, text, text, integer, text, text, text, boolean, integer, bigint, text
);
drop function if exists public.reconcile_stripe_dispute(
  text, text, text, integer, text, text, text, boolean, integer, bigint, text,
  boolean
);
create function public.reconcile_stripe_dispute(
  p_dispute_id text,
  p_charge_id text,
  p_payment_intent text,
  p_amount_cents integer,
  p_currency text,
  p_status text,
  p_reason text,
  p_charge_disputed boolean,
  p_charge_refunded_cents integer,
  p_event_created_at bigint,
  p_event_id text,
  p_restore_series_entitlement boolean
)
returns table (
  dispute_id text,
  linked_purchase_id uuid,
  linked_purchase_user_id uuid,
  reconciled_purchase_status text,
  reconciled_dispute_status text,
  applied boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  dispute_row public.stripe_disputes%rowtype;
  purchase_row public.purchases%rowtype;
  incoming_rank integer;
  current_rank integer;
  should_apply boolean := false;
  inserted boolean := false;
  next_purchase_status text;
begin
  if coalesce(trim(p_dispute_id), '') = ''
     or coalesce(trim(p_charge_id), '') = ''
     or coalesce(trim(p_currency), '') = ''
     or coalesce(trim(p_status), '') = ''
     or coalesce(trim(p_event_id), '') = ''
     or p_amount_cents < 0
     or p_charge_refunded_cents < 0
     or p_event_created_at < 0 then
    raise exception 'Invalid Stripe dispute reconciliation input';
  end if;

  incoming_rank := case p_status
    when 'won' then 4
    when 'lost' then 3
    when 'prevented' then 2
    when 'warning_closed' then 2
    else 1
  end;

  insert into public.stripe_disputes (
    stripe_dispute_id,
    stripe_charge_id,
    stripe_payment_intent,
    amount_cents,
    currency,
    status,
    reason,
    charge_disputed,
    charge_refunded_cents,
    last_event_created_at,
    last_event_id
  ) values (
    p_dispute_id,
    p_charge_id,
    p_payment_intent,
    p_amount_cents,
    lower(p_currency),
    p_status,
    p_reason,
    p_charge_disputed,
    p_charge_refunded_cents,
    p_event_created_at,
    p_event_id
  )
  on conflict (stripe_dispute_id) do nothing;
  inserted := found;

  select *
    into dispute_row
    from public.stripe_disputes
    where stripe_dispute_id = p_dispute_id
    for update;

  if inserted then
    should_apply := true;
  else
    current_rank := case dispute_row.status
      when 'won' then 4
      when 'lost' then 3
      when 'prevented' then 2
      when 'warning_closed' then 2
      else 1
    end;
    should_apply :=
      p_event_id <> dispute_row.last_event_id
      and (
        p_event_created_at > dispute_row.last_event_created_at
        or (
          p_event_created_at = dispute_row.last_event_created_at
          and incoming_rank >= current_rank
        )
      );

    if should_apply then
      update public.stripe_disputes
        set stripe_charge_id = p_charge_id,
            stripe_payment_intent = coalesce(
              p_payment_intent,
              stripe_payment_intent
            ),
            amount_cents = p_amount_cents,
            currency = lower(p_currency),
            status = p_status,
            reason = p_reason,
            charge_disputed = p_charge_disputed,
            charge_refunded_cents = p_charge_refunded_cents,
            last_event_created_at = p_event_created_at,
            last_event_id = p_event_id,
            updated_at = now()
        where stripe_dispute_id = p_dispute_id
        returning * into dispute_row;
    end if;
  end if;

  if p_payment_intent is not null then
    select *
      into purchase_row
      from public.purchases
      where stripe_payment_intent = p_payment_intent
      for update;
  end if;

  if purchase_row.id is not null then
    update public.stripe_disputes
      set purchase_id = purchase_row.id,
          updated_at = case
            when purchase_id is distinct from purchase_row.id then now()
            else updated_at
          end
      where stripe_dispute_id = p_dispute_id
      returning * into dispute_row;

    if should_apply then
      next_purchase_status := case
        when p_status = 'lost' then 'disputed_lost'
        when p_status in ('won', 'warning_closed', 'prevented')
          and p_charge_disputed then 'disputed'
        when p_status in ('won', 'warning_closed', 'prevented')
          and p_charge_refunded_cents > 0
          and p_charge_refunded_cents >= greatest(
            coalesce(purchase_row.amount_cents, 0),
            coalesce(purchase_row.total_cents, 0),
            0
          ) then 'refunded'
        when p_status in ('won', 'warning_closed', 'prevented')
          and p_charge_refunded_cents > 0 then 'partially_refunded'
        when p_status in ('won', 'warning_closed', 'prevented')
          then 'completed'
        else 'disputed'
      end;

      update public.purchases
        set status = next_purchase_status
        where id = purchase_row.id
        returning status into purchase_row.status;

      if purchase_row.type = 'series_unlock'
         and next_purchase_status in ('disputed', 'disputed_lost') then
        delete from public.entitlements as entitlement
          where entitlement.purchase_id = purchase_row.id;
      elsif purchase_row.type = 'series_unlock'
         and next_purchase_status in ('completed', 'partially_refunded')
         and coalesce(p_restore_series_entitlement, false) then
        perform public.grant_series_entitlement_for_purchase(
          purchase_row.id,
          purchase_row.user_id,
          purchase_row.series_slug
        );
      elsif purchase_row.type = 'vip_renewal'
         and next_purchase_status in ('disputed', 'disputed_lost')
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
    end if;
  end if;

  dispute_id := dispute_row.stripe_dispute_id;
  linked_purchase_id := dispute_row.purchase_id;
  linked_purchase_user_id := purchase_row.user_id;
  reconciled_purchase_status := purchase_row.status;
  reconciled_dispute_status := dispute_row.status;
  applied := should_apply;
  return next;
end;
$$;

revoke all on function public.reconcile_stripe_dispute(
  text, text, text, integer, text, text, text, boolean, integer, bigint, text,
  boolean
) from public, anon, authenticated;
grant execute on function public.reconcile_stripe_dispute(
  text, text, text, integer, text, text, text, boolean, integer, bigint, text,
  boolean
) to service_role;
