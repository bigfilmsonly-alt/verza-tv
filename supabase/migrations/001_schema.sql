-- Verza TV — Core Schema

-- Users (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  coin_balance integer not null default 0,
  is_vip boolean not null default false,
  vip_expires_at timestamptz,
  streak_days integer not null default 0,
  streak_last_date date,
  language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Coin ledger (immutable append-only)
create table if not exists public.coin_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null, -- positive = credit, negative = debit
  reason text not null check (reason in ('purchase','unlock','season_pass','ad','daily','refund','admin')),
  reference_id text, -- stripe payment ID, episode slug, etc.
  balance_after integer not null,
  created_at timestamptz not null default now()
);

-- Entitlements (what episodes a user has unlocked)
create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  series_slug text not null,
  episode_number integer, -- null = season pass (all episodes)
  granted_at timestamptz not null default now(),
  unique(user_id, series_slug, episode_number)
);

-- Purchases (Stripe/IAP receipts)
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null check (provider in ('stripe','apple','google')),
  provider_id text not null unique, -- Stripe payment intent, Apple receipt, etc.
  product_type text not null check (product_type in ('coin_pack','season_pass','vip','merch')),
  product_id text not null,
  amount_cents integer not null,
  currency text not null default 'usd',
  status text not null default 'pending' check (status in ('pending','completed','refunded','failed')),
  created_at timestamptz not null default now()
);

-- Watch progress (continue watching)
create table if not exists public.watch_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  series_slug text not null,
  episode_number integer not null,
  progress_seconds integer not null default 0,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, series_slug, episode_number)
);

-- My List (saved shows)
create table if not exists public.my_list (
  user_id uuid not null references public.profiles(id) on delete cascade,
  series_slug text not null,
  added_at timestamptz not null default now(),
  primary key (user_id, series_slug)
);

-- Channels
create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  avatar_url text,
  banner_url text,
  subscriber_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- Support tickets
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  email text not null,
  subject text not null,
  body text not null,
  status text not null default 'open' check (status in ('open','in_progress','resolved','closed')),
  created_at timestamptz not null default now()
);

-- RLS policies
alter table public.profiles enable row level security;
alter table public.coin_ledger enable row level security;
alter table public.entitlements enable row level security;
alter table public.purchases enable row level security;
alter table public.watch_progress enable row level security;
alter table public.my_list enable row level security;
alter table public.tickets enable row level security;

-- Users can read/update their own profile
create policy "Users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

-- Users can read their own ledger
create policy "Users read own ledger" on public.coin_ledger for select using (auth.uid() = user_id);

-- Users can read their own entitlements
create policy "Users read own entitlements" on public.entitlements for select using (auth.uid() = user_id);

-- Users can read their own purchases
create policy "Users read own purchases" on public.purchases for select using (auth.uid() = user_id);

-- Users can CRUD their own watch progress
create policy "Users manage watch progress" on public.watch_progress for all using (auth.uid() = user_id);

-- Users can CRUD their own list
create policy "Users manage my list" on public.my_list for all using (auth.uid() = user_id);

-- Users can create tickets, read their own
create policy "Users create tickets" on public.tickets for insert with check (auth.uid() = user_id);
create policy "Users read own tickets" on public.tickets for select using (auth.uid() = user_id);

-- Indexes
create index if not exists idx_coin_ledger_user on public.coin_ledger(user_id, created_at desc);
create index if not exists idx_entitlements_user on public.entitlements(user_id, series_slug);
create index if not exists idx_watch_progress_user on public.watch_progress(user_id, updated_at desc);
create index if not exists idx_my_list_user on public.my_list(user_id, added_at desc);
