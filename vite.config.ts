import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import {defineConfig, loadEnv} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';
import {resolveFirebaseConfig} from './src/utils/firebaseConfig.ts';

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

  const verifiedLocalFallback = resolveFirebaseConfig(
    {
      apiKey: dotEnvLocal.VITE_FIREBASE_API_KEY,
      authDomain: dotEnvLocal.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: dotEnvLocal.VITE_FIREBASE_PROJECT_ID,
      storageBucket: dotEnvLocal.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: dotEnvLocal.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: dotEnvLocal.VITE_FIREBASE_APP_ID,
      firestoreDatabaseId: dotEnvLocal.VITE_FIREBASE_FIRESTORE_DATABASE_ID,
      measurementId: dotEnvLocal.VITE_FIREBASE_MEASUREMENT_ID,
    },
    appletJson
  );

  const runtimeEnvConfig = resolveFirebaseConfig(
    {
      apiKey: process.env.VITE_FIREBASE_API_KEY || env.VITE_FIREBASE_API_KEY,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId:
        process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.VITE_FIREBASE_APP_ID || env.VITE_FIREBASE_APP_ID,
      firestoreDatabaseId:
        process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || env.VITE_FIREBASE_FIRESTORE_DATABASE_ID,
      measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || env.VITE_FIREBASE_MEASUREMENT_ID,
    },
    verifiedLocalFallback
  );

  const localFirebaseConfig = runtimeEnvConfig;

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
          theme_color: '#C2410C',
          background_color: '#FCF9F5',
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
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,woff,woff2}'],
          globIgnores: ['assets/aistudio/node_*'],
          navigateFallbackDenylist: [/^\/api\//, /^\/assets\/aistudio\/node_/],
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
