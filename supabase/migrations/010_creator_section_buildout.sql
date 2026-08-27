-- 010: Creator section buildout (Work Order #1) — data model + RLS.
--
-- EXTENDS the existing single `creators` table (which already serves as both the
-- application record AND the creator profile) rather than splitting into separate
-- `creator_applications` + `creator_profiles` tables. Rationale: the creator_sales
-- ledger FK, the RLS policies, and every pipeline endpoint already target
-- `creators.id`; splitting would duplicate + require a risky ledger-FK migration.
--
-- PII SAFETY: `creators` mixes public channel fields (handle, bio, avatar) with
-- private PII (payout_email, contact_email, phone, tax_country, stripe_account_id).
-- A Postgres RLS *row* policy cannot hide columns, so we deliberately DO NOT add a
-- public read policy here. The public Creators page reads published channels
-- SERVER-SIDE via the service-role client, selecting only safe columns — the same
-- pattern app/watch/[...slug] already uses for published creator_content.
--
-- Additive + idempotent. NOT yet applied to the live database (branch review pending).

-- ---------------------------------------------------------------------------
-- 1. Application lifecycle. Widen the status enums to the reviewed-application
--    flow and migrate legacy values: pending -> submitted, rejected -> declined.
--    draft -> submitted -> in_review -> (changes_requested -> back) -> approved | declined
-- ---------------------------------------------------------------------------
-- Order matters: DROP the old CHECK before UPDATEing to new values (otherwise the
-- still-attached old constraint rejects 'submitted'/'declined' and the migration fails).
alter table public.creators alter column status drop default;
alter table public.creators drop constraint if exists creators_status_check;
update public.creators set status = 'submitted' where status = 'pending';
update public.creators set status = 'declined'  where status = 'rejected';
alter table public.creators
  add constraint creators_status_check
  check (status in ('draft','submitted','in_review','changes_requested','approved','declined'));
alter table public.creators alter column status set default 'draft';

alter table public.profiles alter column creator_status drop default;
alter table public.profiles drop constraint if exists profiles_creator_status_check;
update public.profiles set creator_status = 'submitted' where creator_status = 'pending';
update public.profiles set creator_status = 'declined'  where creator_status = 'rejected';
alter table public.profiles
  add constraint profiles_creator_status_check
  check (creator_status in ('none','draft','submitted','in_review','changes_requested','approved','declined'));
alter table public.profiles alter column creator_status set default 'none';

-- ---------------------------------------------------------------------------
-- 2. Application intake fields (multi-step form Steps A-D). All nullable or
--    defaulted so a draft row is valid at any step (save-and-resume).
-- ---------------------------------------------------------------------------
alter table public.creators
  -- Step A: about you
  add column if not exists real_name             text,
  add column if not exists country               text,
  add column if not exists social_links          jsonb   not null default '{}'::jsonb,  -- {instagram,tiktok,youtube,imdb}
  -- Step B: your content
  add column if not exists content_types         text[]  not null default '{}',          -- microdrama|short_film|series|reality|music|other
  add column if not exists content_languages     text[]  not null default '{}',          -- feeds language tabs / World filter
  add column if not exists finished_titles       integer,
  add column if not exists content_links         text[]  not null default '{}',          -- provider-agnostic URLs (multi)
  add column if not exists total_runtime_minutes integer,
  add column if not exists sample_link           text,
  add column if not exists content_rating        text,                                    -- all_audiences .. mature
  -- Step C: rights & terms
  add column if not exists rights_attested       boolean not null default false,
  add column if not exists territory             text,                                    -- worldwide | specified
  add column if not exists territory_detail      text,
  add column if not exists exclusivity           text,                                    -- exclusive | non_exclusive
  add column if not exists agreement_accepted    boolean not null default false,
  add column if not exists agreement_version     text,
  -- Step D: payment readiness (NO raw bank/tax data; Stripe onboarding is post-approval)
  add column if not exists payout_preference     text,
  add column if not exists tax_country           text,
  add column if not exists payment_ack           boolean not null default false,
  -- Review workflow
  add column if not exists reviewer_notes        text,
  add column if not exists submitted_at          timestamptz,
  add column if not exists reviewed_at           timestamptz,
  add column if not exists current_step          smallint not null default 1,             -- save-and-resume cursor
  -- Stage 5: public channel profile
  add column if not exists banner_url            text,
  add column if not exists published             boolean not null default false,
  -- Stage 7: Stripe Connect payouts (columns ready; onboarding/transfers deferred)
  add column if not exists stripe_account_id     text,
  add column if not exists payouts_enabled       boolean not null default false;

-- Backfill content_links from the legacy single film_link (007) so nothing is lost.
update public.creators
  set content_links = array[film_link]
  where film_link is not null and film_link <> ''
    and (content_links is null or content_links = '{}');

-- ---------------------------------------------------------------------------
-- 3. RLS — posture unchanged: `creators` is OWNER + service-role(admin) only.
--    NO public read policy (a row policy cannot hide the PII columns). The
--    existing 005 policies "Creators read own profile" / "Creators update own
--    profile" remain in force. Public channel reads are server-mediated.
--
-- 3b. Column-level WRITE hardening. RLS cannot restrict columns, and the 005
--    owner-update policy (using auth.uid() = user_id) has no column guard, so
--    with the default table-level UPDATE grant an authenticated creator could
--    hit PostgREST directly with the public anon key and set status='approved'
--    (self-approve), published=true (self-publish), payout_split=1.0 (100%
--    payout), payouts_enabled / stripe_account_id, etc. 010 adds those very
--    columns, so we close it here: revoke the blanket UPDATE and grant UPDATE
--    only on creator-editable application/profile columns. status, published,
--    payout_split, payout_email, payouts_enabled, stripe_account_id,
--    reviewer_notes, submitted_at, reviewed_at, rejection_reason stay
--    service-role only (service_role bypasses these grants, so server writes
--    are unaffected). The app already performs all creator writes server-side.
-- ---------------------------------------------------------------------------
revoke update on public.creators from anon, authenticated;
grant update (
  handle, display_name, bio, avatar_url, banner_url, website, social, social_links,
  real_name, country, phone, contact_email, project_pitch, film_link,
  content_types, content_languages, finished_titles, content_links,
  total_runtime_minutes, sample_link, content_rating,
  rights_attested, territory, territory_detail, exclusivity,
  agreement_accepted, agreement_version,
  payout_preference, tax_country, payment_ack,
  current_step
) on public.creators to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Indexes for handle lookups + the public channels page.
-- ---------------------------------------------------------------------------
create index if not exists idx_creators_published on public.creators(published) where published = true;
create index if not exists idx_creators_handle    on public.creators(handle);
create index if not exists idx_creators_status    on public.creators(status);
