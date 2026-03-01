-- STEP 6: Make neutered/reactive optional and add the request_collection flag.
-- Run this after step-3.

alter table public.exam_orders
  add column if not exists request_collection boolean not null default false;

alter table public.exam_orders
  alter column neuter_status drop not null,
  alter column reactive_status drop not null;
