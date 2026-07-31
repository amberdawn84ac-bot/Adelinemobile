-- Student memories (what Adeline knows about each kid)
create table if not exists public.aw_student_memories (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.aw_student_profiles(id) on delete cascade not null,
  key text not null,
  value text not null,
  updated_at timestamptz default now() not null,
  unique(student_id, key)
);

-- Life Map entries (logged real-world activities)
create table if not exists public.aw_life_map_entries (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.aw_student_profiles(id) on delete cascade not null,
  description text not null,
  tracks text[] not null default '{}',
  xp_awarded integer not null default 0,
  coins_awarded integer not null default 0,
  source text not null default 'chat_log',
  created_at timestamptz default now() not null
);

-- Season pass progress
create table if not exists public.aw_season_pass (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.aw_student_profiles(id) on delete cascade not null unique,
  season integer not null default 1,
  claimed_tiers integer[] not null default '{}',
  created_at timestamptz default now() not null
);
