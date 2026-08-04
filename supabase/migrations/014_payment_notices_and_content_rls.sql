-- 014: Durable VIP consent/notice evidence and fail-closed content-table RLS.
--
-- Stripe Dashboard email toggles are not an application audit trail. Keep a
-- privacy-minimised record of the exact Checkout consent and every required
-- customer notice which the application sends. Email addresses are never
-- stored here; only a one-way SHA-256 digest is retained for reconciliation.

create table if not exists public.vip_checkout_consents (
  checkout_session_id text primary key,
  subscription_id text not null unique,
  stripe_customer_id text not null,
  user_id uuid references public.profiles(id) on delete set null,
  terms_version text not null,
  terms_accepted boolean not null,
  provider_session_created_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  constraint vip_checkout_consents_session_id_check
    check (checkout_session_id like 'cs\_%' escape '\'),
  constraint vip_checkout_consents_subscription_id_check
    check (subscription_id like 'sub\_%' escape '\'),
  constraint vip_checkout_consents_customer_id_check
    check (stripe_customer_id like 'cus\_%' escape '\'),
  constraint vip_checkout_consents_terms_version_check
    check (char_length(trim(terms_version)) between 1 and 100),
  constraint vip_checkout_consents_accepted_check
    check (terms_accepted)
);

alter table public.vip_checkout_consents enable row level security;
revoke all on table public.vip_checkout_consents from anon, authenticated;
grant select, insert, update, delete on table public.vip_checkout_consents
  to service_role;

create table if not exists public.payment_notices (
  id uuid primary key default gen_random_uuid(),
  notice_type text not null,
  provider_reference text not null,
  subscription_id text not null,
  user_id uuid references public.profiles(id) on delete set null,
  recipient_email_sha256 text not null,
  amount_cents integer not null,
  currency text not null default 'usd',
  period_end timestamptz,
  terms_version text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'sending',
  attempt_count integer not null default 1,
  send_started_at timestamptz not null default now(),
  sent_at timestamptz,
  provider_message_id text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_notices_type_check check (
    notice_type in (
      'vip_initial_acknowledgment',
      'vip_renewal_receipt',
      'vip_cancellation_confirmation',
      'vip_annual_renewal_reminder'
    )
  ),
  constraint payment_notices_reference_check
    check (char_length(trim(provider_reference)) between 1 and 255),
  constraint payment_notices_subscription_id_check
    check (subscription_id like 'sub\_%' escape '\'),
  constraint payment_notices_email_hash_check
    check (recipient_email_sha256 ~ '^[0-9a-f]{64}$'),
  constraint payment_notices_amount_check check (amount_cents >= 0),
  constraint payment_notices_currency_check check (currency ~ '^[a-z]{3}$'),
  constraint payment_notices_status_check check (
    status in ('sending', 'sent', 'failed', 'needs_review')
  ),
  constraint payment_notices_attempt_count_check check (attempt_count > 0),
  constraint payment_notices_sent_state_check check (
    (status = 'sent' and sent_at is not null and provider_message_id is not null)
    or (status <> 'sent' and sent_at is null)
  ),
  unique (notice_type, provider_reference)
);

create index if not exists payment_notices_subscription_idx
  on public.payment_notices (subscription_id, created_at desc);
create index if not exists payment_notices_attention_idx
  on public.payment_notices (status, updated_at)
  where status in ('failed', 'needs_review');

alter table public.payment_notices enable row level security;
revoke all on table public.payment_notices from anon, authenticated;
grant select, insert, update, delete on table public.payment_notices
  to service_role;

-- The original content migrations enabled RLS only on four of ten public
-- content tables. The application does not read the six tables below through
-- the Supabase client, so expose no direct anon/authenticated surface. Some
-- older live projects never created these optional tables; absence is already
-- fail-closed and must not prevent the payment migration from deploying.
do $content_rls$
declare
  table_name text;
begin
  foreach table_name in array array[
    'channels',
    'seasons',
    'show_people',
    'tags',
    'show_tags',
    'internal_links'
  ] loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format(
        'alter table public.%I enable row level security',
        table_name
      );
      execute format(
        'revoke all on table public.%I from anon, authenticated',
        table_name
      );
    end if;
  end loop;
end
$content_rls$;
