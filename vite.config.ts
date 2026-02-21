import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import vitePluginWasm from 'vite-plugin-wasm';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/nowon/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'fonts/*.flf'],
      workbox: {
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
    }),
    vitePluginWasm()
  ],
  server: { port: 5173 },
  build: {
    rollupOptions: {
      external: [
        'bun:ffi',
        'C:/dev/opentui/packages/core/src/lib/tree-sitter/assets/javascript/tree-sitter-javascript.wasm',
        'C:/dev/opentui/packages/core/src/lib/tree-sitter/assets/markdown/tree-sitter-markdown.wasm',
        'C:/dev/opentui/packages/core/src/lib/tree-sitter/assets/zig/tree-sitter-zig.wasm',
        'C:/dev/opentui/packages/core/src/lib/tree-sitter/assets/typescript/tree-sitter-typescript.wasm'
      ]
    }
  },
  assetsInclude: ['**/*.scm']
});
