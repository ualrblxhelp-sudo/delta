create extension if not exists pgcrypto;

create table if not exists public.guild_settings (
  id uuid primary key default gen_random_uuid(),
  discord_guild_id text not null unique,
  airline_name text not null default 'Delta Air Lines',
  staff_request_channel_id text,
  briefing_channel_id text,
  announcement_channel_id text,
  allocation_channel_id text,
  log_channel_id text,
  timezone text not null default 'America/New_York',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staff_members (
  id uuid primary key default gen_random_uuid(),
  discord_user_id text not null unique,
  roblox_user_id bigint,
  roblox_username text,
  display_name text,
  department text,
  staff_rank text,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.departures (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guild_settings(id) on delete cascade,
  flight_number text not null,
  route text not null,
  departure_time timestamptz not null,
  gate text,
  host_discord_user_id text,
  status text not null default 'scheduled' check (status in ('scheduled', 'boarding', 'departed', 'completed', 'cancelled')),
  briefing_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staff_allocations (
  id uuid primary key default gen_random_uuid(),
  departure_id uuid not null references public.departures(id) on delete cascade,
  staff_member_id uuid not null references public.staff_members(id) on delete cascade,
  position_name text not null,
  allocation_status text not null default 'assigned' check (allocation_status in ('assigned', 'checked_in', 'completed', 'removed')),
  assigned_by_discord_user_id text,
  assigned_at timestamptz not null default now(),
  notes text,
  unique (departure_id, staff_member_id, position_name)
);

create table if not exists public.briefing_sheets (
  id uuid primary key default gen_random_uuid(),
  departure_id uuid not null unique references public.departures(id) on delete cascade,
  title text not null,
  document_body jsonb not null default '{}'::jsonb,
  published_by_discord_user_id text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rank_bindings (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guild_settings(id) on delete cascade,
  roblox_group_id bigint not null,
  roblox_rank_id integer not null,
  roblox_rank_name text not null,
  discord_role_id text not null,
  created_at timestamptz not null default now(),
  unique (guild_id, roblox_group_id, roblox_rank_id),
  unique (guild_id, discord_role_id)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid references public.guild_settings(id) on delete cascade,
  actor_discord_user_id text,
  action_type text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_guild_settings_updated_at on public.guild_settings;
create trigger set_guild_settings_updated_at
before update on public.guild_settings
for each row
execute function public.set_updated_at();

drop trigger if exists set_staff_members_updated_at on public.staff_members;
create trigger set_staff_members_updated_at
before update on public.staff_members
for each row
execute function public.set_updated_at();

drop trigger if exists set_departures_updated_at on public.departures;
create trigger set_departures_updated_at
before update on public.departures
for each row
execute function public.set_updated_at();

drop trigger if exists set_briefing_sheets_updated_at on public.briefing_sheets;
create trigger set_briefing_sheets_updated_at
before update on public.briefing_sheets
for each row
execute function public.set_updated_at();

alter table public.guild_settings enable row level security;
alter table public.staff_members enable row level security;
alter table public.departures enable row level security;
alter table public.staff_allocations enable row level security;
alter table public.briefing_sheets enable row level security;
alter table public.rank_bindings enable row level security;
alter table public.audit_logs enable row level security;
