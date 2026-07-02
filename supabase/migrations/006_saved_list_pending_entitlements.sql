-- 006: Reconcile saved_list + pending_entitlements with application code.
--
-- Migration 001 shipped a `my_list` table, but the live application code
-- (app/api/saved-list, app/api/stripe/webhook, app/actions/auth,
-- app/api/auth/callback) reads/writes `saved_list` and `pending_entitlements`.
-- These tables exist in the production database but were never captured in a
-- migration. This file documents them so the schema is reproducible from
-- migrations alone. It is idempotent (create table if not exists) and safe to
-- run against the live database.

-- Saved list (shows a user has saved / auto-added on purchase).
-- Supersedes the legacy public.my_list table from 001. Columns match the
-- upserts in the webhook and saved-list route: user_id, series_slug, created_at
-- with onConflict (user_id, series_slug).
create table if not exists public.saved_list (
  user_id uuid not null references public.profiles(id) on delete cascade,
  series_slug text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, series_slug)
);

alter table public.saved_list enable row level security;

do $$ begin
  create policy "Users manage saved list" on public.saved_list
    for all using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

create index if not exists idx_saved_list_user
  on public.saved_list(user_id, created_at desc);

-- Pending entitlements: series a guest purchased before creating an account.
-- Keyed by email; claimed and deleted on sign-up / auth callback.
-- Columns match the webhook upsert (email, series_slug, purchase_id,
-- created_at) with onConflict (email, series_slug). Service-role only —
-- RLS enabled with no public policy (never read from the browser).
create table if not exists public.pending_entitlements (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  series_slug text not null,
  purchase_id uuid references public.purchases(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(email, series_slug)
);

alter table public.pending_entitlements enable row level security;

create index if not exists idx_pending_entitlements_email
  on public.pending_entitlements(email);
