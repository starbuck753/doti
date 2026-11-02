import { Capacitor, registerPlugin } from '@capacitor/core'
import { db } from '../../data/db'
import { LOCAL_CHANGE_EVENT } from '../../sync/signals'
import { createBirthdayWidgetSnapshot } from './birthdayWidgetData'

export interface BirthdayWidgetItem { id: string; name: string; month: number; day: number }
interface WidgetSnapshot { birthdays: BirthdayWidgetItem[]; language: 'en' | 'es'; theme: 'system' | 'light' | 'dark'; accentColor: string }
interface BirthdayWidgetsPlugin {
  updateWidgetData(options: WidgetSnapshot): Promise<void>
  refreshWidgets(): Promise<void>
  getWidgetCapabilities(): Promise<{ supported: boolean; widgetTypes: string[] }>
  consumeWidgetRoute(): Promise<{ route?: string }>
}
const NativeBirthdayWidgets = registerPlugin<BirthdayWidgetsPlugin>('BirthdayWidgets')
export const WIDGET_DATA_CHANGE_EVENT = 'doti-widget-data-change'

export function notifyWidgetDataChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(WIDGET_DATA_CHANGE_EVENT))
}

async function createSnapshot(): Promise<WidgetSnapshot> {
  const [birthdays, stored] = await Promise.all([db.birthdays.toArray(), db.settings.get('app')])
  return createBirthdayWidgetSnapshot(birthdays, stored)
}

let queued = false
export async function syncBirthdayWidgetSnapshot() {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android' || queued) return
  queued = true
  try { await NativeBirthdayWidgets.updateWidgetData(await createSnapshot()) }
  catch (error) { console.warn('[Doti widgets] Snapshot update failed') }
  finally { queued = false }
}

export function startBirthdayWidgetSync() {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return () => undefined
  const refresh = () => void syncBirthdayWidgetSnapshot()
  window.addEventListener(LOCAL_CHANGE_EVENT, refresh)
  window.addEventListener(WIDGET_DATA_CHANGE_EVENT, refresh)
  document.addEventListener('visibilitychange', refresh)
  refresh()
  return () => {
    window.removeEventListener(LOCAL_CHANGE_EVENT, refresh)
    window.removeEventListener(WIDGET_DATA_CHANGE_EVENT, refresh)
    document.removeEventListener('visibilitychange', refresh)
  }
}

export async function consumeBirthdayWidgetRoute() {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return undefined
  return (await NativeBirthdayWidgets.consumeWidgetRoute()).route
}
