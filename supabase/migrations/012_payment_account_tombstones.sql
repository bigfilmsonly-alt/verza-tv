-- 012: Preserve the minimum provider identity needed to make account deletion
-- and asynchronous Stripe delivery converge safely.
--
-- Stripe can deliver a paid Checkout/Invoice event after the corresponding
-- Supabase profile and auth user have been deleted. Without this tombstone the
-- webhook retries forever (or, worse, reactivates orphaned recurring access).
-- This table deliberately has no FK to profiles/auth: surviving deletion is
-- its purpose. It contains no email, name, or entitlement data.

create table if not exists public.payment_account_tombstones (
  user_id uuid primary key,
  stripe_customer_id text,
  deleted_at timestamptz not null default now(),
  last_payment_event_at timestamptz
);

-- A Stripe Customer must never represent two application accounts. Make a
-- bad historical link fail deletion loudly instead of silently tombstoning the
-- wrong payer. NULL is allowed for accounts that never entered checkout.
create unique index if not exists payment_account_tombstones_customer_key
  on public.payment_account_tombstones (stripe_customer_id)
  where stripe_customer_id is not null;

alter table public.payment_account_tombstones enable row level security;
revoke all on table public.payment_account_tombstones from anon, authenticated;
grant all on table public.payment_account_tombstones to service_role;

comment on table public.payment_account_tombstones is
  'Service-only minimal identity retained after account deletion so delayed Stripe events are recorded without restoring access or billing.';
comment on column public.payment_account_tombstones.user_id is
  'Deleted Supabase auth UUID formerly placed in Stripe metadata.';
comment on column public.payment_account_tombstones.stripe_customer_id is
  'Stripe Customer retained solely for delayed-event matching and cancellation safety.';

-- Checkout/customer creation and account deletion can cross between the
-- profile marker and provider cleanup. Serialize both writers by user_id,
-- preserve the first non-null Customer, and fail loudly if two non-null
-- Customers ever claim the same application account.
create or replace function public.upsert_payment_account_tombstone(
  p_user_id uuid,
  p_stripe_customer_id text
)
returns table (
  user_id uuid,
  stripe_customer_id text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_customer_id text := nullif(trim(p_stripe_customer_id), '');
  tombstone_row public.payment_account_tombstones%rowtype;
begin
  if p_user_id is null then
    raise exception 'A payment tombstone requires a user ID';
  end if;

  -- ON CONFLICT waits for a concurrent insert of this user to commit. The
  -- subsequent row lock then makes coalescing and conflict detection atomic.
  begin
    insert into public.payment_account_tombstones (
      user_id,
      stripe_customer_id
    ) values (
      p_user_id,
      normalized_customer_id
    )
    on conflict on constraint payment_account_tombstones_pkey do nothing;
  exception
    when unique_violation then
      raise exception 'Stripe Customer already belongs to another payment tombstone';
  end;

  select *
    into tombstone_row
    from public.payment_account_tombstones as tombstone
    where tombstone.user_id = p_user_id
    for update;

  if not found then
    raise exception 'Payment tombstone disappeared during upsert';
  end if;
  if tombstone_row.stripe_customer_id is not null
     and normalized_customer_id is not null
     and tombstone_row.stripe_customer_id <> normalized_customer_id then
    raise exception 'Payment tombstone has a conflicting Stripe Customer';
  end if;

  if tombstone_row.stripe_customer_id is null
     and normalized_customer_id is not null then
    begin
      update public.payment_account_tombstones as tombstone
        set stripe_customer_id = normalized_customer_id
        where tombstone.user_id = p_user_id
        returning * into tombstone_row;
    exception
      when unique_violation then
        raise exception 'Stripe Customer already belongs to another payment tombstone';
    end;
  end if;

  user_id := tombstone_row.user_id;
  stripe_customer_id := tombstone_row.stripe_customer_id;
  return next;
end;
$$;

revoke all on function public.upsert_payment_account_tombstone(uuid, text)
  from public, anon, authenticated;
grant execute on function public.upsert_payment_account_tombstone(uuid, text)
  to service_role;
