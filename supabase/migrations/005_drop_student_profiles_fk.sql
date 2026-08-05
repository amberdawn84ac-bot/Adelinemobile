-- Students now live in the adeline-brain backend, not aw_student_profiles
-- (nothing has written to aw_student_profiles since the username+PIN auth
-- rewrite). Drop the now-dangling FK so life map / memory writes don't
-- silently fail against a table that's no longer populated.
alter table public.aw_life_map_entries drop constraint if exists aw_life_map_entries_student_id_fkey;
alter table public.aw_student_memories drop constraint if exists aw_student_memories_student_id_fkey;
