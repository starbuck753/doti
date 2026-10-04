import test from 'node:test'
import assert from 'node:assert/strict'
import type { Habit, HabitCheck } from '../src/domain/models.ts'
import { getHabitsForDate, getLocalDateKey, isHabitCompletedForDate, isHabitScheduledForDate } from '../src/features/habits/habitUtils.ts'

const habit = (overrides: Partial<Habit> = {}): Habit => ({ id: 'h1', name: 'Read', icon: 'circle', color: 'neutral', frequency: 'daily', weekdays: [], createdAt: '2026-10-01T15:00:00.000Z', updatedAt: '2026-10-01T15:00:00.000Z', deletedAt: null, ...overrides })

test('daily habits are scheduled today and tomorrow from their creation day', () => {
  const daily = habit()
  assert.equal(isHabitScheduledForDate(daily, new Date(2026, 9, 1, 9)), true)
  assert.equal(isHabitScheduledForDate(daily, new Date(2026, 9, 2, 9)), true)
})

test('selected weekday habits only appear on selected days and never before creation', () => {
  const selected = habit({ frequency: 'weekdays', weekdays: [1, 3, 5] })
  assert.equal(isHabitScheduledForDate(selected, new Date(2026, 9, 5, 9)), true) // Monday
  assert.equal(isHabitScheduledForDate(selected, new Date(2026, 9, 6, 9)), false) // Tuesday
  assert.equal(isHabitScheduledForDate(habit({ createdAt: '2026-10-03T15:00:00.000Z' }), new Date(2026, 9, 2, 12)), false)
})

test('local date keys do not shift to UTC dates', () => {
  const localLateNight = new Date(2026, 9, 3, 23, 45)
  assert.equal(getLocalDateKey(localLateNight), '2026-10-03')
})

test('an active check means complete; a soft-deleted check means incomplete', () => {
  const check: HabitCheck = { id: 'c1', habitId: 'h1', date: '2026-10-03', createdAt: '', updatedAt: '', deletedAt: null }
  assert.equal(isHabitCompletedForDate([check], 'h1', '2026-10-03'), true)
  assert.equal(isHabitCompletedForDate([{ ...check, deletedAt: 'now' }], 'h1', '2026-10-03'), false)
})

test('stable list ordering is by creation timestamp and excludes deleted or unscheduled habits', () => {
  const items = [habit({ id: 'b', createdAt: '2026-10-02T00:00:00Z' }), habit({ id: 'a', createdAt: '2026-10-01T00:00:00Z' }), habit({ id: 'gone', deletedAt: 'now' })]
  assert.deepEqual(getHabitsForDate(items, new Date(2026, 9, 3)).map(({ id }) => id), ['a', 'b'])
})
