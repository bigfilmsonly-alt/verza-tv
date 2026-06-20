-- Push notification subscriptions for Web Push API
-- Run this in Supabase SQL Editor or via `supabase db push`

create table if not exists push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now()
);

-- Index for fast lookups by user (targeted push)
create index if not exists idx_push_subscriptions_user_id
  on push_subscriptions(user_id);

-- Index for fast lookups by endpoint (upsert / delete)
create index if not exists idx_push_subscriptions_endpoint
  on push_subscriptions(endpoint);

-- RLS: users can manage their own subscriptions, service role can manage all
alter table push_subscriptions enable row level security;

-- Allow authenticated users to read/insert/delete their own subscriptions
create policy "Users can view own push subscriptions"
  on push_subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can insert own push subscriptions"
  on push_subscriptions for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "Users can delete own push subscriptions"
  on push_subscriptions for delete
  using (auth.uid() = user_id);

-- Allow anonymous subscriptions (guest users without auth)
create policy "Anyone can insert anonymous push subscriptions"
  on push_subscriptions for insert
  with check (user_id is null);

create policy "Anyone can delete by endpoint"
  on push_subscriptions for delete
  using (user_id is null);
