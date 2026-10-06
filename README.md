# Doti

Doti is a minimal, local-first personal organizer for tasks, notes,
birthdays, and habits.

Its goal is to keep everyday organization simple while providing a few
smart features, such as automatic task priority aging.

## Core Principles

- Simple by default
- Local-first
- Mobile-first
- Minimal UI
- Complexity only when needed
- Tasks stay lightweight
- Notes contain the detailed information
- No project-management overhead

## Features

### Tasks

Tasks are intentionally simple.

A task contains:
- Title
- Today / Later
- Priority
- Optional due date
- Completion state
- Linked notes

Tasks do not contain descriptions or embedded notes. Additional information
belongs in Notes linked to the task.

If a task requires additional information, it can be linked to one or
more Notes.

#### Today / Later

Today means the task should currently be visible and actionable.

Later means the task should not be forgotten but does not need immediate
attention.

These buckets are independent from Due Date.

#### Priority

Four visual priority levels:

Green → Yellow → Orange → Red

Priority numbers are never shown in the UI.

Tasks are sorted by effective priority, highest first.

#### Priority Aging

When enabled, pending tasks automatically increase in priority after a
configurable number of days.

Changing a priority manually restarts the aging period.

Priority aging can be enabled/disabled and configured from Settings.

#### Completed Tasks

A task completed today remains visible at the bottom of its Today/Later
section.

On following days it disappears from the Dashboard but remains available
in Completed Tasks history.

Tasks can be restored from history.

### Notes

Notes contain Markdown content.

Features:
- Markdown Edit / Preview
- Search
- Task linking
- Local autosave
- Recently updated ordering

A Note may be linked to multiple Tasks and a Task may be linked to
multiple Notes.

### Birthdays

Birthdays are intentionally minimal.

A birthday contains only:
- Name
- Day
- Month

Birthdays are automatically ordered by their next occurrence.

Visual proximity:
- Today → pink/lilac
- Next 7 days → yellow
- Later → neutral

The Dashboard displays the next three birthdays.

### Habits

Habits are a deliberately simple, local-only tracker. The optional
Dashboard section shows only today's scheduled habits in compact tinted
rows. Tap anywhere on a row to check or uncheck today's habit. Dashboard
rows do not create, edit, or open habits; **See all** opens `/habits`.

The `/habits` page is where habits are created and managed. It shows a
read-only summary for the current Monday-to-Sunday week and a list of all
active habits. Select a habit to open `/habits/:id`, where its name, icon,
color, recurrence, and deletion can be managed.

Habits repeat every day or on selected weekdays (Sunday is weekday 0;
Monday is 1 through Saturday 6 internally). A habit starts on its local
creation date. Checks are stored by local calendar date and retained as
history when unchecked or when the habit is deleted. The weekly summary
respects each habit's schedule and creation date; future and inactive days
are not counted as missed. It has no historical navigation, streaks, or
statistics. Habit data is not synchronized in Phase 13A; Supabase support
is deferred to Phase 13B.

### Settings

Current settings include:
- Theme: System / Light / Dark
- Accent Color
- Language: English / Spanish
- Priority Aging
- Aging Interval
- Show Habits on Dashboard

### Backup & Restore

Doti supports full local JSON backups.

Backups include:
- Tasks
- Notes
- Birthdays
- Task/Note links
- Habits and HabitChecks
- Settings

Restore currently uses full replacement rather than merge.

## Dashboard

The Dashboard is task-focused.

Structure:

- Today
- Later
- Habits (optional, controlled in Settings)
- Upcoming Birthdays
- Bottom navigation

Tasks remain the primary content.

## Navigation

Current primary navigation:

Tasks
Birthdays
Notes

Settings and Completed Tasks are available from the Tasks overflow menu.

## Data Model

Main entities:

Task
Note
Birthday
TaskNoteLink
Habit
HabitCheck
Settings

Data is stored locally using IndexedDB through Dexie.

## Architecture

React
TypeScript
Vite
React Router
Dexie / IndexedDB
i18next
Markdown rendering
PWA

Doti is local-first and currently requires no backend.

## PWA

Doti can be installed as a Progressive Web App on Windows and Android.

Core functionality works offline after installation/loading.

User data remains stored in IndexedDB.

## Deployment

Doti is deployed using GitHub Pages and GitHub Actions.

Pushes to the `main` production branch automatically trigger a production
build and deployment. The site is served at:

`https://starbuck753.github.io/doti/`

To run Doti locally:

```sh
npm ci
npm run dev
```

## Supabase Sync Setup

1. Create a Supabase project.
2. Run `supabase/migrations/001_initial_sync_schema.sql` in the Supabase SQL editor.
3. Copy the project URL and public anon/publishable key into a local `.env` using `.env.example`.
4. Add repository variables named `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under GitHub Settings → Secrets and variables → Actions → Variables.
5. In Supabase Authentication → URL Configuration, set the Site URL to `https://starbuck753.github.io/doti/` and add that same URL as an allowed redirect URL.
6. Push to `main` to build and deploy Doti with sync enabled.

Only the public anon key belongs in the browser build. Never add a Supabase service-role key to local Vite variables, GitHub Pages variables, or the repository.

## Future Ideas

Potential future features:

### Sync

Future synchronization between Windows and Android.

The current local-first architecture is intentionally designed so a sync
layer can be added later.

### Android

Possible future Capacitor-based Android version with:
- Native notifications
- Birthday reminders
- Task reminders
- Home-screen widgets

## Product Philosophy

Doti is not intended to become a full project manager.

When deciding whether to add a feature, prefer the option that keeps the
everyday interface simple.

Tasks answer:

"What do I need to do?"

Notes answer:

"What information do I need?"

Birthdays answer:

"What important date is coming?"

Habits answer:

"What do I want to keep doing?"

## Non-Goals

Doti is currently not intended to provide:

- Projects
- Kanban boards
- Subtasks
- Complex tagging systems
- Team collaboration
- Rich-text documents
- Advanced habit gamification

Habits remain local-only until Phase 13B adds optional synchronization.
