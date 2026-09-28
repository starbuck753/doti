import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-192.png', 'icon-maskable-512.png', 'apple-touch-icon.png'],
    manifest: {
      name: 'Doti',
      short_name: 'Doti',
      description: 'Simple tasks, notes and birthdays.',
      start_url: '/tasks',
      scope: '/',
      display: 'standalone',
      theme_color: '#121827',
      background_color: '#121827',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
        { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: { navigateFallback: '/index.html' },
  })],
})
