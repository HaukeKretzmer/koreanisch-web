import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      workbox: {
        // Firestores eigene Offline-Persistenz (IndexedDB) übernimmt das Daten-Caching;
        // Runtime-Caching hier würde nur Stale-Data-Risiken schaffen.
        navigateFallbackDenylist: [/^\/__/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\//,
            handler: 'NetworkOnly',
          },
        ],
      },
      manifest: {
        id: '/',
        name: 'Koreanisch lernen',
        short_name: 'Koreanisch',
        description: 'Karteikarten mit Spaced Repetition zum Koreanischlernen',
        lang: 'de',
        start_url: '/',
        display: 'standalone',
        background_color: '#0f1620',
        theme_color: '#0f1620',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
