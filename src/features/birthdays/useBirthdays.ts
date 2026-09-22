import { useCallback, useEffect, useState } from 'react'
import type { Birthday } from '../../domain/models'
import { birthdayRepository } from './birthdayRepository'
import { sortBirthdaysByNextOccurrence } from './birthdayUtils'

export function useBirthdays() {
  const [birthdays, setBirthdays] = useState<Birthday[]>([])
  const refresh = useCallback(async () => setBirthdays(sortBirthdaysByNextOccurrence(await birthdayRepository.list())), [])
  useEffect(() => { void refresh() }, [refresh])
  return {
    birthdays,
    refresh,
    addBirthday: async (name: string, month: number, day: number) => { await birthdayRepository.create(name, month, day); await refresh() },
    updateBirthday: async (birthday: Birthday, name: string, month: number, day: number) => { await birthdayRepository.update(birthday, { name, month, day }); await refresh() },
    deleteBirthday: async (birthday: Birthday) => { await birthdayRepository.delete(birthday); await refresh() },
  }
}
