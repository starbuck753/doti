alter table public.user_settings
  add column if not exists birthday_notifications_enabled boolean not null default true,
  add column if not exists birthday_notification_offsets jsonb not null default '[0]'::jsonb,
  add column if not exists birthday_notification_time text not null default '09:00';
