create table if not exists public.staff_flights (
  id uuid primary key default gen_random_uuid(),
  guild_id text not null,
  flight_type text not null,
  flight_number text not null,
  departure text not null,
  destination text not null,
  aircraft text not null,
  codeshares text,
  departure_gate text not null,
  arrival_gate text not null,
  briefing_timestamp_text text not null,
  check_in_timestamp_text text not null,
  announcement_channel_id text not null,
  announcement_message_id text not null unique,
  briefing_thread_id text not null unique,
  briefing_message_id text not null unique,
  created_by_discord_user_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists staff_flights_guild_created_idx
  on public.staff_flights (guild_id, created_at desc);

alter table public.staff_flights enable row level security;

create table if not exists public.staff_flight_allocations (
  id uuid primary key default gen_random_uuid(),
  flight_id uuid not null references public.staff_flights(id) on delete cascade,
  guild_id text not null,
  user_discord_id text not null,
  role_key text not null,
  role_name text not null,
  category_key text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists staff_flight_allocations_flight_user_idx
  on public.staff_flight_allocations (flight_id, user_discord_id);

create index if not exists staff_flight_allocations_flight_role_idx
  on public.staff_flight_allocations (flight_id, role_key);

alter table public.staff_flight_allocations enable row level security;
