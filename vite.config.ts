import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { pronunciationApi } from './scripts/vite-api.ts';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    pronunciationApi(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,ogg,wav,mp3}'],
        navigateFallbackDenylist: [/^\/api\//],
      },
      manifest: {
        name: 'Persisch lernen',
        short_name: 'Persisch',
        description: 'Persisch sprechen und verstehen lernen — ohne arabische Schrift.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#1e6f5c',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
