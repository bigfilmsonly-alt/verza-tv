-- Series
create table public.series (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  logline text not null,
  genre text not null,
  channel text not null,
  episode_count int not null default 0,
  poster_url text,
  trailer_url text,
  free_episodes int not null default 5,
  coin_per_episode int not null default 49,
  season_pass_coins int,
  status text not null default 'live' check (status in ('live','coming_soon')),
  created_at timestamptz not null default now()
);

-- Episodes
create table public.episodes (
  id uuid primary key default gen_random_uuid(),
  series_slug text not null references public.series(slug),
  number int not null,
  title text not null,
  duration_s int not null default 90,
  video_id text,
  thumb_url text,
  is_free boolean not null default false,
  unlock_coins int not null default 49,
  clip_id text,
  captions_url text,
  created_at timestamptz not null default now(),
  unique(series_slug, number)
);

-- Users
create table public.users (
  id uuid primary key references auth.users(id),
  handle text unique,
  email text,
  coin_balance int not null default 0,
  vip_status text default null,
  created_at timestamptz not null default now()
);

-- Entitlements
create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  scope text not null check (scope in ('episode','season')),
  ref_id text not null,
  granted_at timestamptz not null default now()
);

-- Coin Ledger
create table public.coin_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  delta int not null,
  reason text not null check (reason in ('purchase','unlock','daily','referral','ad','bonus')),
  ref_id text,
  created_at timestamptz not null default now()
);

-- Purchases
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  provider text not null,
  amount int not null,
  coins int not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- Tickets
create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  device text,
  app_version text,
  screen text,
  severity text not null default 'medium',
  status text not null default 'open',
  body text not null,
  created_at timestamptz not null default now()
);

-- Uploads
create table public.uploads (
  id uuid primary key default gen_random_uuid(),
  uploader_id uuid not null references public.users(id),
  series_slug text,
  status text not null default 'pending' check (status in ('pending','processing','approved','rejected','live')),
  video_id text,
  created_at timestamptz not null default now()
);

-- Channels
create table public.channels (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  description text,
  avatar_url text,
  subscriber_count int not null default 0,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- Creators
create table public.creators (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  channel_id uuid references public.channels(id),
  display_name text not null,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_episodes_series on public.episodes(series_slug, number);
create index idx_series_channel on public.series(channel);
create index idx_series_genre on public.series(genre);
create index idx_series_status on public.series(status);
create index idx_entitlements_user on public.entitlements(user_id, ref_id);
create index idx_coin_ledger_user on public.coin_ledger(user_id);

-- RLS
alter table public.series enable row level security;
alter table public.episodes enable row level security;
alter table public.users enable row level security;
alter table public.entitlements enable row level security;
alter table public.coin_ledger enable row level security;
alter table public.purchases enable row level security;
alter table public.tickets enable row level security;
alter table public.uploads enable row level security;
alter table public.channels enable row level security;
alter table public.creators enable row level security;

-- Public read for catalog
create policy "series_public_read" on public.series for select using (true);
create policy "episodes_public_read" on public.episodes for select using (true);
create policy "channels_public_read" on public.channels for select using (true);
create policy "creators_public_read" on public.creators for select using (true);

-- Users read own data
create policy "users_read_own" on public.users for select using (auth.uid() = id);
create policy "entitlements_read_own" on public.entitlements for select using (auth.uid() = user_id);
create policy "coin_ledger_read_own" on public.coin_ledger for select using (auth.uid() = user_id);
create policy "purchases_read_own" on public.purchases for select using (auth.uid() = user_id);
create policy "tickets_read_own" on public.tickets for select using (auth.uid() = user_id);
create policy "uploads_read_own" on public.uploads for select using (auth.uid() = uploader_id);
