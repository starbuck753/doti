import type { Birthday, Settings } from '../../domain/models'
import { sortBirthdaysByNextOccurrence } from './birthdayUtils'
import type { BirthdayWidgetItem } from './birthdayWidgetBridge'

export interface BirthdayWidgetSnapshot {
  birthdays: BirthdayWidgetItem[]
  language: 'en' | 'es'
  theme: 'system' | 'light' | 'dark'
  accentColor: string
}

export function createBirthdayWidgetSnapshot(birthdays: Birthday[], settings?: Settings): BirthdayWidgetSnapshot {
  return {
    birthdays: sortBirthdaysByNextOccurrence(birthdays.filter((birthday) => !birthday.deletedAt)).map(({ id, name, month, day }) => ({ id, name, month, day })),
    language: settings?.language === 'es' ? 'es' : 'en',
    theme: settings?.theme ?? 'system',
    accentColor: settings?.accentColor ?? 'green',
  }
}
