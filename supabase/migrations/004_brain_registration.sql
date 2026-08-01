alter table public.aw_student_profiles
  add column if not exists registered_in_brain boolean default false;
