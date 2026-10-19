import assert from 'node:assert/strict'
import test from 'node:test'
import { BirthdayNotificationScheduler, calculateBirthdayNotifications, type BirthdayNotificationDataSource } from '../src/notifications/birthdayNotificationScheduler.ts'
import type { Birthday, Settings } from '../src/domain/models.ts'
import type { BirthdayNotification, NotificationPermission, NotificationProvider } from '../src/notifications/notificationProvider.ts'
import { defaultSettings } from '../src/data/db.ts'
import { validateBackup } from '../src/features/backup/backupService.ts'

const birthday = (id: string, month: number, day: number, name = id): Birthday => ({ id, name, month, day, createdAt: '', updatedAt: '', deletedAt: null })
const settings = (patch: Partial<Settings> = {}): Settings => ({ ...defaultSettings, ...patch, birthdayNotifications: { ...defaultSettings.birthdayNotifications, ...patch.birthdayNotifications } })
const date = (year: number, month: number, day: number, hour = 0, minute = 0) => new Date(year, month - 1, day, hour, minute)
const schedule = (birthdays: Birthday[], prefs: Settings, now: Date) => calculateBirthdayNotifications(birthdays, prefs, now)

test('calculates birthday day, tomorrow, and seven-day offsets at local wall time', () => {
  const person = birthday('mario', 10, 20, 'Mario')
  const prefs = settings({ birthdayNotifications: { enabled: true, offsets: [0, 1, 7], time: '09:00' } })
  const reminders = schedule([person], prefs, date(2026, 10, 1))
  assert.deepEqual(reminders.map((item) => [item.at.getFullYear(), item.at.getMonth() + 1, item.at.getDate(), item.at.getHours()]), [[2026, 10, 13, 9], [2026, 10, 19, 9], [2026, 10, 20, 9], [2027, 10, 13, 9], [2027, 10, 19, 9], [2027, 10, 20, 9]])
  assert.equal(reminders[0]?.body, "It's Mario's birthday in 7 days.")
})

test('uses calendar arithmetic across December and January', () => {
  const reminders = schedule([birthday('newyear', 1, 3)], settings({ birthdayNotifications: { enabled: true, offsets: [7], time: '09:00' } }), date(2026, 12, 1))
  assert.deepEqual(reminders.map((item) => [item.at.getFullYear(), item.at.getMonth() + 1, item.at.getDate()]), [[2026, 12, 27], [2027, 12, 27]])
})

test('keeps the existing February 29 rule in leap and non-leap years', () => {
  const person = birthday('leap', 2, 29)
  const nonLeap = schedule([person], settings(), date(2025, 1, 1))
  const leapYear = schedule([person], settings(), date(2028, 1, 1))
  assert.deepEqual(nonLeap.map((item) => [item.at.getFullYear(), item.at.getMonth() + 1, item.at.getDate()]), [[2025, 2, 28]])
  assert.deepEqual(leapYear.map((item) => [item.at.getFullYear(), item.at.getMonth() + 1, item.at.getDate()]), [[2028, 2, 29]])
})

test('does not fire a same-day reminder after its selected local time has passed', () => {
  const reminders = schedule([birthday('today', 10, 20)], settings(), date(2026, 10, 20, 10, 30))
  assert.deepEqual(reminders.map((item) => [item.at.getFullYear(), item.at.getMonth() + 1, item.at.getDate()]), [[2027, 10, 20]])
})

class MemoryProvider implements NotificationProvider {
  supported = true
  permission: NotificationPermission = 'granted'
  pending: BirthdayNotification[] = []
  scheduleCalls = 0
  isSupported() { return this.supported }
  async getPermissionStatus() { return this.permission }
  async requestPermission() { return this.permission }
  async schedule(items: BirthdayNotification[]) { this.scheduleCalls++; this.pending.push(...items) }
  async cancel(ids: number[]) { this.pending = this.pending.filter((item) => !ids.includes(item.id)) }
  async getPending() { return this.pending }
  async addTapListener() { return { remove: async () => undefined } }
}

test('reconciliation is idempotent and responds to birthday, settings, language, and permission changes', async () => {
  let prefs = settings({ birthdayNotifications: { enabled: true, offsets: [0], time: '09:00' } })
  let birthdays = [birthday('ada', 5, 5, 'Ada')]
  const source: BirthdayNotificationDataSource = { getSettings: async () => prefs, getBirthdays: async () => birthdays }
  const provider = new MemoryProvider()
  const scheduler = new BirthdayNotificationScheduler(provider, source)

  await scheduler.reconcile()
  await scheduler.reconcile()
  assert.equal(provider.pending.length, 1)
  assert.equal(provider.scheduleCalls, 1)

  birthdays = [birthday('ada', 5, 6, 'Ada Lovelace')]
  await scheduler.reconcile()
  assert.equal(provider.pending.length, 1)
  assert.match(provider.pending[0]!.body, /Ada Lovelace/)

  prefs = settings({ language: 'es', birthdayNotifications: { enabled: true, offsets: [0], time: '10:15' } })
  await scheduler.reconcile()
  assert.equal(provider.pending[0]!.at.getHours(), 10)
  assert.match(provider.pending[0]!.body, /cumpleaños/)

  provider.permission = 'denied'
  await scheduler.reconcile()
  assert.equal(provider.pending.length, 0)
  assert.equal(prefs.birthdayNotifications.enabled, true)
  provider.permission = 'granted'
  prefs = settings({ birthdayNotifications: { enabled: true, offsets: [0], time: '10:15' } })
  await scheduler.reconcile()
  birthdays = []
  await scheduler.reconcile()
  assert.equal(provider.pending.length, 0)
  prefs = settings({ birthdayNotifications: { enabled: false, offsets: [0], time: '10:15' } })
  birthdays = [birthday('ada', 5, 6)]
  await scheduler.reconcile()
  assert.equal(provider.pending.length, 0)
})

test('keeps native local-hour values even when the local zone is offset from UTC', () => {
  const reminder = schedule([birthday('zone', 1, 2)], settings(), date(2026, 1, 1))[0]
  assert.equal(reminder?.at.getHours(), 9)
  assert.equal(reminder?.at.toString().includes('GMT'), true)
})

test('backup restore normalization supplies safe notification defaults and preserves selected preferences', () => {
  const base = { format: 'doti-backup', version: 1, exportedAt: '2026-10-15T00:00:00.000Z', data: { tasks: [], notes: [], birthdays: [], taskNoteLinks: [], settings: { id: 'app', language: 'en', theme: 'system', accentColor: 'green', priorityAgingEnabled: true, priorityAgingIntervalDays: 7 } } }
  const older = validateBackup(base)
  assert.deepEqual(older.data.settings.birthdayNotifications, { enabled: true, offsets: [0], time: '09:00' })
  const current = validateBackup({ ...base, data: { ...base.data, settings: { ...base.data.settings, birthdayNotifications: { enabled: false, offsets: [1, 7], time: '18:30' } } } })
  assert.deepEqual(current.data.settings.birthdayNotifications, { enabled: false, offsets: [1, 7], time: '18:30' })
})
