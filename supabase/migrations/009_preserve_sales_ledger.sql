-- 009: Preserve the creator_sales financial ledger through account deletion.
--
-- creator_sales.creator_id previously cascaded from creators, which cascades
-- from profiles — so deleting a creator's account silently destroyed the
-- platform's sales/tax records (gross amounts, revenue splits, stripe
-- session ids). Financial records must survive account deletion, as stated
-- in the privacy policy's retention carve-out.

alter table public.creator_sales
  alter column creator_id drop not null;

alter table public.creator_sales
  drop constraint if exists creator_sales_creator_id_fkey;

alter table public.creator_sales
  add constraint creator_sales_creator_id_fkey
  foreign key (creator_id) references public.creators(id) on delete set null;
