-- Verza TV — Content Tables (additive, does not touch live tables)
-- Apply once Supabase content access is granted: supabase db push

-- Shows (mirrors the code catalog)
create table if not exists public.shows (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  synopsis text not null default '',
  genre text[] not null default '{}',
  tags text[] not null default '{}',
  poster_url text not null default '',
  year integer not null default 2025,
  rating numeric(3,1) not null default 0,
  episode_count integer not null default 0,
  category text not null default 'drama' check (category in ('drama','new','popular','reality','music','red-carpet')),
  status text not null default 'live' check (status in ('live','coming_soon')),
  indexable boolean not null default true,
  created_at timestamptz not null default now()
);

-- Seasons
create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  show_slug text not null references public.shows(slug) on delete cascade,
  number integer not null default 1,
  episode_count integer not null default 0,
  unique(show_slug, number)
);

-- Episodes
create table if not exists public.episodes_content (
  id uuid primary key default gen_random_uuid(),
  show_slug text not null references public.shows(slug) on delete cascade,
  number integer not null,
  title text not null default '',
  synopsis text not null default '',
  duration_seconds integer not null default 0,
  mux_playback_id text not null default '',
  poster_url text not null default '',
  is_free boolean not null default false,
  unlock_coins integer not null default 49,
  transcript text,
  indexable boolean not null default true,
  created_at timestamptz not null default now(),
  unique(show_slug, number)
);

-- People
create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  role text not null default 'actor' check (role in ('actor','creator','host')),
  bio text,
  photo_url text
);

-- Show-People join
create table if not exists public.show_people (
  show_slug text not null references public.shows(slug) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  primary key (show_slug, person_id)
);

-- Tags
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text unique not null
);

-- Show-Tags join
create table if not exists public.show_tags (
  show_slug text not null references public.shows(slug) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (show_slug, tag_id)
);

-- Articles
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  body text not null default '',
  show_slugs text[] not null default '{}',
  tags text[] not null default '{}',
  published_at timestamptz not null default now(),
  indexable boolean not null default true
);

-- Internal links (for SEO link graph)
create table if not exists public.internal_links (
  id uuid primary key default gen_random_uuid(),
  source_slug text not null,
  target_slug text not null,
  anchor_text text not null default '',
  context text not null default ''
);

-- RLS: public read on published content, service role writes
alter table public.shows enable row level security;
alter table public.episodes_content enable row level security;
alter table public.people enable row level security;
alter table public.articles enable row level security;

create policy "Public read shows" on public.shows for select using (true);
create policy "Public read episodes" on public.episodes_content for select using (true);
create policy "Public read people" on public.people for select using (true);
create policy "Public read articles" on public.articles for select using (indexable = true);

-- Indexes
create index if not exists idx_shows_slug on public.shows(slug);
create index if not exists idx_shows_category on public.shows(category);
create index if not exists idx_shows_indexable on public.shows(indexable);
create index if not exists idx_episodes_show on public.episodes_content(show_slug, number);
create index if not exists idx_episodes_indexable on public.episodes_content(indexable);
create index if not exists idx_articles_slug on public.articles(slug);
