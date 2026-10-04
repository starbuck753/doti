import { NavLink, Outlet, Route, Routes } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Cake, CircleCheck, SquareText } from 'lucide-react'
import { useAppSettings } from './providers/AppSettingsProvider'
import { SettingsPage } from '../features/settings/SettingsPage'
import { TasksDashboard } from '../features/tasks/TasksDashboard'
import { TaskDetail } from '../features/tasks/TaskDetail'
import { BirthdaysPage } from '../features/birthdays/BirthdaysPage'
import { NotesPage } from '../features/notes/NotesPage'
import { NoteDetail } from '../features/notes/NoteDetail'
import { CompletedTasksPage } from '../features/tasks/CompletedTasksPage'
import { HabitDetail } from '../features/habits/HabitDetail'
import './app.css'

function NavIcon({ type }: { type: 'tasks' | 'birthdays' | 'notes' }) {
  const commonProps = { size: 20, strokeWidth: 1.9, 'aria-hidden': true }

  switch (type) {
    case 'tasks':
      return <CircleCheck {...commonProps} />
    case 'birthdays':
      return <Cake {...commonProps} />
    default:
      return <SquareText {...commonProps} />
  }
}

function Layout() {
  const { t } = useTranslation()
  const navigation: Array<{ path: string; label: string; type: 'tasks' | 'birthdays' | 'notes' }> = [
    { path: '/tasks', label: t('navigation.tasks'), type: 'tasks' },
    { path: '/birthdays', label: t('navigation.birthdays'), type: 'birthdays' },
    { path: '/notes', label: t('navigation.notes'), type: 'notes' },
  ]

  return <div className="app-shell">
    <main className="page-content"><Outlet /></main>
    <nav className="bottom-nav" aria-label={t('navigation.tasks')}>
      {navigation.map(({ path, label, type }) => (
        <NavLink key={path} to={path} className={({ isActive }: { isActive: boolean }) => isActive ? 'nav-item active' : 'nav-item'}>
          <NavIcon type={type} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  </div>
}

export function App() {
  const { theme } = useAppSettings()
  return <div data-current-theme={theme}>
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<TasksDashboard />} />
        <Route path="/tasks" element={<TasksDashboard />} />
        <Route path="/tasks/:taskId" element={<TaskDetail />} />
        <Route path="/habits/:habitId" element={<HabitDetail />} />
        <Route path="/birthdays" element={<BirthdaysPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/notes/:noteId" element={<NoteDetail />} />
        <Route path="/completed" element={<CompletedTasksPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  </div>
}
