-- STEP 10: Add clinic address to vet profiles.

alter table public.profiles
  add column if not exists clinic_address text;
