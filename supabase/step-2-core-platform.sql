-- STEP 2: Core platform tables + RLS
-- Run this AFTER step-1-auth-and-roles.sql.

-- 1) Exam catalog (admin manages values)
create table if not exists public.exam_catalog (
  id bigint generated always as identity primary key,
  name text not null unique,
  description text,
  current_price numeric(10, 2) not null check (current_price >= 0),
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 2) Exam orders (vet creates, admin schedules/updates)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum ('requested', 'scheduled', 'in_progress', 'completed', 'cancelled');
  end if;
end $$;

create table if not exists public.exam_orders (
  id bigint generated always as identity primary key,
  vet_id uuid not null references public.profiles(id) on delete restrict,
  vet_name_snapshot text,
  vet_email_snapshot text,
  owner_name text not null,
  owner_phone text,
  owner_email text,
  patient_name text not null,
  species text not null,
  breed text,
  age_years integer check (age_years is null or age_years >= 0),
  sex text,
  clinical_notes text,
  selected_exams jsonb not null,
  total_value numeric(10, 2) not null check (total_value >= 0),
  status public.order_status not null default 'requested',
  scheduled_for timestamptz,
  admin_notes text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists exam_orders_vet_id_idx on public.exam_orders(vet_id);
create index if not exists exam_orders_status_idx on public.exam_orders(status);
create index if not exists exam_orders_created_at_idx on public.exam_orders(created_at desc);

-- 3) FAQ entries (admin manages, vets read)
create table if not exists public.faq_entries (
  id bigint generated always as identity primary key,
  question text not null,
  answer text not null,
  category text,
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 4) Enable RLS
alter table public.exam_catalog enable row level security;
alter table public.exam_orders enable row level security;
alter table public.faq_entries enable row level security;

-- 5) exam_catalog policies
drop policy if exists "exam_catalog_select_authenticated" on public.exam_catalog;
create policy "exam_catalog_select_authenticated"
on public.exam_catalog
for select
to authenticated
using (true);

drop policy if exists "exam_catalog_insert_admin_only" on public.exam_catalog;
create policy "exam_catalog_insert_admin_only"
on public.exam_catalog
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "exam_catalog_update_admin_only" on public.exam_catalog;
create policy "exam_catalog_update_admin_only"
on public.exam_catalog
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "exam_catalog_delete_admin_only" on public.exam_catalog;
create policy "exam_catalog_delete_admin_only"
on public.exam_catalog
for delete
to authenticated
using (public.is_admin());

-- 6) exam_orders policies
drop policy if exists "exam_orders_select_self_or_admin" on public.exam_orders;
create policy "exam_orders_select_self_or_admin"
on public.exam_orders
for select
to authenticated
using (
  vet_id = auth.uid()
  or public.is_admin()
);

drop policy if exists "exam_orders_insert_self_only" on public.exam_orders;
create policy "exam_orders_insert_self_only"
on public.exam_orders
for insert
to authenticated
with check (vet_id = auth.uid());

drop policy if exists "exam_orders_update_admin_only" on public.exam_orders;
create policy "exam_orders_update_admin_only"
on public.exam_orders
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "exam_orders_delete_admin_only" on public.exam_orders;
create policy "exam_orders_delete_admin_only"
on public.exam_orders
for delete
to authenticated
using (public.is_admin());

-- 7) faq_entries policies
drop policy if exists "faq_entries_select_authenticated" on public.faq_entries;
create policy "faq_entries_select_authenticated"
on public.faq_entries
for select
to authenticated
using (true);

drop policy if exists "faq_entries_insert_admin_only" on public.faq_entries;
create policy "faq_entries_insert_admin_only"
on public.faq_entries
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "faq_entries_update_admin_only" on public.faq_entries;
create policy "faq_entries_update_admin_only"
on public.faq_entries
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "faq_entries_delete_admin_only" on public.faq_entries;
create policy "faq_entries_delete_admin_only"
on public.faq_entries
for delete
to authenticated
using (public.is_admin());

-- 8) Seed starter exam catalog (safe to run more than once)
insert into public.exam_catalog (name, description, current_price)
values
  ('Complete Blood Count', 'Standard hematology panel.', 45.00),
  ('Biochemistry Panel', 'Kidney/liver and metabolic markers.', 70.00),
  ('Abdominal Ultrasound', 'Diagnostic abdominal imaging exam.', 120.00),
  ('Thorax X-Ray', 'Chest radiography with report.', 95.00),
  ('Urinalysis', 'Urine chemical and microscopic analysis.', 38.00)
on conflict (name) do update
set
  description = excluded.description,
  current_price = excluded.current_price,
  updated_at = now();

-- 9) Seed starter FAQ (safe to run more than once)
insert into public.faq_entries (question, answer, category)
values
  (
    'How quickly are exam requests scheduled?',
    'CVDE administration reviews new requests continuously during business hours and confirms scheduling directly in the platform.',
    'Scheduling'
  ),
  (
    'Can a vet user edit exam values?',
    'No. Exam values can only be changed by admin users to keep pricing consistent.',
    'Pricing'
  ),
  (
    'Who can access global exam history?',
    'Only admin users can access all clinics and all veterinarians history. Vet users can only access their own orders.',
    'Access Control'
  )
on conflict do nothing;
