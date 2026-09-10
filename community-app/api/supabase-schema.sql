-- Run this in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run: every statement is idempotent (if-not-exists / drop-then-create).

-- ---------------------------------------------------------------------------
-- Accounts: profiles (one row per auth.users row, created automatically on
-- signup by the trigger below). role is 'biker' or 'fan' — only 'biker'
-- accounts are allowed to go live (enforced server-side in api/agora-token.js
-- and api/streams.js, not just hidden in the UI).
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null,
  handle     text not null,
  role       text not null check (role in ('biker', 'fan')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "Profiles are viewable by everyone" on profiles;
create policy "Profiles are viewable by everyone"
  on profiles for select
  using (true);

drop policy if exists "Users can insert their own profile" on profiles;
create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on profiles;
create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Auto-creates the profile row right after Supabase Auth creates the user,
-- pulling name/handle/role out of the signup metadata the app sends.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, handle, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Rider'),
    coalesce(new.raw_user_meta_data->>'handle', 'rider_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'role', 'fan')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- Live presence (from the earlier setup) — now with host_id so the API can
-- confirm whoever is heartbeating/ending a channel actually owns it.
-- ---------------------------------------------------------------------------
create table if not exists live_streams (
  channel    text primary key,
  title      text not null default 'Live now',
  host_name  text not null default '',
  host_id    uuid references profiles(id),
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table live_streams add column if not exists host_id uuid references profiles(id);

create or replace function live_streams_keep_started_at()
returns trigger as $$
begin
  new.started_at := old.started_at;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_live_streams_keep_started_at on live_streams;
create trigger trg_live_streams_keep_started_at
before update on live_streams
for each row execute function live_streams_keep_started_at();

-- Locked down: only the server-side service_role key (api/streams.js,
-- never shipped to the browser) reads/writes this table directly.
alter table live_streams enable row level security;
