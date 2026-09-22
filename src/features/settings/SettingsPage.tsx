import { useTranslation } from 'react-i18next'
import { useAppSettings } from '../../app/providers/AppSettingsProvider'
import type { AccentColor, Theme } from '../../domain/models'
import { APP_VERSION } from '../../app/version'

const accentColors: AccentColor[] = ['blue', 'purple', 'pink', 'green', 'orange', 'teal']
const intervals = [3, 7, 14, 30]

export function SettingsPage() {
  const { t } = useTranslation()
  const { language, theme, accentColor, priorityAgingEnabled, priorityAgingIntervalDays, setLanguage, setTheme, setAccentColor, setPriorityAgingEnabled, setPriorityAgingIntervalDays } = useAppSettings()
  const themeOptions: { value: Theme; label: string }[] = [{ value: 'system', label: t('settings.system') }, { value: 'light', label: t('settings.light') }, { value: 'dark', label: t('settings.dark') }]
  return <section className="settings-page"><p className="eyebrow">Doti</p><h1>{t('settings.title')}</h1>
    <div className="settings-section"><h2>{t('settings.appearance')}</h2><div className="settings-group"><label>{t('settings.theme')}</label><div className="segmented-control settings-segmented">{themeOptions.map((option) => <button key={option.value} className={theme === option.value ? 'selected' : ''} aria-pressed={theme === option.value} onClick={() => setTheme(option.value)}>{option.label}</button>)}</div></div>
      <div className="settings-group"><label>{t('settings.accentColor')}</label><div className="accent-swatches">{accentColors.map((color) => <button key={color} className={`accent-swatch accent-${color} ${accentColor === color ? 'selected' : ''}`} aria-label={t(`settings.colors.${color}`)} aria-pressed={accentColor === color} onClick={() => setAccentColor(color)} />)}</div></div>
      <div className="settings-group"><label>{t('settings.language')}</label><div className="segmented-control settings-segmented"><button className={language === 'en' ? 'selected' : ''} aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>{t('settings.english')}</button><button className={language === 'es' ? 'selected' : ''} aria-pressed={language === 'es'} onClick={() => setLanguage('es')}>{t('settings.spanish')}</button></div></div>
    </div>
    <div className="settings-section"><h2>{t('settings.tasks')}</h2><div className="settings-group aging-group"><div className="setting-row"><div><label>{t('settings.priorityAging')}</label><p>{t('settings.priorityAgingHelp')}</p></div><button className={`settings-switch ${priorityAgingEnabled ? 'on' : ''}`} role="switch" aria-checked={priorityAgingEnabled} onClick={() => setPriorityAgingEnabled(!priorityAgingEnabled)}><span /></button></div></div><div className={`settings-group ${!priorityAgingEnabled ? 'disabled-setting' : ''}`}><label>{t('settings.agingInterval')}</label><div className="segmented-control settings-segmented">{intervals.map((interval) => <button key={interval} disabled={!priorityAgingEnabled} className={priorityAgingIntervalDays === interval ? 'selected' : ''} aria-pressed={priorityAgingIntervalDays === interval} onClick={() => setPriorityAgingIntervalDays(interval)}>{t('settings.days', { count: interval })}</button>)}</div></div></div>
    <div className="settings-section"><h2>{t('settings.about')}</h2><div className="settings-group setting-row"><label>{t('settings.version')}</label><span className="setting-value">{APP_VERSION}</span></div></div>
  </section>
}
