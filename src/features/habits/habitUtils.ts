import type { Habit } from '../../domain/models'

// Weekdays use JavaScript's local convention: 0 = Sunday through 6 = Saturday.
export function getLocalDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isHabitScheduledForDate(habit: Habit, date: Date): boolean {
  const key = getLocalDateKey(date)
  if (habit.deletedAt || getLocalDateKey(new Date(habit.createdAt)) > key) return false
  return habit.frequency === 'daily' || habit.weekdays.includes(date.getDay())
}

export function getHabitsForDate(habits: Habit[], date: Date): Habit[] {
  return habits.filter((habit) => isHabitScheduledForDate(habit, date)).sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
}
