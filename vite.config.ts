import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const base = mode === 'production' ? '/doti/' : '/'

  return {
    plugins: [react(), VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-192.png', 'icon-maskable-512.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Doti',
        short_name: 'Doti',
        description: 'Simple tasks, notes and birthdays.',
        start_url: `${base}tasks`,
        scope: base,
        display: 'standalone',
        theme_color: '#121827',
        background_color: '#121827',
        icons: [
          { src: `${base}icon-192.png`, sizes: '192x192', type: 'image/png' },
          { src: `${base}icon-512.png`, sizes: '512x512', type: 'image/png' },
          { src: `${base}icon-maskable-192.png`, sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: `${base}icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { navigateFallback: `${base}index.html` },
    })],
    base,
  }
})
