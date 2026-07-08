-- 008 reconcile live schema to match application code (Stripe webhook, auth actions, vip-server).
-- The stale migration files (001) diverged from the schema the code actually targets.
-- New project mmvbmrrwgludfmfalfcm is a fresh/empty start, so the purchases rebuild is safe.

-- 1) profiles: Stripe linkage columns the webhook + vip flows expect
alter table public.profiles add column if not exists stripe_customer_id text;
alter table public.profiles add column if not exists stripe_subscription_id text;
create unique index if not exists profiles_stripe_customer_id_key
  on public.profiles (stripe_customer_id) where stripe_customer_id is not null;

-- 2) entitlements: code upserts on (user_id, series_slug) with purchase_id + expires_at
alter table public.entitlements add column if not exists purchase_id uuid;
alter table public.entitlements add column if not exists expires_at timestamptz;
alter table public.entitlements
  drop constraint if exists entitlements_user_id_series_slug_episode_number_key;
create unique index if not exists entitlements_user_series_key
  on public.entitlements (user_id, series_slug);

-- 3) purchases: rebuild to the shape the Stripe webhook writes.
--    Drop the dependent FK first, rebuild, then restore it.
alter table public.pending_entitlements
  drop constraint if exists pending_entitlements_purchase_id_fkey;
drop table if exists public.purchases cascade;
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  type text,
  series_slug text,
  amount_cents integer,
  currency text default 'usd',
  status text,
  stripe_session_id text,
  stripe_payment_intent text,
  metadata jsonb,
  created_at timestamptz default now()
);
create index if not exists purchases_user_id_idx on public.purchases (user_id);
create index if not exists purchases_stripe_session_id_idx on public.purchases (stripe_session_id);
alter table public.purchases enable row level security;
drop policy if exists "purchases_select_own" on public.purchases;
create policy "purchases_select_own" on public.purchases
  for select using (auth.uid() = user_id);

-- restore FKs that reference purchases
alter table public.pending_entitlements
  add constraint pending_entitlements_purchase_id_fkey
  foreign key (purchase_id) references public.purchases(id) on delete set null;
alter table public.entitlements
  drop constraint if exists entitlements_purchase_id_fkey;
alter table public.entitlements
  add constraint entitlements_purchase_id_fkey
  foreign key (purchase_id) references public.purchases(id) on delete set null;

-- 4) auto-create a profiles row on signup (the app never inserts profiles itself;
--    the old working project had this trigger configured via the dashboard).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
