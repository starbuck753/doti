import { NavLink, Outlet, Route, Routes } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppSettings } from './providers/AppSettingsProvider'
import { SettingsPage } from '../features/settings/SettingsPage'
import { TasksDashboard } from '../features/tasks/TasksDashboard'
import { TaskDetail } from '../features/tasks/TaskDetail'
import './app.css'

function Layout() {
  const { t } = useTranslation()
  const navigation = [
    ['/tasks', t('navigation.tasks')], ['/birthdays', t('navigation.birthdays')],
    ['/notes', t('navigation.notes')], ['/completed', t('navigation.completed')], ['/settings', t('navigation.settings')],
  ]
  return <div className="app-shell">
    <header className="app-header"><NavLink className="brand" to="/tasks">{t('appName')}</NavLink><span className="header-mark">○</span></header>
    <main className="page-content"><Outlet /></main>
    <nav className="bottom-nav" aria-label="Main navigation">{navigation.map(([path, label]) => <NavLink key={path} to={path} className={({ isActive }: { isActive: boolean }) => isActive ? 'nav-item active' : 'nav-item'}>{label}</NavLink>)}</nav>
  </div>
}

function Placeholder({ title }: { title: string }) {
  const { t } = useTranslation()
  return <section className="placeholder-page"><p className="eyebrow">Doti</p><h1>{title}</h1><p>{t('placeholder')}</p></section>
}

export function App() {
  const { t } = useTranslation()
  const { theme } = useAppSettings()
  return <div data-current-theme={theme}>
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<TasksDashboard />} />
        <Route path="/tasks" element={<TasksDashboard />} />
        <Route path="/tasks/:taskId" element={<TaskDetail />} />
        <Route path="/birthdays" element={<Placeholder title={t('navigation.birthdays')} />} />
        <Route path="/notes" element={<Placeholder title={t('navigation.notes')} />} />
        <Route path="/notes/:noteId" element={<Placeholder title="Note Detail" />} />
        <Route path="/completed" element={<Placeholder title={t('navigation.completed')} />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  </div>
}
