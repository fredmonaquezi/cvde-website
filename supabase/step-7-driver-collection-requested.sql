-- STEP 7: Track whether the admin has already asked the driver to collect.

alter table public.exam_orders
  add column if not exists driver_collection_requested boolean not null default false;
