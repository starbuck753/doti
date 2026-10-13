-- Doti Phase 13B: Habits synchronization.
-- Adds remote storage for Habits and HabitChecks and extends settings.
-- The browser only uses the public anon key. RLS is the data boundary.

-- Habit weekday representation: JSON array of integers (Sunday = 0 through Saturday = 6).
create table if not exists public.habits (
  user_id uuid not null references auth.users(id) on delete cascade,
  id uuid not null,
  name text not null,
  icon text not null check (icon in ('circle-checked-big', 'sparkles', 'sun', 'leaf', 'plant-pot', 'paw-print', 'footprints', 'dumbbell', 'biceps-flexed', 'heart', 'brain', 'bed', 'glass-water', 'coffee', 'apple', 'carrot', 'popcorn', 'shopping-cart', 'book-open-text', 'gamepad2', 'music', 'mail', 'notebook-pen', 'credit-card')),
  color text not null check (color in ('neutral', 'blue', 'purple', 'pink', 'green', 'orange', 'teal')),
  frequency text not null check (frequency in ('daily', 'weekdays')),
  weekdays jsonb not null default '[]'::jsonb check (jsonb_typeof(weekdays) = 'array'),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  server_updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- A HabitCheck is identified by its logical Habit + calendar date pair.
-- The `id` column preserves the original local UUID but the primary key is the
-- logical pair, which makes upserts idempotent across devices.
create table if not exists public.habit_checks (
  user_id uuid not null references auth.users(id) on delete cascade,
  id uuid not null,
  habit_id uuid not null,
  date text not null check (date ~ '^\d{4}-\d{2}-\d{2}$'),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  server_updated_at timestamptz not null default now(),
  primary key (user_id, habit_id, date),
  foreign key (user_id, habit_id) references public.habits(user_id, id) on delete cascade
);

-- Make HabitChecks on Dashboard a synchronized preference too.
alter table public.user_settings
  add column if not exists show_habits_on_dashboard boolean not null default true;

-- Indexes for incremental sync and relationship lookups.
create index if not exists habits_user_server_updated_at_idx on public.habits (user_id, server_updated_at);
create index if not exists habits_user_id_idx on public.habits (user_id);

create index if not exists habit_checks_user_server_updated_at_idx on public.habit_checks (user_id, server_updated_at);
create index if not exists habit_checks_habit_date_idx on public.habit_checks (habit_id, date);
create index if not exists habit_checks_user_habit_idx on public.habit_checks (user_id, habit_id);

drop trigger if exists habits_server_updated_at on public.habits;
create trigger habits_server_updated_at before update on public.habits for each row execute function public.set_server_updated_at();

drop trigger if exists habit_checks_server_updated_at on public.habit_checks;
create trigger habit_checks_server_updated_at before update on public.habit_checks for each row execute function public.set_server_updated_at();

drop trigger if exists settings_server_updated_at on public.user_settings;
create trigger settings_server_updated_at before update on public.user_settings for each row execute function public.set_server_updated_at();

-- Row Level Security
alter table public.habits enable row level security;
alter table public.habit_checks enable row level security;

create policy "Users can select their habits" on public.habits for select using (auth.uid() = user_id);
create policy "Users can insert their habits" on public.habits for insert with check (auth.uid() = user_id);
create policy "Users can update their habits" on public.habits for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their habits" on public.habits for delete using (auth.uid() = user_id);

create policy "Users can select their habit checks" on public.habit_checks for select using (auth.uid() = user_id);
create policy "Users can insert their habit checks" on public.habit_checks for insert with check (auth.uid() = user_id);
create policy "Users can update their habit checks" on public.habit_checks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their habit checks" on public.habit_checks for delete using (auth.uid() = user_id);
