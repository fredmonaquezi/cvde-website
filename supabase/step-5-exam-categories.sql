alter table public.exam_catalog
add column if not exists category text;

update public.exam_catalog
set category = 'Other Exams'
where category is null or btrim(category) = '';
