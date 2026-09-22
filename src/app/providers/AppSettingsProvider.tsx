import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { AccentColor, Language, Settings, Theme } from '../../domain/models'
import { db, defaultSettings } from '../../data/db'

interface AppSettingsContextValue {
  language: Language
  theme: Theme
  accentColor: AccentColor
  priorityAgingEnabled: boolean
  priorityAgingIntervalDays: number
  setLanguage: (language: Language) => void
  setTheme: (theme: Theme) => void
  setAccentColor: (accentColor: AccentColor) => void
  setPriorityAgingEnabled: (enabled: boolean) => void
  setPriorityAgingIntervalDays: (days: number) => void
}

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null)

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const [settings, setSettings] = useState<Settings>(defaultSettings)

  useEffect(() => {
    void db.settings.get('app').then((stored) => {
      const next = { ...defaultSettings, ...stored }
      setSettings(next)
      if (!stored || stored.accentColor === undefined || stored.priorityAgingEnabled === undefined || stored.priorityAgingIntervalDays === undefined) void db.settings.put(next)
      void i18n.changeLanguage(next.language)
    })
  }, [i18n])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = () => { document.documentElement.dataset.theme = settings.theme === 'system' ? (media.matches ? 'dark' : 'light') : settings.theme }
    document.documentElement.dataset.accent = settings.accentColor
    applyTheme()
    media.addEventListener?.('change', applyTheme)
    return () => media.removeEventListener?.('change', applyTheme)
  }, [settings.theme, settings.accentColor])

  const update = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch, updatedAt: new Date().toISOString() }
    void db.settings.put(next)
    setSettings(next)
  }
  const value = useMemo(() => ({
    language: settings.language,
    theme: settings.theme,
    accentColor: settings.accentColor,
    priorityAgingEnabled: settings.priorityAgingEnabled,
    priorityAgingIntervalDays: settings.priorityAgingIntervalDays,
    setLanguage: (language: Language) => { void i18n.changeLanguage(language); update({ language }) },
    setTheme: (theme: Theme) => update({ theme }),
    setAccentColor: (accentColor: AccentColor) => update({ accentColor }),
    setPriorityAgingEnabled: (priorityAgingEnabled: boolean) => update({ priorityAgingEnabled }),
    setPriorityAgingIntervalDays: (priorityAgingIntervalDays: number) => update({ priorityAgingIntervalDays }),
  }), [settings, i18n])

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext)
  if (!context) throw new Error('useAppSettings must be used inside AppSettingsProvider')
  return context
}
