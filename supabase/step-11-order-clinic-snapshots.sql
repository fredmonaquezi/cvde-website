-- STEP 11: Snapshot clinic information on each order so old orders stay historically correct.

alter table public.exam_orders
  add column if not exists vet_clinic_name text,
  add column if not exists vet_clinic_address text,
  add column if not exists vet_professional_type text;

update public.exam_orders eo
set
  vet_clinic_name = coalesce(eo.vet_clinic_name, p.clinic_name),
  vet_clinic_address = coalesce(eo.vet_clinic_address, p.clinic_address),
  vet_professional_type = coalesce(eo.vet_professional_type, p.professional_type::text)
from public.profiles p
where eo.vet_id = p.id;
