import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './styles/global.css'

/**
 * `registerType: 'autoUpdate'` (vite.config.ts) fait le gros du travail : dès
 * qu'un nouveau service worker est détecté, il prend la main et la page se
 * recharge, sans rien demander à l'éducateur. Mais ça suppose qu'une
 * vérification ait lieu — et une tablette d'atelier reste ouverte sur le même
 * onglet toute la journée, parfois plusieurs jours, sans jamais recharger.
 * D'où la revérification chaque heure tant que la page reste ouverte.
 */
registerSW({
  immediate: true,
  onRegisteredSW(_url, enregistrement) {
    if (!enregistrement) return
    setInterval(() => void enregistrement.update(), 60 * 60 * 1000)
  },
})

const racine = document.getElementById('racine')
if (!racine) throw new Error('Élément #racine introuvable')

createRoot(racine).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
