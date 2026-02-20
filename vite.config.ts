import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/nowon/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // include fonts in the PWA precache so they're available immediately/offline
      includeAssets: ['favicon.svg', 'fonts/*.flf'],
      workbox: {
        // also ensure workbox will precache the font files (glob pattern)
        globPatterns: ['**/fonts/*.flf']
      },
      manifest: {
        name: 'nowon',
        short_name: 'nowon',
        start_url: '.',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#2563eb',
        icons: [
          { src: 'icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: 'icon-512.svg', sizes: '512x512', type: 'image/svg+xml' }
        ]
      }
    })
  ],
  server: { port: 5173 }
});
