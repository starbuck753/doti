import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, HashRouter, useLocation, useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { useEffect } from 'react'
import './i18n'
import './styles/global.css'
if (import.meta.env.MODE !== 'android') void import('./pwa')
import { App } from './app/App'
import { AppSettingsProvider } from './app/providers/AppSettingsProvider'
import { SyncProvider } from './sync/SyncContext'

function AndroidBackButton() {
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return
    const listener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack && window.history.state?.idx > 0) navigate(-1)
      else if (location.pathname !== '/tasks' && location.pathname !== '/') navigate('/tasks', { replace: true })
      else void CapacitorApp.exitApp()
    })
    return () => { void listener.then((handle) => handle.remove()) }
  }, [navigate, location.pathname])
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return
    const openExternalLink = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const anchor = target.closest('a[href]')
      if (!(anchor instanceof HTMLAnchorElement)) return
      const url = new URL(anchor.href, window.location.href)
      if (!['http:', 'https:'].includes(url.protocol) || url.origin === window.location.origin) return
      event.preventDefault()
      void Browser.open({ url: url.href })
    }
    document.addEventListener('click', openExternalLink)
    return () => document.removeEventListener('click', openExternalLink)
  }, [])
  return null
}

const Router = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router {...(Router === BrowserRouter ? { basename: import.meta.env.BASE_URL } : {})}>
      <AndroidBackButton />
      <SyncProvider>
        <AppSettingsProvider>
          <App />
        </AppSettingsProvider>
      </SyncProvider>
    </Router>
  </React.StrictMode>,
)
