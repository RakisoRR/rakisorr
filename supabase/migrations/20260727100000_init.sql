-- profiles, sections, bookmarks + RLS for personal bookmark sync
-- Run in Supabase SQL Editor (or via supabase db push)

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  url text not null,
  initials text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists sections_user_id_sort_idx on public.sections (user_id, sort_order);
create index if not exists bookmarks_user_id_sort_idx on public.bookmarks (user_id, sort_order);
create index if not exists bookmarks_section_id_idx on public.bookmarks (section_id);

alter table public.profiles enable row level security;
alter table public.sections enable row level security;
alter table public.bookmarks enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "sections_select_own" on public.sections;
drop policy if exists "sections_insert_own" on public.sections;
drop policy if exists "sections_update_own" on public.sections;
drop policy if exists "sections_delete_own" on public.sections;

create policy "sections_select_own" on public.sections
  for select using (auth.uid() = user_id);
create policy "sections_insert_own" on public.sections
  for insert with check (auth.uid() = user_id);
create policy "sections_update_own" on public.sections
  for update using (auth.uid() = user_id);
create policy "sections_delete_own" on public.sections
  for delete using (auth.uid() = user_id);

drop policy if exists "bookmarks_select_own" on public.bookmarks;
drop policy if exists "bookmarks_insert_own" on public.bookmarks;
drop policy if exists "bookmarks_update_own" on public.bookmarks;
drop policy if exists "bookmarks_delete_own" on public.bookmarks;

create policy "bookmarks_select_own" on public.bookmarks
  for select using (auth.uid() = user_id);
create policy "bookmarks_insert_own" on public.bookmarks
  for insert with check (auth.uid() = user_id);
create policy "bookmarks_update_own" on public.bookmarks
  for update using (auth.uid() = user_id);
create policy "bookmarks_delete_own" on public.bookmarks
  for delete using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
