-- Analytics event stream — the persisted source for product funnels
-- (clip -> install -> unlock; visit -> signup -> purchase) and D1/D7/D30
-- retention cohorts. Written server-side only (service role); clients post
-- to /api/events, which inserts here. No client-facing RLS policies.
--
-- Run this in Supabase SQL Editor or via `supabase db push`.

create table if not exists analytics_events (
  id              uuid primary key default gen_random_uuid(),
  event           text not null,
  -- Identity (text so we can store either an auth uid, an email, or an
  -- anonymous device id without coupling to auth.users).
  user_id         text,
  anon_id         text,
  session_id      text,
  platform        text not null default 'web',
  -- Content context
  show_id         text,
  episode_number  int,
  -- Money (server-verified events only)
  revenue_cents   int,
  currency        text,
  -- Attribution
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  campaign_id     text,
  clip_id         text,
  -- Everything else
  props           jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

-- Funnel + time-series scans
create index if not exists idx_analytics_events_event_created
  on analytics_events(event, created_at desc);
create index if not exists idx_analytics_events_created
  on analytics_events(created_at desc);

-- Per-identity rollups (retention cohorts, per-user funnels)
create index if not exists idx_analytics_events_user
  on analytics_events(user_id) where user_id is not null;
create index if not exists idx_analytics_events_anon
  on analytics_events(anon_id) where anon_id is not null;

-- Content + campaign attribution
create index if not exists idx_analytics_events_show
  on analytics_events(show_id) where show_id is not null;
create index if not exists idx_analytics_events_campaign
  on analytics_events(utm_campaign) where utm_campaign is not null;

-- RLS on, with NO policies: the anon/auth roles get zero access. Only the
-- service role (used by /api/events and the Stripe webhook) can read/write,
-- since it bypasses RLS. This keeps the raw event stream private.
alter table analytics_events enable row level security;
