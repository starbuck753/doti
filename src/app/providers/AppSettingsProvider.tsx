import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { Language, Theme } from '../../domain/models'
import { db, defaultSettings } from '../../data/db'

interface AppSettingsContextValue {
  language: Language
  theme: Theme
  setLanguage: (language: Language) => void
  setTheme: (theme: Theme) => void
}

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null)

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const [language, setLanguageState] = useState<Language>(defaultSettings.language)
  const [theme, setThemeState] = useState<Theme>(defaultSettings.theme)

  useEffect(() => {
    void db.settings.get('app').then((stored) => {
      if (!stored) return void db.settings.put(defaultSettings)
      setLanguageState(stored.language)
      setThemeState(stored.theme)
      void i18n.changeLanguage(stored.language)
    })
  }, [i18n])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const save = (next: Partial<{ language: Language; theme: Theme }>) => {
    const updated = { ...defaultSettings, language, theme, ...next, updatedAt: new Date().toISOString() }
    void db.settings.put(updated)
  }

  const value = useMemo(() => ({
    language,
    theme,
    setLanguage: (next: Language) => { setLanguageState(next); void i18n.changeLanguage(next); save({ language: next }) },
    setTheme: (next: Theme) => { setThemeState(next); save({ theme: next }) },
  }), [language, theme, i18n])

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext)
  if (!context) throw new Error('useAppSettings must be used inside AppSettingsProvider')
  return context
}
