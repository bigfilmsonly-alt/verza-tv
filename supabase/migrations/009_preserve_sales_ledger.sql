-- 009: Preserve the creator_sales financial ledger through account deletion.
--
-- creator_sales previously cascaded through BOTH creator_id and content_id.
-- Deleting a creator's account therefore deleted creator_content and silently
-- destroyed the platform's sales/tax records (gross amounts, revenue splits,
-- Stripe session ids). Preserve both references as nullable ledger context.

alter table public.creator_sales
  alter column creator_id drop not null;

alter table public.creator_sales
  alter column content_id drop not null;

alter table public.creator_sales
  drop constraint if exists creator_sales_creator_id_fkey;

alter table public.creator_sales
  add constraint creator_sales_creator_id_fkey
  foreign key (creator_id) references public.creators(id) on delete set null;

alter table public.creator_sales
  drop constraint if exists creator_sales_content_id_fkey;

alter table public.creator_sales
  add constraint creator_sales_content_id_fkey
  foreign key (content_id) references public.creator_content(id) on delete set null;
