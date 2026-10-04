import { db } from '../../data/db'
import type { Habit, HabitCheck, HabitColor, HabitFrequency, HabitIcon } from '../../domain/models'
import { notifyLocalChange } from '../../sync/signals'
import { getLocalDateKey } from './habitUtils'

const now = () => new Date().toISOString()

export const habitRepository = {
  async list() { return db.habits.toArray() },
  async get(id: string) { return db.habits.get(id) },
  async checksForDate(date = getLocalDateKey()) { return db.habitChecks.where('date').equals(date).toArray() },
  async create(name: string) {
    const timestamp = now()
    const habit: Habit = { id: crypto.randomUUID(), name: name.trim(), icon: 'circle-checked-big', color: 'neutral', frequency: 'daily', weekdays: [], createdAt: timestamp, updatedAt: timestamp, deletedAt: null }
    await db.habits.add(habit); notifyLocalChange(); return habit
  },
  async update(habit: Habit, changes: Partial<Pick<Habit, 'name' | 'icon' | 'color' | 'frequency' | 'weekdays'>>) {
    const updated = { ...habit, ...changes, weekdays: changes.weekdays ? [...changes.weekdays] : habit.weekdays, updatedAt: now() }
    await db.habits.put(updated); notifyLocalChange(); return updated
  },
  async delete(habit: Habit) { const timestamp = now(); const updated = { ...habit, deletedAt: timestamp, updatedAt: timestamp }; await db.habits.put(updated); notifyLocalChange(); return updated },
  async toggle(habitId: string, date = getLocalDateKey()) {
    await db.transaction('rw', db.habitChecks, async () => {
      const existing = await db.habitChecks.where('[habitId+date]').equals([habitId, date]).toArray()
      const active = existing.find((check) => !check.deletedAt)
      if (active) {
        const timestamp = now()
        await db.habitChecks.put({ ...active, deletedAt: timestamp, updatedAt: timestamp })
      } else {
        const timestamp = now()
        const deleted = existing[0]
        const check: HabitCheck = { id: deleted?.id ?? crypto.randomUUID(), habitId, date, createdAt: deleted?.createdAt ?? timestamp, updatedAt: timestamp, deletedAt: null }
        await db.habitChecks.put(check)
      }
    })
    notifyLocalChange()
  },
}

export type { HabitColor, HabitFrequency, HabitIcon }
