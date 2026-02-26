-- STEP 1: Authentication + Roles (vet_user and admin_user)
-- Run this in Supabase SQL Editor.

-- 1) Role enum
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('vet_user', 'admin_user');
  end if;
end $$;

-- 2) Profiles table (1 row per authenticated user)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.app_role not null default 'vet_user',
  created_at timestamptz not null default now()
);

-- 3) Helper function to check if current user is admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin_user'
  );
$$;

-- 4) Trigger function to auto-create profile on new signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    'vet_user'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- 4b) Backfill profiles for users that already exist
insert into public.profiles (id, full_name, role)
select
  u.id,
  nullif(trim(coalesce(u.raw_user_meta_data ->> 'full_name', '')), ''),
  'vet_user'
from auth.users u
on conflict (id) do nothing;

-- 5) RLS
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_admin()
);

drop policy if exists "profiles_insert_own_vet_row" on public.profiles;
create policy "profiles_insert_own_vet_row"
on public.profiles
for insert
to authenticated
with check (
  id = auth.uid()
  and role = 'vet_user'
);

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
  or public.is_admin()
)
with check (
  (id = auth.uid() and role = 'vet_user')
  or public.is_admin()
);

-- Optional: allow admin to delete profile rows
drop policy if exists "profiles_delete_admin_only" on public.profiles;
create policy "profiles_delete_admin_only"
on public.profiles
for delete
to authenticated
using (public.is_admin());
