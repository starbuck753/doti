-- Doti Phase 12: optional local-first synchronization.
-- The browser only uses the public anon key. RLS is the data boundary.

create or replace function public.set_server_updated_at()
returns trigger
language plpgsql
security invoker
as $$
begin
  new.server_updated_at = now();
  return new;
end;
$$;

create table if not exists public.tasks (
  user_id uuid not null references auth.users(id) on delete cascade,
  id uuid not null,
  title text not null,
  status text not null check (status in ('active', 'completed', 'archived')),
  bucket text not null check (bucket in ('today', 'later')),
  priority_base integer not null check (priority_base between 1 and 4),
  priority_aging_started_at timestamptz not null,
  description text not null default '',
  due_date text,
  completed_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  server_updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.notes (
  user_id uuid not null references auth.users(id) on delete cascade,
  id uuid not null,
  title text not null,
  content text not null default '',
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  server_updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.birthdays (
  user_id uuid not null references auth.users(id) on delete cascade,
  id uuid not null,
  name text not null,
  month integer not null check (month between 1 and 12),
  day integer not null check (day between 1 and 31),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  server_updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.task_note_links (
  user_id uuid not null references auth.users(id) on delete cascade,
  id uuid not null,
  task_id uuid not null,
  note_id uuid not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  server_updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  id text not null default 'app' check (id = 'app'),
  language text not null check (language in ('en', 'es')),
  theme text not null check (theme in ('system', 'light', 'dark')),
  accent_color text not null check (accent_color in ('blue', 'purple', 'pink', 'green', 'orange', 'teal')),
  priority_aging_enabled boolean not null,
  priority_aging_interval_days integer not null check (priority_aging_interval_days > 0),
  updated_at timestamptz not null,
  server_updated_at timestamptz not null default now()
);

create index if not exists tasks_user_server_updated_at_idx on public.tasks (user_id, server_updated_at);
create index if not exists notes_user_server_updated_at_idx on public.notes (user_id, server_updated_at);
create index if not exists birthdays_user_server_updated_at_idx on public.birthdays (user_id, server_updated_at);
create index if not exists links_user_server_updated_at_idx on public.task_note_links (user_id, server_updated_at);
create index if not exists links_user_task_idx on public.task_note_links (user_id, task_id);
create index if not exists links_user_note_idx on public.task_note_links (user_id, note_id);

drop trigger if exists tasks_server_updated_at on public.tasks;
create trigger tasks_server_updated_at before update on public.tasks for each row execute function public.set_server_updated_at();
drop trigger if exists notes_server_updated_at on public.notes;
create trigger notes_server_updated_at before update on public.notes for each row execute function public.set_server_updated_at();
drop trigger if exists birthdays_server_updated_at on public.birthdays;
create trigger birthdays_server_updated_at before update on public.birthdays for each row execute function public.set_server_updated_at();
drop trigger if exists links_server_updated_at on public.task_note_links;
create trigger links_server_updated_at before update on public.task_note_links for each row execute function public.set_server_updated_at();
drop trigger if exists settings_server_updated_at on public.user_settings;
create trigger settings_server_updated_at before update on public.user_settings for each row execute function public.set_server_updated_at();

alter table public.tasks enable row level security;
alter table public.notes enable row level security;
alter table public.birthdays enable row level security;
alter table public.task_note_links enable row level security;
alter table public.user_settings enable row level security;

create policy "Users can select their tasks" on public.tasks for select using (auth.uid() = user_id);
create policy "Users can insert their tasks" on public.tasks for insert with check (auth.uid() = user_id);
create policy "Users can update their tasks" on public.tasks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their tasks" on public.tasks for delete using (auth.uid() = user_id);

create policy "Users can select their notes" on public.notes for select using (auth.uid() = user_id);
create policy "Users can insert their notes" on public.notes for insert with check (auth.uid() = user_id);
create policy "Users can update their notes" on public.notes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their notes" on public.notes for delete using (auth.uid() = user_id);

create policy "Users can select their birthdays" on public.birthdays for select using (auth.uid() = user_id);
create policy "Users can insert their birthdays" on public.birthdays for insert with check (auth.uid() = user_id);
create policy "Users can update their birthdays" on public.birthdays for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their birthdays" on public.birthdays for delete using (auth.uid() = user_id);

create policy "Users can select their links" on public.task_note_links for select using (auth.uid() = user_id);
create policy "Users can insert their links" on public.task_note_links for insert with check (auth.uid() = user_id);
create policy "Users can update their links" on public.task_note_links for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their links" on public.task_note_links for delete using (auth.uid() = user_id);

create policy "Users can select their settings" on public.user_settings for select using (auth.uid() = user_id);
create policy "Users can insert their settings" on public.user_settings for insert with check (auth.uid() = user_id);
create policy "Users can update their settings" on public.user_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their settings" on public.user_settings for delete using (auth.uid() = user_id);
