-- 011: Least-privilege client access for account, payment, and creator data.
--
-- Supabase grants broad table privileges to `anon` and `authenticated` by
-- default. RLS still blocks rows without a matching policy, but table-level
-- UPDATE policies on profiles/creator records also exposed security-sensitive
-- columns. All privileged mutations already go through server routes using the
-- service role, so clients only need the narrow reads/writes granted below.

-- ---------------------------------------------------------------------------
-- 1. Profiles are created by handle_new_user() and privilege fields are
--    server-owned. Clients may read their row and edit presentation settings.
-- ---------------------------------------------------------------------------

drop policy if exists "Users insert own profile" on public.profiles;

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (display_name, avatar_url, language, updated_at)
  on table public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Payment records are server-written. Signed-in users only read their own
--    purchases/entitlements through the existing owner-scoped RLS policies.
-- ---------------------------------------------------------------------------

revoke all on table public.entitlements from anon, authenticated;
grant select on table public.entitlements to authenticated;

revoke all on table public.purchases from anon, authenticated;
grant select on table public.purchases to authenticated;

revoke all on table public.pending_entitlements from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Creator approval, publishing, pricing, playback IDs, and payout fields
--    are mutated only by authenticated server routes. Public direct reads of
--    creator content are limited to published FREE titles; paid creator video
--    remains fail-closed until its server-authorized playback path ships.
-- ---------------------------------------------------------------------------

drop policy if exists "Creators update own profile" on public.creators;
revoke all on table public.creators from anon, authenticated;
grant select on table public.creators to authenticated;

drop policy if exists "Creators update own content" on public.creator_content;
drop policy if exists "Public read published content" on public.creator_content;
drop policy if exists "Public read published free content" on public.creator_content;
create policy "Public read published free content" on public.creator_content
  for select to anon, authenticated
  using (
    (status = 'published' and pricing_type = 'free')
    or creator_id in (
      select id from public.creators where user_id = auth.uid()
    )
  );

revoke all on table public.creator_content from anon, authenticated;
grant select on table public.creator_content to anon, authenticated;

revoke all on table public.creator_sales from anon, authenticated;
grant select on table public.creator_sales to authenticated;

do $$ begin
  alter table public.creators
    add constraint creators_payout_split_range
    check (payout_split >= 0 and payout_split <= 1);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.creator_content
    add constraint creator_content_price_valid
    check (
      (pricing_type = 'free' and price_cents = 0)
      or (pricing_type = 'ppv' and price_cents > 0)
      or (pricing_type = 'premium' and price_cents >= 0)
    );
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.creator_sales
    add constraint creator_sales_amounts_valid
    check (
      amount_cents >= 0
      and creator_cents >= 0
      and platform_cents >= 0
      and creator_cents + platform_cents = amount_cents
    );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 4. Push endpoints and encryption keys are private server-side data. Both
--    subscribe and unsubscribe already use service-role API routes.
-- ---------------------------------------------------------------------------

drop policy if exists "Users can view own push subscriptions"
  on public.push_subscriptions;
drop policy if exists "Users can insert own push subscriptions"
  on public.push_subscriptions;
drop policy if exists "Users can delete own push subscriptions"
  on public.push_subscriptions;
drop policy if exists "Anyone can insert anonymous push subscriptions"
  on public.push_subscriptions;
drop policy if exists "Anyone can delete by endpoint"
  on public.push_subscriptions;
drop policy if exists "Anyone can subscribe" on public.push_subscriptions;
drop policy if exists "Users delete own subs" on public.push_subscriptions;
drop policy if exists "Users read own subs" on public.push_subscriptions;

revoke all on table public.push_subscriptions from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Creator beta applications remain write-only. A guest may submit only an
--    unowned row; a signed-in user may submit null or their own verified ID.
-- ---------------------------------------------------------------------------

create table if not exists public.creator_signups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  user_id uuid references auth.users(id) on delete set null,
  platform text,
  status text not null default 'pending'
);

alter table public.creator_signups enable row level security;

drop policy if exists "creator_signups_insert_any" on public.creator_signups;
drop policy if exists "creator_signups_insert_limited" on public.creator_signups;
create policy "creator_signups_insert_limited" on public.creator_signups
  for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

revoke all on table public.creator_signups from anon, authenticated;
grant insert (name, email, user_id, platform)
  on table public.creator_signups to anon, authenticated;

do $$ begin
  alter table public.creator_signups
    add constraint creator_signups_name_length
    check (char_length(trim(name)) between 2 and 100);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.creator_signups
    add constraint creator_signups_email_length
    check (char_length(trim(email)) between 3 and 320);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.creator_signups
    add constraint creator_signups_platform_valid
    check (platform is null or platform in ('ios', 'android', 'web'));
exception when duplicate_object then null; end $$;

-- The legacy feedback table has no current app caller. If it exists in an old
-- project, close its permissive direct-client surface without making fresh
-- installs depend on an undocumented table.
do $$ begin
  if to_regclass('public.feedback') is not null then
    execute 'drop policy if exists "Anyone can submit feedback" on public.feedback';
    execute 'drop policy if exists "Users read own feedback" on public.feedback';
    execute 'revoke all on table public.feedback from anon, authenticated';
  end if;
end $$;
