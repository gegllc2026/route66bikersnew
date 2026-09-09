-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.

create table if not exists live_streams (
  channel    text primary key,
  title      text not null default 'Live now',
  host_name  text not null default '',
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Heartbeats upsert this row every ~15s. We want started_at to stay put after
-- the first insert (so viewers see how long someone's actually been live),
-- and only updated_at to move — this trigger enforces that regardless of
-- what the API sends on an UPDATE.
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

-- Lock the table down: only the server-side service_role key (used by
-- api/streams.js, never shipped to the browser) can read or write it.
alter table live_streams enable row level security;
