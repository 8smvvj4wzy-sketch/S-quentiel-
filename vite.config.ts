import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Le dépôt s'appelle « S-quentiel- » : sans cette base, les assets cassent sur Pages.
const BASE = '/S-quentiel-/'

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icone-192.png', 'icone-512.png', 'icone-maskable-512.png'],
      workbox: {
        // Précache complet : tout doit être disponible hors ligne, y compris
        // les pictogrammes embarqués et les polices.
        globPatterns: ['**/*.{js,css,html,png,svg,woff,woff2,json}'],
        // Décision lot 1 : le pack ARASAAC (1499 images, ~16 Mo) reste hors du
        // précache d'installation. Le premier déploiement avec le pack a
        // d'ailleurs expiré côté GitHub Pages en tentant de tout traiter
        // d'un coup — un signal concret que ce volume ne doit pas peser sur
        // l'installation de l'app. À la place, chaque image du catalogue est
        // mise en cache dès qu'elle est vue une première fois (runtimeCaching
        // ci-dessous), puis y reste indéfiniment : un éducateur qui prépare
        // la bibliothèque avec le wifi de l'établissement rend ces pictos
        // disponibles pour l'usage hors ligne qui suit, sans gonfler le
        // service worker pour des images jamais utilisées par ce profil.
        globIgnores: ['pack-arasaac/**'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallback: BASE + 'index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/pack-arasaac/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'pack-arasaac',
              expiration: { maxEntries: 2000 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'Séquentiel — supports visuels',
        short_name: 'Séquentiel',
        description: "Emploi du temps, séquentiels, règles et tableau de langage assisté.",
        lang: 'fr',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        orientation: 'landscape',
        background_color: '#F2F3F4',
        theme_color: '#1D4E89',
        icons: [
          { src: 'icone-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icone-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icone-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  build: {
    // Les polices doivent rester des fichiers précachés, jamais des data-URI
    // dupliquées dans chaque bundle.
    assetsInlineLimit: 0,
  },
})
