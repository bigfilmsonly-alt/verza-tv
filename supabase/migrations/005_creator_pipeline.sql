-- Verza TV — Creator Pipeline (UGC)
-- Additive. Does NOT touch the 76 curated series (lib/catalog.ts / mux-map.ts).
-- Creator content lives in its own table with creator_id ownership + RLS so a
-- creator can only ever see/edit their own rows. Revenue + the 80/20 split are
-- written server-side from the Stripe webhook only (service role).
--
-- Run in Supabase SQL Editor or `supabase db push`.

-- ---------------------------------------------------------------------------
-- 1. Role + approval on profiles
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists role text not null default 'viewer'
    check (role in ('viewer', 'creator', 'admin'));
alter table public.profiles
  add column if not exists creator_status text not null default 'none'
    check (creator_status in ('none', 'pending', 'approved', 'rejected'));

-- ---------------------------------------------------------------------------
-- 2. Creator profiles
-- ---------------------------------------------------------------------------
create table if not exists public.creators (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references public.profiles(id) on delete cascade,
  handle          text unique not null,                 -- @namespace for content slugs
  display_name    text not null default '',
  bio             text not null default '',
  avatar_url      text,
  website         text,
  social          text,
  -- Approval gate — a creator cannot reach the dashboard until approved.
  status          text not null default 'pending'
                    check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  -- Revenue share kept to the creator (platform takes the rest). Default 80%.
  payout_split    numeric(4,3) not null default 0.800,
  payout_email    text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. Creator content (one row per uploaded title)
-- ---------------------------------------------------------------------------
create table if not exists public.creator_content (
  id              uuid primary key default gen_random_uuid(),
  creator_id      uuid not null references public.creators(id) on delete cascade,
  -- Globally-unique public slug, namespaced by creator handle to prevent any
  -- collision with the curated catalog: e.g. "magenta-light/episode-one".
  slug            text unique not null,
  title           text not null default 'Untitled',
  description     text not null default '',
  category        text not null default 'creator'
                    check (category in ('microdrama','film','series','podcast','creator','other')),
  -- Mux pipeline ids
  mux_upload_id   text,                  -- direct-upload id (pre-asset)
  mux_asset_id    text,                  -- asset id (post-upload)
  mux_playback_id text,                  -- playback id (post-processing)
  aspect_ratio    text not null default '9:16' check (aspect_ratio in ('9:16','16:9')),
  duration_seconds integer not null default 0,
  poster_url      text not null default '',
  -- Lifecycle: draft -> uploading -> processing -> ready -> pending_review
  --            -> published | rejected
  status          text not null default 'draft'
                    check (status in ('draft','uploading','processing','ready',
                                      'pending_review','published','rejected')),
  rejection_reason text,
  -- Pricing — drives the viewer paywall for this title.
  pricing_type    text not null default 'free'
                    check (pricing_type in ('free','ppv','premium')),
  price_cents     integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  submitted_at    timestamptz,
  published_at    timestamptz
);

-- ---------------------------------------------------------------------------
-- 4. Creator sales — server-verified split ledger (one row per paid unlock)
--    Written ONLY by the Stripe webhook (service role). amount = gross from
--    Stripe; creator_cents + platform_cents are computed server-side.
-- ---------------------------------------------------------------------------
create table if not exists public.creator_sales (
  id                uuid primary key default gen_random_uuid(),
  content_id        uuid not null references public.creator_content(id) on delete cascade,
  creator_id        uuid not null references public.creators(id) on delete cascade,
  buyer_user_id     uuid references public.profiles(id) on delete set null,
  buyer_email       text,
  stripe_session_id text unique,
  amount_cents      integer not null default 0,          -- gross (Stripe-verified)
  creator_cents     integer not null default 0,          -- creator's share
  platform_cents    integer not null default 0,          -- platform's share
  currency          text not null default 'usd',
  status            text not null default 'completed'
                      check (status in ('completed','refunded')),
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 5. RLS
-- ---------------------------------------------------------------------------
alter table public.creators enable row level security;
alter table public.creator_content enable row level security;
alter table public.creator_sales enable row level security;

-- Creators: read/update only their own profile row.
create policy "Creators read own profile" on public.creators
  for select using (auth.uid() = user_id);
create policy "Creators update own profile" on public.creators
  for update using (auth.uid() = user_id);

-- Content: a creator sees/edits only their own rows; everyone can read
-- PUBLISHED content (so the viewer app can show it). Writes that matter
-- (status flips, mux ids, sales) go through the service role, which bypasses RLS.
create policy "Public read published content" on public.creator_content
  for select using (
    status = 'published'
    or creator_id in (select id from public.creators where user_id = auth.uid())
  );
create policy "Creators update own content" on public.creator_content
  for update using (
    creator_id in (select id from public.creators where user_id = auth.uid())
  );

-- Sales: a creator can read only their own sales; no client writes at all.
create policy "Creators read own sales" on public.creator_sales
  for select using (
    creator_id in (select id from public.creators where user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 6. Indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_creator_content_creator
  on public.creator_content(creator_id, created_at desc);
create index if not exists idx_creator_content_status
  on public.creator_content(status);
create index if not exists idx_creator_content_slug
  on public.creator_content(slug);
create index if not exists idx_creator_content_mux_asset
  on public.creator_content(mux_asset_id) where mux_asset_id is not null;
create index if not exists idx_creator_content_mux_upload
  on public.creator_content(mux_upload_id) where mux_upload_id is not null;
create index if not exists idx_creator_sales_creator
  on public.creator_sales(creator_id, created_at desc);
create index if not exists idx_creator_sales_content
  on public.creator_sales(content_id, created_at desc);
