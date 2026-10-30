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

The Android app can schedule local birthday notifications from Settings. It
supports the birthday day and optional reminders one or seven days earlier.
Dates and the selected time use the device's local calendar and time zone;
February 29 is observed on February 28 in non-leap years. If a reminder's
selected time has already passed today, Doti skips it for this year rather
than delivering it late.

Schedules are reconciled on app launch, foreground, local birthday/settings
changes, restore, and remote sync. Doti keeps a rolling 400-day window and
caps its own pending reminders at 450 to leave headroom for Android's pending
notification limits. Open Doti again before that window expires to extend
annual schedules. Android's reboot receiver restores pending notifications
after a device restart; if a reminder became overdue while the device was
powered off, the plugin may deliver it shortly after reboot. Force-stop, OEM
battery policies, revoked notification permission, or long periods without
reopening the app can still interrupt delivery. Delivery time is approximate;
Doti marks every notification inexact, so it does not invoke the exact-alarm
settings flow. The Local Notifications 8.3.1 Android library manifest does
declare `SCHEDULE_EXACT_ALARM`; inspect the merged APK manifest when building
Android and remove that declaration if it is not needed for the target release.
Android 13+ notification permission is requested only after an explicit action
in Settings. The PWA does not request or schedule browser notifications.

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
- Birthday notification preferences

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

## Deployment

Doti is deployed using GitHub Pages and GitHub Actions.

Pushes to the `main` production branch automatically trigger a production
build and deployment. The site is served at:

`https://starbuck753.github.io/doti/`

## Android Release Builds

Release APKs are built locally and include the web assets bundled into the APK. GitHub Pages and its PWA build remain separate.

### Required tools and configuration

- Node.js 22 (matching the GitHub Pages build), npm, Android SDK Platform 36 and Android SDK Build-Tools (including `apksigner` and `aapt`).
- Use JDK 25 to run the wrapper (or JDK 21). The Android Gradle Plugin remains 8.13.0 and Capacitor Android remains 8.5.3; the wrapper uses Gradle 9.1.0, which supports Java 25 and requires AGP 8.4 or newer. Capacitor's Android modules compile with Java 21; Gradle provisions that compiler toolchain into its own cache on first build, so no system JDK 21 installation is needed.
- Install Android SDK Platform 36 and Android SDK Build-Tools with `apksigner` and `aapt`. Android Studio's SDK Manager can install these components.
- Set `VITE_SUPABASE_URL` and the public `VITE_SUPABASE_ANON_KEY` in `.env` or the process environment. The release command validates that both are present and does not print their values. Never use a service-role or other privileged key; Vite embeds these public values in web assets inside the APK.

### Select Java once for this project

The Android scripts read `DOTI_JDK_HOME` from an ignored, project-local `.android-build.env` file before considering `JAVA_HOME`. Set it to a JDK 21 or 25 installation directory (the directory containing `bin/java.exe`), for example:

```text
DOTI_JDK_HOME=C:/path/to/your/jdk-21
```

Use forward slashes in this file on Windows. Builds set `JAVA_HOME` and put that JDK first on the child process `PATH`, so the system Java selection does not affect Doti. The preflight checks Java 21 or 25, Android SDK Platform 36, and required Build-Tools before Gradle starts. The Foojay resolver downloads the Java 21 compiler toolchain to Gradle's cache on first use. The file is ignored by Git and must not contain signing or Supabase credentials. Android Studio uses its own Gradle JDK setting: choose the same JDK in **Settings → Build, Execution, Deployment → Build Tools → Gradle** for IDE syncs. No system-wide environment change is required.

If a build reports an unsupported Gradle runtime Java version, set `DOTI_JDK_HOME` in `.android-build.env` to JDK 21 or 25; do not change the machine-wide `JAVA_HOME` for every build. If automatic Java 21 toolchain provisioning fails, check network access to Foojay/Adoptium and Gradle repositories. If the SDK is installed outside the usual location, set `ANDROID_SDK_ROOT` or configure `sdk.dir` in the ignored `android/local.properties` file. `JAVA_HOME` is used only as a fallback when the project-local setting is absent.

### Create and protect the permanent signing key

Generate the key once, choosing and securely storing your own passwords. From PowerShell in the project directory:

```powershell
keytool -genkeypair -v -keystore android/doti-release.keystore -storetype PKCS12 -keyalg RSA -keysize 3072 -validity 10000 -alias doti-release
Copy-Item android/keystore.properties.example android/keystore.properties
```

`keytool` prompts for passwords and certificate details. Never put passwords on the command line. Edit the ignored `android/keystore.properties` with those same values and keep the keystore and a secure backup in separate protected locations. Losing the key or changing it prevents future APKs from updating installs signed with the original key. Do not commit either file; `.gitignore` excludes them.

### Build, verify, and install

```powershell
npm run android:debug
npm run android:release
npm run android:verify
```

Both build commands validate the environment, build Android web assets, synchronize Capacitor, and run Gradle. Release also requires the existing private signing configuration and Supabase public build variables. Verification checks the APK signature against the configured release keystore, application ID, versionName, and DOTI_VERSION_CODE. Debug output: `android/app/build/outputs/apk/debug/app-debug.apk`. Release output: `android/app/build/outputs/apk/release/app-release.apk`. `npm run build` remains the regular web/PWA workflow.

To install manually, copy the APK to the Android device and open it to install. With a device connected and authorized for ADB:

```powershell
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

Do not install the first Release APK over the currently installed Debug APK: Android rejects the different signing certificate. Before migrating, use **Supabase → Sync Now**, export a JSON backup, and verify that the backup is safely stored outside Doti. Then uninstall the Debug app (which may delete its local IndexedDB data), install the signed Release APK, sign in to Supabase, sync, and verify data, notification permission, and birthday reminders. Restore the backup only if needed. Do not uninstall for normal Release-to-Release updates.

### Versioning and future updates

`package.json` is the source of the user-visible Android `versionName`; bump it when preparing a release. Increment `DOTI_VERSION_CODE` in `android/gradle.properties` for every APK release (currently `1`). Android requires every update's versionCode to be greater than the installed one. Then run `npm run android:release` and install the new APK over the existing Release app. Keep `com.doti.app`, the permanent signing key, Capacitor's bundled local origin, and compatible IndexedDB schema migrations stable. Normal app updates preserve app storage and Supabase's existing browser storage where Android retains it; this build process does not clear WebView data. Birthday schedules continue through the existing notification reconciliation on app launch/foreground and data changes.

The Android project remains openable in Android Studio. APKs, Android build outputs, local SDK settings, signing configuration, and keystores are ignored by Git; the Android source project is not.

To run Doti locally:

```sh
npm ci
npm run dev
```

## Supabase Sync Setup

1. Create a Supabase project.
2. Run `supabase/migrations/001_initial_sync_schema.sql` in the Supabase SQL editor.
3. Run `supabase/migrations/002_habits_sync.sql` in the Supabase SQL editor.
4. Run `supabase/migrations/003_birthday_notification_settings.sql` to add the shared reminder preferences to the existing Settings row.
5. Copy the project URL and public anon/publishable key into a local `.env` using `.env.example`.
6. Add repository variables named `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under GitHub Settings → Secrets and variables → Actions → Variables.
7. In Supabase Authentication → URL Configuration, set the Site URL to `https://starbuck753.github.io/doti/` and add that same URL as an allowed redirect URL.
8. Push to `main` to build and deploy Doti with sync enabled.

Only the public anon key belongs in the browser build. Never add a Supabase service-role key to local Vite variables, GitHub Pages variables, or the repository.

## Future Ideas

Potential future features:

### Sync

Supabase sync now covers Tasks, Notes, Birthdays, Task/Note links, Settings,
Habits and HabitChecks. Future improvements could add more providers while
keeping the same local-first architecture.

### Android

The Capacitor Android app supports local Birthday notifications. Task
reminders and home-screen widgets remain future ideas.

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
