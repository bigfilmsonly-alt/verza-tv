-- 007: Richer creator application intake.
--
-- The creator apply form now collects more up-front information so the review
-- team can evaluate applicants: a contact phone number, a preferred contact
-- email (distinct from the auth/payout email), a free-text pitch where the
-- applicant describes their idea, film, or films, and a link to their film
-- (Google Drive, Dropbox, or any shareable URL) so they can submit footage.
--
-- Idempotent (add column if not exists) and safe to run against the live
-- database. Existing rows get NULLs, which the code treats as "not provided".

alter table public.creators
  add column if not exists phone         text,
  add column if not exists contact_email text,
  add column if not exists project_pitch text,
  add column if not exists film_link     text;

comment on column public.creators.phone         is 'Applicant contact phone number (enrollment).';
comment on column public.creators.contact_email is 'Preferred contact email; may differ from auth/payout email.';
comment on column public.creators.project_pitch is 'Free-text: the creator describes their idea / film(s).';
comment on column public.creators.film_link     is 'Shareable link to the film (Google Drive, Dropbox, or URL).';
