alter table public.academy_sessions
  add column if not exists status text not null default 'scheduled';

alter table public.academy_sessions
  add column if not exists commencement_message_id text;

create table if not exists public.academy_trainee_discipline (
  id uuid primary key default gen_random_uuid(),
  guild_id text not null,
  trainee_discord_user_id text not null,
  trainee_display_name text not null,
  warning_points integer not null default 0,
  terminated_at timestamptz,
  last_updated_by_discord_user_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists academy_trainee_discipline_guild_trainee_idx
  on public.academy_trainee_discipline (guild_id, trainee_discord_user_id);

alter table public.academy_trainee_discipline enable row level security;

create table if not exists public.academy_trainee_discipline_logs (
  id uuid primary key default gen_random_uuid(),
  guild_id text not null,
  trainee_discord_user_id text not null,
  trainee_display_name text not null,
  moderator_discord_user_id text not null,
  moderator_display_name text not null,
  action text not null,
  warning_points_after integer not null default 0,
  log_thread_id text not null,
  log_message_id text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists academy_trainee_discipline_logs_guild_created_idx
  on public.academy_trainee_discipline_logs (guild_id, created_at desc);

alter table public.academy_trainee_discipline_logs enable row level security;
