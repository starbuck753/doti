import { db, defaultSettings } from '../data/db'
import type { Birthday, BirthdayNotificationSettings, Language, Settings } from '../domain/models'
import i18n from '../i18n'
import { CapacitorAndroidNotificationProvider } from './capacitorNotificationProvider'
import type { BirthdayNotification, NotificationPermission, NotificationProvider } from './notificationProvider'

export const BIRTHDAY_NOTIFICATION_CHANGE_EVENT = 'doti-birthday-notifications-changed'
export const BIRTHDAY_NOTIFICATION_TAP_EVENT = 'doti-birthday-notification-tap'
export const SCHEDULING_HORIZON_DAYS = 400
export const MAX_PENDING_BIRTHDAY_NOTIFICATIONS = 450
const offsetsAllowed = [0, 1, 7]

export interface BirthdayNotificationDataSource {
  getSettings(): Promise<Settings | undefined>
  getBirthdays(): Promise<Birthday[]>
}
const localDataSource: BirthdayNotificationDataSource = { getSettings: () => db.settings.get('app'), getBirthdays: () => db.birthdays.toArray() }

export function normalizeBirthdayNotificationSettings(value: unknown): BirthdayNotificationSettings {
  const record = value && typeof value === 'object' ? value as Partial<BirthdayNotificationSettings> : {}
  const offsets = Array.isArray(record.offsets) ? [...new Set(record.offsets.filter((offset): offset is number => offsetsAllowed.includes(offset)))] : [0]
  const time = typeof record.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(record.time) ? record.time : '09:00'
  return { enabled: typeof record.enabled === 'boolean' ? record.enabled : true, offsets, time }
}

function leap(year: number) { return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) }
function birthdayInYear(birthday: Birthday, year: number) {
  const day = birthday.month === 2 && birthday.day === 29 && !leap(year) ? 28 : birthday.day
  return new Date(year, birthday.month - 1, day)
}
function addCalendarDays(date: Date, days: number) { return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days) }
function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }
function setWallTime(date: Date, time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0)
}

function notificationText(language: Language, offset: number, name: string) {
  const suffix = offset === 0 ? 'today' : offset === 1 ? 'tomorrow' : 'sevenDays'
  return { title: i18n.t(`notifications.${suffix}Title`, { lng: language }), body: i18n.t(`notifications.${suffix}Body`, { lng: language, name }) }
}

function hashId(key: string) {
  let hash = 2166136261
  for (let index = 0; index < key.length; index++) hash = Math.imul(hash ^ key.charCodeAt(index), 16777619)
  return (hash >>> 0) & 0x7fffffff || 1
}

export function calculateBirthdayNotifications(birthdays: Birthday[], settings: Settings, now = new Date()): BirthdayNotification[] {
  const prefs = normalizeBirthdayNotificationSettings(settings.birthdayNotifications)
  if (!prefs.enabled || prefs.offsets.length === 0) return []
  const windowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + SCHEDULING_HORIZON_DAYS + 1)
  const wanted: Array<Omit<BirthdayNotification, 'id'>> = []
  for (const birthday of birthdays) {
    if (birthday.deletedAt) continue
    for (let year = now.getFullYear(); year <= now.getFullYear() + 2; year++) {
      const occurrence = birthdayInYear(birthday, year)
      for (const offset of prefs.offsets) {
        const at = setWallTime(addCalendarDays(occurrence, -offset), prefs.time)
        if (at <= now || at > windowEnd) continue
        const key = `${birthday.id}:${dateKey(occurrence)}:${offset}`
        const text = notificationText(settings.language, offset, birthday.name)
        wanted.push({ ...text, at, extra: { dotiFeature: 'birthday', key } })
      }
    }
  }
  wanted.sort((a, b) => a.at.getTime() - b.at.getTime() || a.extra.key.localeCompare(b.extra.key))
  const usedIds = new Set<number>()
  return wanted.slice(0, MAX_PENDING_BIRTHDAY_NOTIFICATIONS).map((item) => {
    let id = hashId(item.extra.key)
    while (usedIds.has(id)) id = id === 0x7fffffff ? 1 : id + 1
    usedIds.add(id)
    return { ...item, id }
  })
}

export class BirthdayNotificationScheduler {
  private running: Promise<void> | null = null
  private rerun = false
  private readonly provider: NotificationProvider
  private readonly dataSource: BirthdayNotificationDataSource
  constructor(provider: NotificationProvider, dataSource: BirthdayNotificationDataSource = localDataSource) {
    this.provider = provider
    this.dataSource = dataSource
  }

  isSupported() { return this.provider.isSupported() }
  getPermissionStatus() { return this.provider.getPermissionStatus() }
  requestPermission() { return this.provider.requestPermission() }
  openAndroidSettings() {
    const provider = this.provider as NotificationProvider & { openAndroidSettings?: () => Promise<void> }
    return provider.openAndroidSettings?.() ?? Promise.resolve()
  }

  reconcile() {
    if (this.running) { this.rerun = true; return this.running }
    this.running = (async () => {
      do { this.rerun = false; await this.reconcileNow() } while (this.rerun)
    })().finally(() => { this.running = null })
    return this.running
  }

  private async reconcileNow() {
    if (!this.provider.isSupported()) return
    const [stored, birthdays, permission, pending] = await Promise.all([this.dataSource.getSettings(), this.dataSource.getBirthdays(), this.provider.getPermissionStatus(), this.provider.getPending()])
    const settings = { ...defaultSettings, ...stored, birthdayNotifications: normalizeBirthdayNotificationSettings(stored?.birthdayNotifications) }
    const enabled = settings.birthdayNotifications.enabled && settings.birthdayNotifications.offsets.length > 0
    if (!enabled || permission !== 'granted') {
      await this.provider.cancel(pending.map((notification) => notification.id))
      return
    }
    const desired = calculateBirthdayNotifications(birthdays, settings)
    const byKey = new Map(desired.map((item) => [item.extra.key, item]))
    const pendingKeys = new Set<string>()
    const cancel: number[] = []
    for (const current of pending) {
      const key = current.extra?.key
      const wanted = typeof key === 'string' ? byKey.get(key) : undefined
      if (!wanted || wanted.id !== current.id || wanted.title !== current.title || wanted.body !== current.body || wanted.at.getTime() !== current.at.getTime() || pendingKeys.has(key!)) cancel.push(current.id)
      else pendingKeys.add(key!)
    }
    if (cancel.length) await this.provider.cancel(cancel)
    const add = desired.filter((item) => !pendingKeys.has(item.extra.key))
    if (add.length) await this.provider.schedule(add)
  }

  async start() {
    if (!this.provider.isSupported()) return () => undefined
    const tap = await this.provider.addTapListener(() => window.dispatchEvent(new Event(BIRTHDAY_NOTIFICATION_TAP_EVENT)))
    const reconcile = () => { void this.reconcile().catch((error) => console.error('[Doti notifications]', error)) }
    window.addEventListener(BIRTHDAY_NOTIFICATION_CHANGE_EVENT, reconcile)
    window.addEventListener('focus', reconcile)
    document.addEventListener('visibilitychange', reconcile)
    reconcile()
    return () => {
      window.removeEventListener(BIRTHDAY_NOTIFICATION_CHANGE_EVENT, reconcile)
      window.removeEventListener('focus', reconcile)
      document.removeEventListener('visibilitychange', reconcile)
      void tap.remove()
    }
  }
}

export const birthdayNotificationScheduler = new BirthdayNotificationScheduler(new CapacitorAndroidNotificationProvider())

export function notifyBirthdayNotificationDataChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(BIRTHDAY_NOTIFICATION_CHANGE_EVENT))
}

export type { NotificationPermission, NotificationProvider }
