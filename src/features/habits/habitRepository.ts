import { db } from '../../data/db'
import type { Habit, HabitCheck, HabitFrequency } from '../../domain/models'
import { getLocalDateKey, isHabitScheduledForDate } from './habitUtils'

const now = () => new Date().toISOString()
const newId = () => crypto.randomUUID()

export const habitRepository = {
  async list() {
    return (await db.habits.toArray()).filter((habit) => !habit.deletedAt).sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
  },
  async create(name: string) {
    const timestamp = now()
    const habit: Habit = { id: newId(), name: name.trim(), frequency: 'daily', weekdays: [], createdAt: timestamp, updatedAt: timestamp, deletedAt: null }
    await db.habits.add(habit)
    return habit
  },
  async update(habit: Habit, name: string, frequency: HabitFrequency, weekdays: number[]) {
    if (frequency === 'weekdays' && weekdays.length === 0) throw new Error('Select at least one weekday')
    const next = { ...habit, name: name.trim(), frequency, weekdays: frequency === 'daily' ? [] : [...new Set(weekdays)].sort(), updatedAt: now() }
    await db.habits.put(next)
    return next
  },
  async delete(habit: Habit) {
    const timestamp = now()
    await db.habits.put({ ...habit, deletedAt: timestamp, updatedAt: timestamp })
  },
  async checksForDate(date: string) {
    return db.habitChecks.where('date').equals(date).toArray().then((checks) => checks.filter((check) => !check.deletedAt))
  },
  async setChecked(habitId: string, date: string, checked: boolean): Promise<HabitCheck | undefined> {
    return db.transaction('rw', db.habits, db.habitChecks, async () => {
      const habit = await db.habits.get(habitId)
      const localDate = new Date(`${date}T12:00:00`)
      if (!habit || !isHabitScheduledForDate(habit, localDate)) return undefined
      const allChecks = await db.habitChecks.where('[habitId+date]').equals([habitId, date]).toArray()
      const active = allChecks.find((check) => !check.deletedAt)
      const timestamp = now()
      if (checked) {
        if (active) return active
        const check: HabitCheck = { id: newId(), habitId, date, createdAt: timestamp, updatedAt: timestamp, deletedAt: null }
        await db.habitChecks.add(check)
        return check
      }
      if (active) await db.habitChecks.put({ ...active, deletedAt: timestamp, updatedAt: timestamp })
      return undefined
    })
  },
}
