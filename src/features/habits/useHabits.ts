import { useCallback, useEffect, useState } from 'react'
import type { Habit, HabitCheck } from '../../domain/models'
import { habitRepository } from './habitRepository'
import { getLocalDateKey, getHabitsForDate } from './habitUtils'

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [checks, setChecks] = useState<HabitCheck[]>([])
  const [date, setDate] = useState(getLocalDateKey(new Date()))
  const refresh = useCallback(async () => {
    const today = getLocalDateKey(new Date())
    setDate(today)
    const [allHabits, todayChecks] = await Promise.all([habitRepository.list(), habitRepository.checksForDate(today)])
    setHabits(allHabits)
    setChecks(todayChecks)
  }, [])
  useEffect(() => {
    void refresh()
    const onResume = () => { if (document.visibilityState === 'visible') void refresh() }
    window.addEventListener('focus', onResume)
    document.addEventListener('visibilitychange', onResume)
    const timer = window.setInterval(() => { if (getLocalDateKey(new Date()) !== date) void refresh() }, 60_000)
    return () => { window.removeEventListener('focus', onResume); document.removeEventListener('visibilitychange', onResume); window.clearInterval(timer) }
  }, [refresh, date])
  return { habits: getHabitsForDate(habits, new Date(`${date}T12:00:00`)), allHabits: habits, checks, refresh, date }
}
