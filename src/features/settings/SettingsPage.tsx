import { useTranslation } from 'react-i18next'
import { useAppSettings } from '../../app/providers/AppSettingsProvider'

export function SettingsPage() {
  const { t } = useTranslation()
  const { language, theme, setLanguage, setTheme } = useAppSettings()
  return <section className="settings-page"><p className="eyebrow">Doti</p><h1>{t('settings.title')}</h1>
    <div className="settings-group"><label>{t('settings.language')}</label><div className="segmented-control"><button className={language === 'en' ? 'selected' : ''} onClick={() => setLanguage('en')}>{t('settings.english')}</button><button className={language === 'es' ? 'selected' : ''} onClick={() => setLanguage('es')}>{t('settings.spanish')}</button></div></div>
    <div className="settings-group"><label>{t('settings.theme')}</label><div className="segmented-control"><button className={theme === 'light' ? 'selected' : ''} onClick={() => setTheme('light')}>{t('settings.light')}</button><button className={theme === 'dark' ? 'selected' : ''} onClick={() => setTheme('dark')}>{t('settings.dark')}</button></div></div>
  </section>
}
