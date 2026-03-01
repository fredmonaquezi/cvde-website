-- STEP 9: Track driver request time and sample receipt time for collection control.

alter table public.exam_orders
  add column if not exists driver_requested_at timestamptz,
  add column if not exists sample_received_at timestamptz;
