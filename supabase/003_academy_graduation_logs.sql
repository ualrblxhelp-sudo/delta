create table if not exists public.academy_graduation_logs (
  id uuid primary key default gen_random_uuid(),
  guild_id text not null,
  department text not null,
  instructor_discord_user_id text not null,
  trainee_discord_user_id text not null,
  trainee_display_name text not null,
  log_thread_id text not null,
  log_message_id text not null unique,
  created_by_discord_user_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists academy_graduation_logs_guild_department_idx
  on public.academy_graduation_logs (guild_id, department, created_at desc);

alter table public.academy_graduation_logs enable row level security;
