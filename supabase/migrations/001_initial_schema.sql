-- Parent accounts (one per Supabase auth user)
create table public.aw_parent_accounts (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  display_name text not null,
  created_at timestamptz default now() not null
);

-- Student profiles (children under a parent account)
create table public.aw_student_profiles (
  id uuid default gen_random_uuid() primary key,
  parent_id uuid references public.aw_parent_accounts(id) on delete cascade not null,
  display_name text not null,
  username text unique not null,
  username_approved boolean default false not null,
  age integer,
  avatar_data jsonb default '{}'::jsonb not null,
  avatar_approved boolean default false not null,
  xp integer default 0 not null,
  ade_coins integer default 100 not null,
  trading_enabled boolean default false not null,
  created_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.aw_parent_accounts enable row level security;
alter table public.aw_student_profiles enable row level security;

-- RLS: parent accounts
create policy "aw_parent_select_own"
  on public.aw_parent_accounts for select
  using (auth.uid() = id);

create policy "aw_parent_update_own"
  on public.aw_parent_accounts for update
  using (auth.uid() = id);

create policy "aw_parent_insert_own"
  on public.aw_parent_accounts for insert
  with check (auth.uid() = id);

-- RLS: student profiles
create policy "aw_parent_select_children"
  on public.aw_student_profiles for select
  using (parent_id = auth.uid());

create policy "aw_parent_insert_children"
  on public.aw_student_profiles for insert
  with check (parent_id = auth.uid());

create policy "aw_parent_update_children"
  on public.aw_student_profiles for update
  using (parent_id = auth.uid());

create policy "aw_parent_delete_children"
  on public.aw_student_profiles for delete
  using (parent_id = auth.uid());
