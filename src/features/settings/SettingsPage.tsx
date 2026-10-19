import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import { DotiBrand } from '../../app/DotiBrand'
import { useAppSettings } from '../../app/providers/AppSettingsProvider'
import type { AccentColor, Theme } from '../../domain/models'
import { APP_VERSION } from '../../app/version'
import { BackupValidationError, createBackup, downloadBackup, readBackupFile, restoreBackup } from '../backup/backupService'
import { DifferentAccountError, useSync } from '../../sync/SyncContext'
import { birthdayNotificationScheduler, type NotificationPermission } from '../../notifications/birthdayNotificationScheduler'

const accentColors: AccentColor[] = ['blue', 'purple', 'pink', 'green', 'orange', 'teal']
const intervals = [3, 7, 14, 30]

export function SettingsPage() {
  const { t, i18n } = useTranslation()
  const { language, theme, accentColor, priorityAgingEnabled, priorityAgingIntervalDays, showHabitsOnDashboard, birthdayNotifications, setShowHabitsOnDashboard, setBirthdayNotifications, setLanguage, setTheme, setAccentColor, setPriorityAgingEnabled, setPriorityAgingIntervalDays } = useAppSettings()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const { isConfigured, user, status: syncStatus, lastSyncedAt, error: syncError, signIn, signUp, signOut, syncNow } = useSync()
  const [syncEmail, setSyncEmail] = useState('')
  const [syncPassword, setSyncPassword] = useState('')
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null)
  const notificationsSupported = birthdayNotificationScheduler.isSupported()
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'checking'>(notificationsSupported ? 'checking' : 'unsupported')
  const [requestingNotificationPermission, setRequestingNotificationPermission] = useState(false)
  useEffect(() => {
    if (!notificationsSupported) return
    const refreshPermission = () => { void birthdayNotificationScheduler.getPermissionStatus().then(setNotificationPermission).catch(() => setNotificationPermission('denied')) }
    refreshPermission()
    window.addEventListener('focus', refreshPermission)
    return () => window.removeEventListener('focus', refreshPermission)
  }, [notificationsSupported])
  const changeNotificationPermission = async () => {
    setRequestingNotificationPermission(true)
    try { setNotificationPermission(await birthdayNotificationScheduler.requestPermission()) }
    catch { setNotificationPermission('denied') }
    finally { setRequestingNotificationPermission(false); void birthdayNotificationScheduler.reconcile() }
  }
  const toggleBirthdayOffset = (offset: number) => {
    const offsets = birthdayNotifications.offsets.includes(offset) ? birthdayNotifications.offsets.filter((value: number) => value !== offset) : [...birthdayNotifications.offsets, offset].sort((a: number, b: number) => a - b)
    setBirthdayNotifications({ ...birthdayNotifications, offsets })
  }
  const themeOptions: { value: Theme; label: string }[] = [{ value: 'system', label: t('settings.system') }, { value: 'light', label: t('settings.light') }, { value: 'dark', label: t('settings.dark') }]
  const exportData = async () => { try { downloadBackup(await createBackup()); setFeedback({ type: 'success', text: t('settings.exportSuccess') }) } catch { setFeedback({ type: 'error', text: t('settings.exportError') }) } }
  const importData = async (event: { target: HTMLInputElement }) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const backup = await readBackupFile(file)
      if (!window.confirm(t('settings.restoreConfirm'))) return
      try { await restoreBackup(backup); setFeedback({ type: 'success', text: t('settings.restoreSuccess') }); window.setTimeout(() => window.location.reload(), 350) } catch { setFeedback({ type: 'error', text: t('settings.restoreError') }) }
    } catch (error) {
      if (error instanceof BackupValidationError && error.code === 'newer') setFeedback({ type: 'error', text: t('settings.newerBackup') })
      else setFeedback({ type: 'error', text: t('settings.invalidBackup') })
    }
  }
  const submitSync = async (action: 'signIn' | 'signUp') => {
    try { const result = await (action === 'signIn' ? signIn(syncEmail.trim(), syncPassword) : signUp(syncEmail.trim(), syncPassword)); setSyncPassword(''); setSyncFeedback(result.needsEmailConfirmation ? t('sync.checkEmail') : t(action === 'signUp' ? 'sync.accountCreated' : 'sync.synced')) } catch (error) { setSyncFeedback(error instanceof DifferentAccountError ? t('sync.differentAccount') : t('sync.invalidCredentials')) }
  }
  const lastSyncedLabel = lastSyncedAt ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(lastSyncedAt)) : t('sync.never')
  return <section className="settings-page"><div className="tasks-page-heading"><div><p className="eyebrow"><DotiBrand /></p><h1>{t('settings.title')}</h1></div></div>
    <div className="settings-section"><h2>{t('settings.appearance')}</h2><div className="settings-group"><label>{t('settings.theme')}</label><div className="segmented-control settings-segmented">{themeOptions.map((option) => <button key={option.value} className={theme === option.value ? 'selected' : ''} aria-pressed={theme === option.value} onClick={() => setTheme(option.value)}>{option.label}</button>)}</div></div><div className="settings-group"><label>{t('settings.accentColor')}</label><div className="accent-swatches">{accentColors.map((color) => <button key={color} className={`accent-swatch accent-${color} ${accentColor === color ? 'selected' : ''}`} aria-label={t(`settings.colors.${color}`)} aria-pressed={accentColor === color} onClick={() => setAccentColor(color)} />)}</div></div><div className="settings-group"><label>{t('settings.language')}</label><div className="segmented-control settings-segmented"><button className={language === 'en' ? 'selected' : ''} aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>{t('settings.english')}</button><button className={language === 'es' ? 'selected' : ''} aria-pressed={language === 'es'} onClick={() => setLanguage('es')}>{t('settings.spanish')}</button></div></div></div>
    <div className="settings-section"><h2>{t('settings.tasks')}</h2><div className="settings-group aging-group"><div className="setting-row"><div><label>{t('settings.priorityAging')}</label><p>{t('settings.priorityAgingHelp')}</p></div><button className={`settings-switch ${priorityAgingEnabled ? 'on' : ''}`} role="switch" aria-checked={priorityAgingEnabled} onClick={() => setPriorityAgingEnabled(!priorityAgingEnabled)}><span /></button></div></div><div className={`settings-group ${!priorityAgingEnabled ? 'disabled-setting' : ''}`}><label>{t('settings.agingInterval')}</label><div className="segmented-control settings-segmented">{intervals.map((interval) => <button key={interval} disabled={!priorityAgingEnabled} className={priorityAgingIntervalDays === interval ? 'selected' : ''} aria-pressed={priorityAgingIntervalDays === interval} onClick={() => setPriorityAgingIntervalDays(interval)}>{t('settings.days', { count: interval })}</button>)}</div></div></div>
    <div className="settings-section"><h2>{t('settings.dashboard')}</h2><div className="settings-group"><div className="setting-row"><label>{t('settings.showHabits')}</label><button className={`settings-switch ${showHabitsOnDashboard ? 'on' : ''}`} role="switch" aria-label={t('settings.showHabits')} aria-checked={showHabitsOnDashboard} onClick={() => setShowHabitsOnDashboard(!showHabitsOnDashboard)}><span /></button></div></div></div>
    <div className="settings-section"><h2>{t('settings.notifications')}</h2>{!notificationsSupported ? <div className="settings-group"><p>{t('settings.unsupportedNotifications')}</p></div> : <><div className="settings-group"><div className="setting-row"><label>{t('settings.birthdayReminders')}</label><button className={`settings-switch ${birthdayNotifications.enabled ? 'on' : ''}`} role="switch" aria-label={t('settings.birthdayReminders')} aria-checked={birthdayNotifications.enabled} onClick={() => { const enabled = !birthdayNotifications.enabled; if (enabled && birthdayNotifications.offsets.length > 0 && notificationPermission !== 'granted') void changeNotificationPermission(); setBirthdayNotifications({ ...birthdayNotifications, enabled }) }}><span /></button></div>{notificationPermission === 'denied' && birthdayNotifications.enabled && birthdayNotifications.offsets.length > 0 ? <div role="status"><p>{t('settings.permissionRequired')}. {t('settings.notificationsDisabled')}</p><div className="sync-actions"><button disabled={requestingNotificationPermission} onClick={() => void changeNotificationPermission()}>{t('settings.permissionRetry')}</button><button onClick={() => void birthdayNotificationScheduler.openAndroidSettings()}>{t('settings.openAndroidSettings')}</button></div></div> : notificationPermission === 'prompt' && birthdayNotifications.enabled && birthdayNotifications.offsets.length > 0 ? <div><p>{t('settings.permissionRequired')}</p><button onClick={() => void changeNotificationPermission()}>{t('settings.permissionRetry')}</button></div> : null}</div><div className={`settings-group ${!birthdayNotifications.enabled ? 'disabled-setting' : ''}`}><label>{t('settings.remindMe')}</label>{([[0, 'settings.onBirthday'], [1, 'settings.oneDayBefore'], [7, 'settings.sevenDaysBefore']] as const).map(([offset, label]) => <label key={offset} className="setting-row"><span>{t(label)}</span><input type="checkbox" checked={birthdayNotifications.offsets.includes(offset)} disabled={!birthdayNotifications.enabled} onChange={() => toggleBirthdayOffset(offset)} /></label>)}</div><div className={`settings-group ${!birthdayNotifications.enabled ? 'disabled-setting' : ''}`}><label htmlFor="birthday-notification-time">{t('settings.notificationTime')}</label><input id="birthday-notification-time" type="time" value={birthdayNotifications.time} disabled={!birthdayNotifications.enabled} onChange={(event: { target: HTMLInputElement }) => setBirthdayNotifications({ ...birthdayNotifications, time: event.target.value })} /><p>{t('settings.exactAlarmNote')}</p></div></>}</div>
    <div className="settings-section"><h2>{t('sync.title')}</h2>{!isConfigured ? <div className="settings-group"><p>{t('sync.notConfigured')}</p></div> : user ? <div className="settings-group sync-connected"><p>{t('sync.connectedAs')}<br /><strong>{user.email}</strong></p><p className="sync-status">{syncStatus === 'syncing' ? t('sync.syncing') : syncStatus === 'offline' ? t('sync.offline') : syncStatus === 'error' ? t('sync.syncFailed') : t('sync.synced')}</p><p className="sync-last-synced">{t('sync.lastSynced')}: {lastSyncedLabel}</p><div className="sync-actions"><button onClick={() => void syncNow()}>{t('sync.syncNow')}</button><button onClick={() => void signOut()}>{t('sync.signOut')}</button></div>{syncError && <p className="settings-feedback error">{syncError instanceof DifferentAccountError ? t('sync.differentAccount') : t('sync.syncFailed')}</p>}</div> : <div className="settings-group sync-auth-form"><p>{t('sync.description')}</p><label>{t('sync.email')}<input type="email" value={syncEmail} onChange={(event: { target: HTMLInputElement }) => setSyncEmail(event.target.value)} autoComplete="email" /></label><label>{t('sync.password')}<input type="password" value={syncPassword} onChange={(event: { target: HTMLInputElement }) => setSyncPassword(event.target.value)} autoComplete="current-password" /></label><div className="sync-actions"><button onClick={() => void submitSync('signIn')}>{t('sync.signIn')}</button><button onClick={() => void submitSync('signUp')}>{t('sync.createAccount')}</button></div>{syncFeedback && <p className="settings-feedback error">{syncFeedback}</p>}</div>}</div>
    <div className="settings-section"><h2>{t('settings.data')}</h2><div className="settings-group settings-data-actions"><button onClick={() => void exportData()}><span>{t('settings.exportData')}</span><ChevronRight aria-hidden="true" /></button><label><span>{t('settings.importData')}</span><ChevronRight aria-hidden="true" /><input className="backup-file-input" type="file" accept=".json,application/json" onChange={(event: { target: HTMLInputElement }) => void importData(event)} /></label></div></div>
    {feedback && <p className={`settings-feedback ${feedback.type}`}>{feedback.text}</p>}
    <div className="settings-section"><h2>{t('settings.about')}</h2><div className="settings-group setting-row"><label>{t('settings.version')}</label><span className="setting-value">{APP_VERSION}</span></div></div>
  </section>
}
