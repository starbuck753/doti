import type { Habit, HabitCheck } from '../../domain/models'

// Weekdays use JavaScript's local convention: Sunday = 0 through Saturday = 6.
export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isHabitScheduledForDate(habit: Habit, date: Date) {
  if (habit.deletedAt) return false
  if (getLocalDateKey(date) < getLocalDateKey(new Date(habit.createdAt))) return false
  return habit.frequency === 'daily' || habit.weekdays.includes(date.getDay())
}

export function getHabitsForDate(habits: Habit[], date: Date) {
  return habits.filter((habit) => isHabitScheduledForDate(habit, date)).sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
}

export function isHabitCompletedForDate(checks: HabitCheck[], habitId: string, date: string) {
  return checks.some((check) => check.habitId === habitId && check.date === date && !check.deletedAt)
}
