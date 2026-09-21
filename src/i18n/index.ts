import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: { translation: {
    appName: 'Doti', welcome: 'Your simple space for everyday things.',
    navigation: { tasks: 'Tasks', birthdays: 'Birthdays', notes: 'Notes', completed: 'Completed', settings: 'Settings' },
    placeholder: 'This screen is ready for the next phase.',
    settings: { title: 'Settings', language: 'Language', theme: 'Theme', light: 'Light', dark: 'Dark', english: 'English', spanish: 'Spanish' },
  } },
  es: { translation: {
    appName: 'Doti', welcome: 'Tu espacio simple para las cosas de todos los días.',
    navigation: { tasks: 'Tareas', birthdays: 'Cumpleaños', notes: 'Notas', completed: 'Completadas', settings: 'Configuración' },
    placeholder: 'Esta pantalla está lista para la próxima fase.',
    settings: { title: 'Configuración', language: 'Idioma', theme: 'Tema', light: 'Claro', dark: 'Oscuro', english: 'Inglés', spanish: 'Español' },
  } },
}

void i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
