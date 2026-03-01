-- STEP 8: Add app settings table for the driver WhatsApp number.

create table if not exists public.app_settings (
  setting_key text primary key,
  setting_value text not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

drop policy if exists "app_settings_select_admin_only" on public.app_settings;
create policy "app_settings_select_admin_only"
on public.app_settings
for select
to authenticated
using (public.is_admin());

drop policy if exists "app_settings_insert_admin_only" on public.app_settings;
create policy "app_settings_insert_admin_only"
on public.app_settings
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "app_settings_update_admin_only" on public.app_settings;
create policy "app_settings_update_admin_only"
on public.app_settings
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "app_settings_delete_admin_only" on public.app_settings;
create policy "app_settings_delete_admin_only"
on public.app_settings
for delete
to authenticated
using (public.is_admin());
