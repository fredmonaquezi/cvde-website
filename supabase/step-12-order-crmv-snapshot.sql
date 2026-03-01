-- STEP 12: Snapshot vet CRMV on each order so the admin view remains historically correct.

alter table public.exam_orders
  add column if not exists vet_crmv_snapshot text;

update public.exam_orders eo
set vet_crmv_snapshot = coalesce(eo.vet_crmv_snapshot, p.crmv)
from public.profiles p
where eo.vet_id = p.id;
