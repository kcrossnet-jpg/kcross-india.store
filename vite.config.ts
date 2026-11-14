import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import {defineConfig, loadEnv} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  const localConfigPath = path.resolve(import.meta.dirname, 'firebase-applet-config.json');
  let localFirebaseConfig: Record<string, string> = {};

  if (!env.VITE_FIREBASE_API_KEY && fs.existsSync(localConfigPath)) {
    try {
      localFirebaseConfig = JSON.parse(fs.readFileSync(localConfigPath, 'utf-8'));
    } catch {
      localFirebaseConfig = {};
    }
  }

  const firebaseEnv = {
    VITE_FIREBASE_API_KEY: env.VITE_FIREBASE_API_KEY || localFirebaseConfig.apiKey || '',
    VITE_FIREBASE_AUTH_DOMAIN: env.VITE_FIREBASE_AUTH_DOMAIN || localFirebaseConfig.authDomain || '',
    VITE_FIREBASE_PROJECT_ID: env.VITE_FIREBASE_PROJECT_ID || localFirebaseConfig.projectId || '',
    VITE_FIREBASE_STORAGE_BUCKET:
      env.VITE_FIREBASE_STORAGE_BUCKET || localFirebaseConfig.storageBucket || '',
    VITE_FIREBASE_MESSAGING_SENDER_ID:
      env.VITE_FIREBASE_MESSAGING_SENDER_ID || localFirebaseConfig.messagingSenderId || '',
    VITE_FIREBASE_APP_ID: env.VITE_FIREBASE_APP_ID || localFirebaseConfig.appId || '',
    VITE_FIREBASE_FIRESTORE_DATABASE_ID:
      env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || localFirebaseConfig.firestoreDatabaseId || '',
    VITE_FIREBASE_MEASUREMENT_ID:
      env.VITE_FIREBASE_MEASUREMENT_ID || localFirebaseConfig.measurementId || '',
  };

  return {
    define: Object.fromEntries(
      Object.entries(firebaseEnv).map(([key, value]) => [
        `import.meta.env.${key}`,
        JSON.stringify(value),
      ])
    ),
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: '/',
          name: 'kcross india — Beauty & Studio',
          short_name: 'kcross india',
          description:
            'Curated beauty, skincare, haircare, fragrance, appliances, and in-store studio services across India.',
          theme_color: '#1E161A',
          background_color: '#FAF8F6',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          globIgnores: ['assets/aistudio/**'],
          navigateFallbackDenylist: [/^\/api\//, /^\/assets\/aistudio\//],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
