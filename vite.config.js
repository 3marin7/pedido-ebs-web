import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    plugins: [
      react(),
      // Service worker: permite abrir la plataforma sin internet (o con conexión mala)
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        manifest: false,
        workbox: {
          // Los logos de /public se guardan al usarse (caché de imágenes), no en la instalación
          globPatterns: ['**/*.{js,css,html,svg,ico,woff,woff2}', 'assets/**/*.{png,jpg,jpeg,webp}'],
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
          navigateFallback: '/index.html',
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              // Imágenes de productos (Cloudinary, Supabase Storage, etc.)
              urlPattern: ({ request }) => request.destination === 'image',
              handler: 'CacheFirst',
              options: {
                cacheName: 'imagenes-productos',
                expiration: { maxEntries: 1500, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
              // Fuentes e íconos externos (Font Awesome, Google Fonts)
              urlPattern: ({ request }) => request.destination === 'font' || request.destination === 'style',
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'recursos-externos',
                cacheableResponse: { statuses: [0, 200] }
              }
            }
          ]
        }
      })
    ],
    define: {
      'globalThis.__APP_ENV__': JSON.stringify(env)
    },
    server: {
      hmr: {
        overlay: false // Puedes desactivar temporalmente el overlay
      }
    }
  }
})
