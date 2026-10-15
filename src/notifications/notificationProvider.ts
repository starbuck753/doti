export type NotificationPermission = 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale' | 'unsupported'

export interface BirthdayNotification {
  id: number
  title: string
  body: string
  at: Date
  extra: { dotiFeature: 'birthday'; key: string }
}

export interface NotificationProvider {
  isSupported(): boolean
  getPermissionStatus(): Promise<NotificationPermission>
  requestPermission(): Promise<NotificationPermission>
  schedule(notifications: BirthdayNotification[]): Promise<void>
  cancel(ids: number[]): Promise<void>
  getPending(): Promise<BirthdayNotification[]>
  addTapListener(listener: () => void): Promise<{ remove: () => Promise<void> }>
}
