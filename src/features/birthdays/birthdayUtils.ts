import type { Birthday } from '../../domain/models'

function isLeapYear(year: number) { return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) }

function occurrenceForYear(birthday: Birthday, year: number) {
  const day = birthday.month === 2 && birthday.day === 29 && !isLeapYear(year) ? 28 : birthday.day
  return new Date(year, birthday.month - 1, day)
}

function dayNumber(date: Date) { return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000 }

export function getNextBirthday(birthday: Birthday, today = new Date()) {
  const currentDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  let occurrence = occurrenceForYear(birthday, currentDay.getFullYear())
  if (dayNumber(occurrence) < dayNumber(currentDay)) occurrence = occurrenceForYear(birthday, currentDay.getFullYear() + 1)
  return occurrence
}

export function getDaysUntilBirthday(birthday: Birthday, today = new Date()) {
  return Math.max(0, Math.round(dayNumber(getNextBirthday(birthday, today)) - dayNumber(new Date(today.getFullYear(), today.getMonth(), today.getDate()))))
}

export function sortBirthdaysByNextOccurrence(birthdays: Birthday[], today = new Date()) {
  return [...birthdays].sort((a, b) => getDaysUntilBirthday(a, today) - getDaysUntilBirthday(b, today) || a.name.localeCompare(b.name))
}

export function getBirthdayProximity(daysUntil: number) { return daysUntil === 0 ? 'today' : daysUntil <= 7 ? 'soon' : 'later' }

export function formatBirthdayDate(birthday: Birthday, locale: string, today = new Date()) {
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(getNextBirthday(birthday, today))
}
