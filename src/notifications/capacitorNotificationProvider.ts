import { Capacitor } from '@capacitor/core'
import { AppLauncher } from '@capacitor/app-launcher'
import { LocalNotifications } from '@capacitor/local-notifications'
import type { BirthdayNotification, NotificationPermission, NotificationProvider } from './notificationProvider'

/** Native-only adapter. Capacitor's web implementation is never invoked by Doti. */
export class CapacitorAndroidNotificationProvider implements NotificationProvider {
  isSupported() { return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android' }

  async getPermissionStatus(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'unsupported'
    return (await LocalNotifications.checkPermissions()).display
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'unsupported'
    return (await LocalNotifications.requestPermissions()).display
  }

  async openAndroidSettings() {
    if (this.isSupported()) await AppLauncher.openUrl({ url: 'com.android.settings' })
  }

  async schedule(notifications: BirthdayNotification[]) {
    if (!notifications.length || !this.isSupported()) return
    await LocalNotifications.schedule({ notifications: notifications.map((item) => ({ id: item.id, title: item.title, body: item.body, schedule: { at: item.at }, extra: item.extra, isExactNotification: false })) })
  }

  async cancel(ids: number[]) {
    if (!ids.length || !this.isSupported()) return
    await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) })
  }

  async getPending(): Promise<BirthdayNotification[]> {
    if (!this.isSupported()) return []
    const pending = await LocalNotifications.getPending()
    return pending.notifications.filter((item) => item.extra?.dotiFeature === 'birthday').map((item) => ({ id: item.id, title: item.title, body: item.body, at: item.schedule?.at ? new Date(item.schedule.at) : new Date(0), extra: item.extra }))
  }

  addTapListener(listener: () => void) {
    return LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      if (action.notification.extra?.dotiFeature === 'birthday') listener()
    })
  }
}
