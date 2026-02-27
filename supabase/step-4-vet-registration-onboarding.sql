-- STEP 4: Vet first-login registration fields and onboarding flag.
-- Run this after step-1.

alter table public.profiles
  add column if not exists crmv text,
  add column if not exists ssn text,
  add column if not exists phone text,
  add column if not exists professional_type text,
  add column if not exists clinic_name text,
  add column if not exists registration_completed boolean not null default false;

-- Keep professional_type controlled.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_professional_type_check'
  ) then
    alter table public.profiles
      add constraint profiles_professional_type_check
      check (professional_type is null or professional_type in ('clinic', 'independent'));
  end if;
end $$;

-- Optional uniqueness safeguards for vets.
create unique index if not exists profiles_vet_crmv_unique
  on public.profiles (crmv)
  where role = 'vet_user' and crmv is not null;

create unique index if not exists profiles_vet_ssn_unique
  on public.profiles (ssn)
  where role = 'vet_user' and ssn is not null;

-- Admin users do not need vet onboarding form.
update public.profiles
set registration_completed = true
where role = 'admin_user';
