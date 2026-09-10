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
        // Le pack ARASAAC est volontairement hors précache tant que le lot 1
        // n'a pas tranché : 1500 entrées alourdiraient beaucoup le service
        // worker, alors que SPEC §2 range les pictos en Blobs dans IndexedDB.
        // Le lot 1 doit choisir — précache direct, ou amorçage en base au
        // premier lancement — et lever cette exclusion en conséquence.
        globIgnores: ['pack-arasaac/**'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallback: BASE + 'index.html',
        cleanupOutdatedCaches: true,
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
