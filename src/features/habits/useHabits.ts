import { useCallback, useEffect, useState } from 'react'
import type { Habit, HabitCheck } from '../../domain/models'
import { LOCAL_CHANGE_EVENT } from '../../sync/signals'
import { getLocalDateKey } from './habitUtils'
import { habitRepository } from './habitRepository'

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [checks, setChecks] = useState<HabitCheck[]>([])
  const refresh = useCallback(async () => {
    const date = getLocalDateKey()
    const [allHabits, todayChecks] = await Promise.all([habitRepository.list(), habitRepository.checksForDate(date)])
    setHabits(allHabits); setChecks(todayChecks)
  }, [])
  useEffect(() => {
    void refresh()
    const onChange = () => void refresh()
    const onResume = () => { if (document.visibilityState === 'visible') void refresh() }
    window.addEventListener(LOCAL_CHANGE_EVENT, onChange)
    window.addEventListener('focus', onResume)
    document.addEventListener('visibilitychange', onResume)
    return () => { window.removeEventListener(LOCAL_CHANGE_EVENT, onChange); window.removeEventListener('focus', onResume); document.removeEventListener('visibilitychange', onResume) }
  }, [refresh])
  return { habits, checks, refresh, addHabit: async (name: string) => { if (name.trim()) { await habitRepository.create(name); await refresh() } }, toggle: async (id: string) => { await habitRepository.toggle(id); await refresh() } }
}
