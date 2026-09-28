import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './i18n'
import './styles/global.css'
import './pwa'
import { App } from './app/App'
import { AppSettingsProvider } from './app/providers/AppSettingsProvider'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppSettingsProvider>
        <App />
      </AppSettingsProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
