import test from 'node:test'
import assert from 'node:assert/strict'
import type { Birthday } from '../src/domain/models.ts'
import { formatBirthdayDate, getDaysUntilBirthday, getNextBirthday, sortBirthdaysByNextOccurrence } from '../src/features/birthdays/birthdayUtils.ts'
import { createBirthdayWidgetSnapshot } from '../src/features/birthdays/birthdayWidgetData.ts'

function birthday(id: string, month: number, day: number, name = id, deletedAt: string | null = null): Birthday {
  return { id, name, month, day, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', deletedAt }
}

test('next occurrence sorts across December and January and reports today/tomorrow', () => {
  const today = new Date(2026, 11, 31)
  const sorted = sortBirthdaysByNextOccurrence([birthday('jan', 1, 1), birthday('dec', 12, 31), birthday('later', 2, 1)], today)
  assert.deepEqual(sorted.map((item) => item.id), ['dec', 'jan', 'later'])
  assert.equal(getDaysUntilBirthday(birthday('dec', 12, 31), today), 0)
  assert.equal(getDaysUntilBirthday(birthday('jan', 1, 1), today), 1)
})

test('February 29 occurs on February 28 in non-leap years and February 29 in leap years', () => {
  const leap = birthday('leap', 2, 29)
  assert.equal(getNextBirthday(leap, new Date(2024, 1, 28)).getDate(), 29)
  assert.equal(getNextBirthday(leap, new Date(2025, 1, 27)).getDate(), 28)
  assert.equal(formatBirthdayDate(leap, 'en-US', new Date(2025, 1, 27)), 'Feb 28')
})

test('widget snapshot excludes deleted records and keeps only minimal localized data', () => {
  const snapshot = createBirthdayWidgetSnapshot([
    birthday('soon', 1, 2, 'Ana'), birthday('deleted', 1, 1, 'Hidden', '2026-01-01T00:00:00.000Z'),
  ], { id: 'app', language: 'es', theme: 'dark', accentColor: 'pink', priorityAgingEnabled: true, priorityAgingIntervalDays: 7, showHabitsOnDashboard: true, birthdayNotifications: { enabled: true, offsets: [], time: '09:00' }, updatedAt: '' })
  assert.deepEqual(snapshot, { birthdays: [{ id: 'soon', name: 'Ana', month: 1, day: 2 }], language: 'es', theme: 'dark', accentColor: 'pink' })
  assert.deepEqual(createBirthdayWidgetSnapshot([]).birthdays, [])
})
