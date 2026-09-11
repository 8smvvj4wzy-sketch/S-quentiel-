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
      // Enregistrement fait à la main dans main.tsx : le script auto-injecté
      // ('auto') se contente d'un register() une fois au chargement, sans
      // revérifier tant que l'onglet reste ouvert — sur une tablette
      // d'atelier qui ne recharge jamais, une mise à jour publiée pouvait
      // ne jamais être vue. virtual:pwa-register gère en plus le
      // rechargement automatique dès qu'un nouveau service worker prend la
      // main, et permet une revérification périodique.
      injectRegister: false,
      includeAssets: ['icone-192.png', 'icone-512.png', 'icone-maskable-512.png'],
      workbox: {
        // Précache complet : tout doit être disponible hors ligne, y compris
        // les pictogrammes embarqués et les polices.
        globPatterns: ['**/*.{js,css,html,png,svg,woff,woff2,json}'],
        // Décision lot 1, confirmée au lot 6 : les images du pack ARASAAC
        // (désormais ~13 800, ~115 Mo) restent hors du précache
        // d'installation. Le premier déploiement avec le pack avait déjà
        // expiré côté GitHub Pages en tentant de tout traiter d'un coup — ce
        // volume ne doit pas peser sur l'installation. À la place, chaque
        // image est mise en cache dès qu'elle est vue une première fois
        // (runtimeCaching ci-dessous), puis y reste : un éducateur qui
        // prépare la bibliothèque avec le wifi de l'établissement rend ces
        // pictos disponibles pour l'usage hors ligne qui suit.
        //
        // index.json, lui, est bien précaché : il ne pèse que ~1 Mo et sans
        // lui la recherche ne renvoie rien à la première ouverture hors
        // ligne. D'où l'exclusion limitée aux seules images.
        globIgnores: ['pack-arasaac/*.webp', 'pack-arasaac/*.png'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallback: BASE + 'index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/pack-arasaac/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'pack-arasaac',
              // Au-delà du nombre d'images du pack, sinon le cache évince
              // des pictos déjà consultés et ils manquent hors ligne.
              expiration: { maxEntries: 20000 },
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
