-- STEP 3: Update exam order fields to support the new Order a Vet Exam requirements.
-- Run this after step-1 and step-2.

alter table public.exam_orders
  add column if not exists owner_ssn text,
  add column if not exists owner_address text,
  add column if not exists weight_kg numeric(8, 2),
  add column if not exists neuter_status text,
  add column if not exists reactive_status text;

-- Existing rows backfill so we can safely apply stricter constraints.
update public.exam_orders
set owner_ssn = coalesce(nullif(trim(owner_ssn), ''), 'UNKNOWN')
where owner_ssn is null or trim(owner_ssn) = '';

update public.exam_orders
set owner_phone = coalesce(nullif(trim(owner_phone), ''), 'UNKNOWN')
where owner_phone is null or trim(owner_phone) = '';

update public.exam_orders
set neuter_status = coalesce(nullif(trim(neuter_status), ''), 'unknown')
where neuter_status is null or trim(neuter_status) = '';

update public.exam_orders
set reactive_status = coalesce(nullif(trim(reactive_status), ''), 'not_reactive')
where reactive_status is null or trim(reactive_status) = '';

-- Species is now optional.
alter table public.exam_orders
  alter column species drop not null;

-- Owner phone and SSN must be present for new and existing records.
alter table public.exam_orders
  alter column owner_phone set not null,
  alter column owner_ssn set not null,
  alter column neuter_status set not null,
  alter column reactive_status set not null;

-- Domain constraints for enum-like fields and weight.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'exam_orders_neuter_status_check'
  ) then
    alter table public.exam_orders
      add constraint exam_orders_neuter_status_check
      check (neuter_status in ('neutered', 'not_neutered', 'unknown'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'exam_orders_reactive_status_check'
  ) then
    alter table public.exam_orders
      add constraint exam_orders_reactive_status_check
      check (reactive_status in ('reactive', 'not_reactive'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'exam_orders_weight_kg_check'
  ) then
    alter table public.exam_orders
      add constraint exam_orders_weight_kg_check
      check (weight_kg is null or weight_kg >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'exam_orders_owner_ssn_not_blank_check'
  ) then
    alter table public.exam_orders
      add constraint exam_orders_owner_ssn_not_blank_check
      check (length(trim(owner_ssn)) > 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'exam_orders_owner_phone_not_blank_check'
  ) then
    alter table public.exam_orders
      add constraint exam_orders_owner_phone_not_blank_check
      check (length(trim(owner_phone)) > 0);
  end if;
end $$;
