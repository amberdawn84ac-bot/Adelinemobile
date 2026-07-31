alter table public.aw_student_profiles
  add column if not exists grade_level text default 'K-2';
