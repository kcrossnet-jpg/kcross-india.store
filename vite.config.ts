import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import {defineConfig, loadEnv} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

const cleanConfigVal = (val: unknown): string => {
  if (typeof val !== 'string') return '';
  const trimmed = val.trim();
  if (!trimmed || trimmed === '0' || trimmed === 'undefined' || trimmed === 'null') return '';
  return trimmed;
};

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  const localEnvPath = path.resolve(import.meta.dirname, '.env.local');
  const localConfigPath = path.resolve(import.meta.dirname, 'firebase-applet-config.json');

  let dotEnvLocal: Record<string, string> = {};
  if (fs.existsSync(localEnvPath)) {
    try {
      dotEnvLocal = dotenv.parse(fs.readFileSync(localEnvPath, 'utf-8'));
    } catch {
      dotEnvLocal = {};
    }
  }

  let appletJson: Record<string, unknown> = {};
  if (fs.existsSync(localConfigPath)) {
    try {
      appletJson = JSON.parse(fs.readFileSync(localConfigPath, 'utf-8')) as Record<string, unknown>;
    } catch {
      appletJson = {};
    }
  }

  const localFirebaseConfig = {
    apiKey:
      cleanConfigVal(env.VITE_FIREBASE_API_KEY) ||
      cleanConfigVal(dotEnvLocal.VITE_FIREBASE_API_KEY) ||
      cleanConfigVal(appletJson.apiKey),
    authDomain:
      cleanConfigVal(env.VITE_FIREBASE_AUTH_DOMAIN) ||
      cleanConfigVal(dotEnvLocal.VITE_FIREBASE_AUTH_DOMAIN) ||
      cleanConfigVal(appletJson.authDomain),
    projectId:
      cleanConfigVal(env.VITE_FIREBASE_PROJECT_ID) ||
      cleanConfigVal(dotEnvLocal.VITE_FIREBASE_PROJECT_ID) ||
      cleanConfigVal(appletJson.projectId),
    storageBucket:
      cleanConfigVal(env.VITE_FIREBASE_STORAGE_BUCKET) ||
      cleanConfigVal(dotEnvLocal.VITE_FIREBASE_STORAGE_BUCKET) ||
      cleanConfigVal(appletJson.storageBucket),
    messagingSenderId:
      cleanConfigVal(env.VITE_FIREBASE_MESSAGING_SENDER_ID) ||
      cleanConfigVal(dotEnvLocal.VITE_FIREBASE_MESSAGING_SENDER_ID) ||
      cleanConfigVal(appletJson.messagingSenderId),
    appId:
      cleanConfigVal(env.VITE_FIREBASE_APP_ID) ||
      cleanConfigVal(dotEnvLocal.VITE_FIREBASE_APP_ID) ||
      cleanConfigVal(appletJson.appId),
    firestoreDatabaseId:
      cleanConfigVal(env.VITE_FIREBASE_FIRESTORE_DATABASE_ID) ||
      cleanConfigVal(dotEnvLocal.VITE_FIREBASE_FIRESTORE_DATABASE_ID) ||
      cleanConfigVal(appletJson.firestoreDatabaseId),
    measurementId:
      cleanConfigVal(env.VITE_FIREBASE_MEASUREMENT_ID) ||
      cleanConfigVal(dotEnvLocal.VITE_FIREBASE_MEASUREMENT_ID) ||
      cleanConfigVal(appletJson.measurementId),
  };

  return {
    define: {
      __LOCAL_FIREBASE_CONFIG__: JSON.stringify(localFirebaseConfig),
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: '/',
          name: 'kcross india store — Beauty & Studio',
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
