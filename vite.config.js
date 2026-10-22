import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Relative base so the same build works at a site root AND at
// https://hassy1122.github.io/LifePulseSchedule/ (GitHub Pages subpath).
const pwaManifest = {
  id: './',
  name: 'LifePulse — Daily Dashboard',
  short_name: 'LifePulse',
  description:
    'A calm daily dashboard for routines, habits, goals, finances and notes — offline-ready.',
  theme_color: '#8B5CF6',
  background_color: '#f1f5f9',
  display: 'standalone',
  orientation: 'portrait',
  start_url: './',
  scope: './',
  icons: [
    { src: './pwa-192.png', sizes: '192x192', type: 'image/png' },
    { src: './pwa-512.png', sizes: '512x512', type: 'image/png' },
    { src: './pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: pwaManifest,
      // Precache the built app shell so opening from the home screen works offline.
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        navigateFallbackDenylist: [/^\/sw\.js$/, /^\/manifest\.webmanifest$/],
        // Keep the Inter webfonts available offline (fetched at runtime, cached first).
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 10, maxAgeSeconds: 31536000 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 31536000 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      // Also register the service worker while developing (localhost install/testing).
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
})
