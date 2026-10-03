# Doti

Doti is a minimal, local-first personal organizer for tasks, notes
and birthdays.

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

Tasks have no Description or Markdown content. Detailed information belongs in linked Notes.

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

### Settings

Current settings include:
- Theme: System / Light / Dark
- Accent Color
- Language: English / Spanish
- Priority Aging
- Aging Interval
- Show Habits on Dashboard (visibility only; data remains stored when hidden)

### Habits

Doti includes a simple local Habit tracker on the Dashboard. Habits can repeat every day or on selected weekdays. Dashboard visibility is optional, and hiding the section never removes habit data. Habit checks use the local calendar date. Habits are local-only in Phase 13A and are not included in Supabase Sync. No history screen, statistics, or streaks are included yet.

Internally, weekday numbers follow JavaScript's local convention: 0 is Sunday through 6 for Saturday. Weekday controls are presented Monday first.

### Backup & Restore

Doti supports full local JSON backups.

Backups include:
- Tasks
- Notes
- Birthdays
- Task/Note links
- Habits and Habit Checks
- Settings

Restore currently uses full replacement rather than merge.

## Dashboard

The Dashboard is task-focused.

Structure:

- Today
- Later
- Habits (optional Dashboard section)
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

Doti is local-first. Supabase Sync is optional for Tasks, Notes, Birthdays, and Settings; Habits and Habit Checks remain local-only until Phase 13B.

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

### Habits

Phase 13B will add optional Supabase synchronization for Habits and Habit Checks. A dedicated Habits destination may be considered later.

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
