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

Habits are a deliberately simple tracker. The optional Dashboard section
shows only today's scheduled habits in compact tinted rows. Tap anywhere on
a row to check or uncheck today's habit. Dashboard rows do not create, edit,
or open habits; **See all** opens `/habits`.

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
statistics.

When Supabase sync is enabled, Habits and HabitChecks are synchronized
between devices. Habit definitions and HabitChecks are independent; an
active HabitCheck means the habit was completed on that local calendar date,
and a soft-deleted HabitCheck means the completion was undone. HabitChecks
are logically unique by `user_id + habit_id + date`, so even if two devices
create a check for the same habit and date while offline, only one logical
completion remains after sync. Conflicts are resolved by `updated_at`, with
the later change winning.

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

Doti is local-first. Supabase is optional and used only as a
synchronization layer.

## PWA

Doti can be installed as a Progressive Web App on Windows and Android.

Core functionality works offline after installation/loading.

User data remains stored in IndexedDB.

## Android (Capacitor)

Android packages the same React/TypeScript app in a Capacitor WebView. It
uses the local `dist` bundle (`webDir: dist`); it does not load the GitHub
Pages site. `npm run build` remains the `/doti/` GitHub Pages/PWA build,
including its manifest and service worker. `npm run build:android` makes a
separate relative-asset build without PWA service-worker registration.

### Android development

Install Node.js 22+, Android Studio 2025.2.1 or newer, and Android SDK
Platform 36. Android Studio supplies the JDK required by Capacitor 8. Open
the Android project with `npm run android:open`.

Workflow after changing React code:

```sh
npm run android:sync   # build Android web assets and sync Capacitor plugins
npm run android:open   # open android/ in Android Studio
```

To build an installable debug APK:

```sh
npm run android:debug
```

The APK is written to
`android/app/build/outputs/apk/debug/app-debug.apk`. It can be installed from
Android Studio or with `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`.
Debug APKs use the development signing key managed by Gradle. A future store
release will need a private release keystore, kept outside the repository,
and a separately configured signed release build; neither is set up here.

Android package ID: `com.doti.app`. The project is under `android/`. Use the
four Doti priority colors on its navy launcher and splash screens. The native
app keeps data in its own WebView IndexedDB (`doti-db`); it does not share the
PWA's local database. To move between PWA and APK, sync the PWA to the same
Supabase account, then sign in to that account in Android. The existing
SyncEngine transfers data; signing into a new installation does not imply
that its local database is shared with the browser.

Android uses hash-based React Router URLs inside the WebView, leaving web
URLs unchanged. The system back button follows route history and returns to
Tasks before exiting. External web links open in an Android browser tab. The
status bar style follows Doti's light/dark setting, and the layout accounts
for system safe areas.

Email confirmation continues to open the existing GitHub Pages Doti URL.
After confirming, return to the app and sign in there; no native deep link is
required. Supabase uses only `VITE_SUPABASE_URL` and the public
`VITE_SUPABASE_ANON_KEY` at build time. Keep secrets out of Vite variables.
Offline edits remain local and the existing SyncEngine can upload them after
reconnection. JSON export uses Android's share sheet; import uses Android's
system file picker.

The current Android target supports the existing app, local IndexedDB,
Supabase email/password sign-in and sync, and backup/restore. It does not yet
include notifications, widgets, background sync, Google sign-in, Play Store
publishing, or release signing. Confirm behavior on a physical device or
emulator, especially Android keyboard, system bars, file picking/sharing,
authentication, and offline restart behavior.

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
3. Run `supabase/migrations/002_habits_sync.sql` in the Supabase SQL editor.
4. Copy the project URL and public anon/publishable key into a local `.env` using `.env.example`.
5. Add repository variables named `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under GitHub Settings → Secrets and variables → Actions → Variables.
6. In Supabase Authentication → URL Configuration, set the Site URL to `https://starbuck753.github.io/doti/` and add that same URL as an allowed redirect URL.
7. Push to `main` to build and deploy Doti with sync enabled.

Only the public anon key belongs in the browser build. Never add a Supabase service-role key to local Vite variables, GitHub Pages variables, or the repository.

## Future Ideas

Potential future features:

### Sync

Supabase sync now covers Tasks, Notes, Birthdays, Task/Note links, Settings,
Habits and HabitChecks. Future improvements could add more providers while
keeping the same local-first architecture.

### Android enhancements

Potential later work includes notifications, reminders, and home-screen
widgets; none are part of the current Android package.

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
