create table if not exists public.academy_sessions (
  id uuid primary key default gen_random_uuid(),
  guild_id text not null,
  department text not null,
  location text not null,
  stage text not null,
  timestamp_text text not null,
  host_discord_user_id text not null,
  host_display_name text not null,
  announcement_channel_id text not null,
  announcement_message_id text not null unique,
  created_by_discord_user_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists academy_sessions_guild_department_idx
  on public.academy_sessions (guild_id, department, created_at desc);

alter table public.academy_sessions enable row level security;
