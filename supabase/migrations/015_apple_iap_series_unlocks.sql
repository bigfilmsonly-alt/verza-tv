-- 015: Apple StoreKit non-consumable series unlocks.
--
-- Apple and Stripe remain separate provider ledgers. A StoreKit transaction
-- can grant the existing account/series entitlement only after the backend has
-- cryptographically verified Apple's JWS and mapped its immutable product ID
-- to a canonical paid-live title. Refund/revocation processing is monotonic:
-- an older device transaction can never resurrect access after a newer Apple
-- event removed it.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.apple_iap_purchases (
  original_transaction_id text primary key,
  transaction_id text not null unique,
  user_id uuid references public.profiles(id) on delete set null,
  app_account_token_sha256 text not null,
  product_id text not null,
  series_slug text not null,
  environment text not null,
  status text not null,
  purchase_date timestamptz not null,
  signed_date timestamptz not null,
  revocation_date timestamptz,
  price_milliunits bigint,
  currency text,
  signed_transaction_sha256 text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint apple_iap_original_transaction_id_check
    check (original_transaction_id ~ '^[0-9]{1,64}$'),
  constraint apple_iap_transaction_id_check
    check (transaction_id ~ '^[0-9]{1,64}$'),
  constraint apple_iap_product_id_check
    check (
      char_length(product_id) between 1 and 100
      and product_id ~ '^[A-Za-z0-9._]+$'
    ),
  constraint apple_iap_series_slug_check
    check (series_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint apple_iap_environment_check
    check (environment in ('Production', 'Sandbox')),
  constraint apple_iap_status_check
    check (status in ('active', 'refunded', 'revoked')),
  constraint apple_iap_revocation_state_check
    check (
      (status = 'active' and revocation_date is null)
      or (status in ('refunded', 'revoked') and revocation_date is not null)
    ),
  constraint apple_iap_price_currency_check
    check (
      (price_milliunits is null and currency is null)
      or (
        price_milliunits is not null
        and price_milliunits >= 0
        and currency ~ '^[a-z]{3}$'
      )
    ),
  constraint apple_iap_signed_hash_check
    check (signed_transaction_sha256 ~ '^[0-9a-f]{64}$'),
  constraint apple_iap_account_token_hash_check
    check (app_account_token_sha256 ~ '^[0-9a-f]{64}$')
);

create index if not exists apple_iap_purchases_user_series_idx
  on public.apple_iap_purchases (user_id, series_slug, signed_date desc);
create index if not exists apple_iap_purchases_token_hash_idx
  on public.apple_iap_purchases (app_account_token_sha256);

alter table public.apple_iap_purchases enable row level security;
revoke all on table public.apple_iap_purchases from anon, authenticated;
-- Supabase may grant service_role table privileges through schema defaults.
-- Revoke first so this provider ledger is provably append/update-only.
revoke all on table public.apple_iap_purchases from service_role;
grant select, insert, update on table public.apple_iap_purchases
  to service_role;

alter table public.entitlements
  add column if not exists apple_original_transaction_id text;
alter table public.entitlements
  add column if not exists manual_grant boolean;

-- Before Apple sources exist, an entitlement without a Stripe purchase is a
-- deliberate manual/support grant. Preserve that independent source so an
-- Apple refund can never remove access that Apple did not grant.
update public.entitlements
  set manual_grant = true
  where manual_grant is null
    and purchase_id is null
    and apple_original_transaction_id is null;
update public.entitlements
  set manual_grant = false
  where manual_grant is null;
alter table public.entitlements
  alter column manual_grant set default false;
alter table public.entitlements
  alter column manual_grant set not null;

do $$ begin
  alter table public.entitlements
    add constraint entitlements_apple_original_transaction_id_fkey
    foreign key (apple_original_transaction_id)
    references public.apple_iap_purchases(original_transaction_id)
    on delete restrict;
exception
  when duplicate_object then null;
end $$;

alter table public.entitlements
  drop constraint if exists entitlements_single_payment_source_check;

create index if not exists entitlements_apple_original_transaction_idx
  on public.entitlements (apple_original_transaction_id)
  where apple_original_transaction_id is not null;

-- Existing Stripe refund/dispute functions predate multi-source access and
-- issue DELETE against the entitlement row. Convert that provider-specific
-- delete into clearing only purchase_id whenever a valid manual or Apple
-- source also exists. This preservation is unconditional: a provider event
-- can race an account-deletion attempt that later fails, so the temporary
-- deletion_requested_at guard is not authority to erase another source. The
-- only exception is the profile's actual successful FK cascade: at that point
-- the parent row is gone and every account-owned entitlement must disappear.
create or replace function public.preserve_non_stripe_entitlement_sources()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.purchase_id is not null
     and (old.manual_grant or old.apple_original_transaction_id is not null)
     and exists (
       select 1 from public.profiles as profile
         where profile.id = old.user_id
     ) then
    update public.entitlements as entitlement
      set purchase_id = null
      where entitlement.id = old.id;
    return null;
  end if;
  return old;
end;
$$;

revoke all on function public.preserve_non_stripe_entitlement_sources()
  from public, anon, authenticated;
grant execute on function public.preserve_non_stripe_entitlement_sources()
  to service_role;

drop trigger if exists preserve_non_stripe_entitlement_sources_on_delete
  on public.entitlements;
create trigger preserve_non_stripe_entitlement_sources_on_delete
  before delete on public.entitlements
  for each row execute function public.preserve_non_stripe_entitlement_sources();

-- Records one cryptographically verified Apple transaction and reconciles the
-- materialized entitlement in the same database transaction. The provider's
-- signed_date is the conflict clock, so late device retries cannot overwrite a
-- newer refund/revocation. Existing manual or Stripe entitlement sources are
-- never replaced or removed by Apple state.
create or replace function public.record_apple_series_transaction(
  p_transaction_id text,
  p_original_transaction_id text,
  p_transaction_app_account_token uuid,
  p_entitlement_user_id uuid,
  p_allow_orphan_rebind boolean,
  p_product_id text,
  p_series_slug text,
  p_environment text,
  p_status text,
  p_purchase_date timestamptz,
  p_signed_date timestamptz,
  p_revocation_date timestamptz,
  p_price_milliunits bigint,
  p_currency text,
  p_signed_transaction_sha256 text
)
returns table (
  purchase_active boolean,
  access_granted boolean,
  canonical_status text,
  account_rebound boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_purchase public.apple_iap_purchases%rowtype;
  canonical_purchase public.apple_iap_purchases%rowtype;
  incoming_token_sha256 text;
  effective_user_id uuid;
  profile_exists boolean := false;
  profile_is_active boolean := false;
  alternative_original_transaction_id text;
  incoming_status_rank integer;
  existing_status_rank integer;
  purchase_exists boolean := false;
begin
  account_rebound := false;
  if p_transaction_app_account_token is null
     or p_transaction_id !~ '^[0-9]{1,64}$'
     or p_original_transaction_id !~ '^[0-9]{1,64}$'
     or p_product_id !~ '^[A-Za-z0-9._]{1,100}$'
     or p_series_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
     or p_product_id <>
       'com.verzatv.app.series.' || replace(p_series_slug, '-', '_')
     or p_environment not in ('Production', 'Sandbox')
     or p_status not in ('active', 'refunded', 'revoked')
     or p_purchase_date is null
     or p_signed_date is null
     or p_signed_transaction_sha256 !~ '^[0-9a-f]{64}$'
     or (p_status = 'active' and p_revocation_date is not null)
     or (p_status in ('refunded', 'revoked') and p_revocation_date is null)
     or ((p_price_milliunits is null) <> (p_currency is null))
     or (p_price_milliunits is not null and p_price_milliunits < 0)
     or (p_currency is not null and p_currency !~ '^[a-z]{3}$') then
    raise exception 'Invalid Apple series transaction input';
  end if;

  incoming_token_sha256 := encode(
    extensions.digest(lower(p_transaction_app_account_token::text), 'sha256'),
    'hex'
  );
  incoming_status_rank := case p_status
    when 'active' then 0
    when 'revoked' then 1
    when 'refunded' then 2
  end;

  select *
    into existing_purchase
    from public.apple_iap_purchases as purchase
    where purchase.original_transaction_id = p_original_transaction_id
    for update;
  purchase_exists := found;

  if purchase_exists and (
    existing_purchase.app_account_token_sha256 is distinct from incoming_token_sha256
    or existing_purchase.product_id is distinct from p_product_id
    or existing_purchase.series_slug is distinct from p_series_slug
    or existing_purchase.environment is distinct from p_environment
  ) then
    raise exception 'Apple transaction identity conflict';
  end if;

  if purchase_exists then
    effective_user_id := existing_purchase.user_id;
    if p_entitlement_user_id is not null then
      if existing_purchase.user_id is null then
        if coalesce(p_allow_orphan_rebind, false) then
          effective_user_id := p_entitlement_user_id;
          account_rebound := true;
        else
          raise exception 'Orphaned Apple purchase requires explicit restore';
        end if;
      elsif existing_purchase.user_id is distinct from p_entitlement_user_id then
        raise exception 'Apple purchase belongs to another live account';
      end if;
    end if;
  else
    -- First recording must preserve the exact purchase-time binding. A
    -- different current user may reclaim only a pre-existing orphaned ledger
    -- row created before the prior profile was verifiably deleted.
    if p_entitlement_user_id is null
       or p_entitlement_user_id is distinct from p_transaction_app_account_token then
      raise exception 'Unregistered Apple purchase cannot be rebound';
    end if;
    effective_user_id := p_entitlement_user_id;
  end if;

  -- Lock the live target profile so deletion and an access grant cannot cross
  -- without observing the deletion_requested_at boundary.
  if effective_user_id is not null then
    select true, profile.deletion_requested_at is null
      into profile_exists, profile_is_active
      from public.profiles as profile
      where profile.id = effective_user_id
      for update;
    profile_exists := coalesce(profile_exists, false);
    profile_is_active := coalesce(profile_is_active, false);
  end if;

  if not purchase_exists then
    insert into public.apple_iap_purchases (
      original_transaction_id,
      transaction_id,
      user_id,
      app_account_token_sha256,
      product_id,
      series_slug,
      environment,
      status,
      purchase_date,
      signed_date,
      revocation_date,
      price_milliunits,
      currency,
      signed_transaction_sha256
    ) values (
      p_original_transaction_id,
      p_transaction_id,
      case when profile_exists then effective_user_id else null end,
      incoming_token_sha256,
      p_product_id,
      p_series_slug,
      p_environment,
      p_status,
      p_purchase_date,
      p_signed_date,
      p_revocation_date,
      p_price_milliunits,
      p_currency,
      p_signed_transaction_sha256
    );
  else
    existing_status_rank := case existing_purchase.status
      when 'active' then 0
      when 'revoked' then 1
      when 'refunded' then 2
    end;

    if p_signed_date > existing_purchase.signed_date
       or (
         p_signed_date = existing_purchase.signed_date
         and incoming_status_rank > existing_status_rank
       ) then
      update public.apple_iap_purchases as purchase
        set transaction_id = p_transaction_id,
            status = p_status,
            purchase_date = least(purchase.purchase_date, p_purchase_date),
            signed_date = p_signed_date,
            revocation_date = p_revocation_date,
            price_milliunits = coalesce(p_price_milliunits, purchase.price_milliunits),
            currency = coalesce(p_currency, purchase.currency),
            signed_transaction_sha256 = p_signed_transaction_sha256,
            updated_at = now()
        where purchase.original_transaction_id = p_original_transaction_id;
    end if;

    -- Account association is independent of the provider event clock. Only an
    -- explicit restore can attach an orphan. A deletion request gates access,
    -- but it must not orphan a purchase: the live FK remains until the profile
    -- is actually deleted, when ON DELETE SET NULL performs that transition.
    -- This lets a failed deletion recover after its guard is cleared.
    update public.apple_iap_purchases as purchase
      set user_id = case when profile_exists then effective_user_id else null end,
          updated_at = case
            when purchase.user_id is distinct from
              (case when profile_exists then effective_user_id else null end)
              then now()
            else purchase.updated_at
          end
      where purchase.original_transaction_id = p_original_transaction_id;
  end if;

  select *
    into canonical_purchase
    from public.apple_iap_purchases as purchase
    where purchase.original_transaction_id = p_original_transaction_id;

  if canonical_purchase.status = 'active'
     and profile_is_active
     and effective_user_id is not null then
    insert into public.entitlements as entitlement (
      user_id,
      series_slug,
      purchase_id,
      apple_original_transaction_id,
      manual_grant
    ) values (
      effective_user_id,
      p_series_slug,
      null,
      p_original_transaction_id,
      false
    )
    on conflict (user_id, series_slug) do update
      set apple_original_transaction_id = excluded.apple_original_transaction_id
      where entitlement.apple_original_transaction_id is distinct from
        excluded.apple_original_transaction_id;
  else
    update public.entitlements as entitlement
      set apple_original_transaction_id = null
      where entitlement.user_id = effective_user_id
        and entitlement.series_slug = p_series_slug
        and entitlement.apple_original_transaction_id = p_original_transaction_id;

    delete from public.entitlements as entitlement
      where entitlement.user_id = effective_user_id
        and entitlement.series_slug = p_series_slug
        and entitlement.purchase_id is null
        and entitlement.apple_original_transaction_id is null
        and entitlement.manual_grant = false;

    -- A user can change Apple Accounts. If a second independently verified
    -- non-consumable exists for this VERZA account/title, preserve access by
    -- linking that active purchase after this one is revoked.
    if profile_is_active and effective_user_id is not null then
      select purchase.original_transaction_id
        into alternative_original_transaction_id
        from public.apple_iap_purchases as purchase
        where purchase.user_id = effective_user_id
          and purchase.series_slug = p_series_slug
          and purchase.status = 'active'
        order by purchase.signed_date desc, purchase.original_transaction_id
        limit 1;

      if alternative_original_transaction_id is not null then
        insert into public.entitlements (
          user_id,
          series_slug,
          purchase_id,
          apple_original_transaction_id,
          manual_grant
        ) values (
          effective_user_id,
          p_series_slug,
          null,
          alternative_original_transaction_id,
          false
        ) on conflict (user_id, series_slug) do update
          set apple_original_transaction_id =
            excluded.apple_original_transaction_id;
      end if;
    end if;
  end if;

  purchase_active := canonical_purchase.status = 'active';
  select exists (
    select 1
      from public.entitlements as entitlement
      where entitlement.user_id = effective_user_id
        and entitlement.series_slug = p_series_slug
  ) and profile_is_active into access_granted;
  canonical_status := canonical_purchase.status;
  return next;
end;
$$;

revoke all on function public.record_apple_series_transaction(
  text, text, uuid, uuid, boolean, text, text, text, text,
  timestamptz, timestamptz,
  timestamptz, bigint, text, text
) from public, anon, authenticated;
grant execute on function public.record_apple_series_transaction(
  text, text, uuid, uuid, boolean, text, text, text, text,
  timestamptz, timestamptz,
  timestamptz, bigint, text, text
) to service_role;

create table if not exists public.apple_iap_notifications (
  notification_uuid uuid primary key,
  notification_type text not null,
  subtype text,
  environment text,
  original_transaction_id text,
  status text not null default 'processing',
  attempt_count integer not null default 1,
  last_error text,
  signed_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  processed_at timestamptz,
  constraint apple_iap_notifications_status_check
    check (status in ('processing', 'processed', 'failed')),
  constraint apple_iap_notifications_attempt_check
    check (attempt_count > 0),
  constraint apple_iap_notifications_environment_check
    check (environment is null or environment in ('Production', 'Sandbox'))
);

alter table public.apple_iap_notifications enable row level security;
revoke all on table public.apple_iap_notifications from anon, authenticated;
revoke all on table public.apple_iap_notifications from service_role;
grant select, insert, update on table public.apple_iap_notifications
  to service_role;

create or replace function public.claim_apple_iap_notification(
  p_notification_uuid uuid,
  p_notification_type text,
  p_subtype text,
  p_environment text,
  p_signed_date timestamptz
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  notification_row public.apple_iap_notifications%rowtype;
begin
  insert into public.apple_iap_notifications (
    notification_uuid,
    notification_type,
    subtype,
    environment,
    signed_date
  ) values (
    p_notification_uuid,
    p_notification_type,
    p_subtype,
    p_environment,
    p_signed_date
  ) on conflict (notification_uuid) do nothing;

  if found then return 'acquired'; end if;

  select * into notification_row
    from public.apple_iap_notifications as notification
    where notification.notification_uuid = p_notification_uuid
    for update;

  if notification_row.status = 'processed' then return 'processed'; end if;
  if notification_row.status = 'processing'
     and notification_row.updated_at >= now() - interval '10 minutes' then
    return 'busy';
  end if;

  update public.apple_iap_notifications as notification
    set status = 'processing',
        attempt_count = notification.attempt_count + 1,
        last_error = null,
        updated_at = now()
    where notification.notification_uuid = p_notification_uuid;
  return 'acquired';
end;
$$;

revoke all on function public.claim_apple_iap_notification(
  uuid, text, text, text, timestamptz
) from public, anon, authenticated;
grant execute on function public.claim_apple_iap_notification(
  uuid, text, text, text, timestamptz
) to service_role;

create or replace function public.finish_apple_iap_notification(
  p_notification_uuid uuid,
  p_status text,
  p_original_transaction_id text,
  p_last_error text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('processed', 'failed') then
    raise exception 'Invalid Apple notification terminal status';
  end if;

  update public.apple_iap_notifications as notification
    set status = p_status,
        original_transaction_id = p_original_transaction_id,
        last_error = left(p_last_error, 1000),
        processed_at = case when p_status = 'processed' then now() else null end,
        updated_at = now()
    where notification.notification_uuid = p_notification_uuid
      and notification.status = 'processing';
  return found;
end;
$$;

revoke all on function public.finish_apple_iap_notification(
  uuid, text, text, text
) from public, anon, authenticated;
grant execute on function public.finish_apple_iap_notification(
  uuid, text, text, text
) to service_role;
