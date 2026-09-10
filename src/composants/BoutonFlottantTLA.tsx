import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useVerrouillage } from '../lib/verrouillage'
import { TLAOverlay } from './TLAOverlay'

/**
 * Accès au TLA « présent sur tous les écrans » du profil (SPEC §4.5).
 * Rendu hors de <Routes>, à côté de <CoinEducateur> : ouvrir ou fermer le
 * TLA n'est jamais une navigation, donc l'écran en dessous ne se démonte
 * jamais et ne perd aucun état.
 */
export function BoutonFlottantTLA() {
  const location = useLocation()
  const { mode } = useVerrouillage()
  const [ouvert, setOuvert] = useState(false)

  const profilId = location.pathname.match(/^\/profil\/([^/]+)/)?.[1]
  if (!profilId || mode === 'educateur') return null

  return (
    <>
      <button
        type="button"
        aria-label="Ouvrir le tableau de communication"
        onClick={() => setOuvert(true)}
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 60,
          width: 'var(--cible-jeune)',
          height: 'var(--cible-jeune)',
          borderRadius: '50%',
          background: 'var(--accent)',
          color: 'var(--texte-sur-accent)',
          border: 'none',
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        TLA
      </button>
      {ouvert && <TLAOverlay profilId={profilId} surFermeture={() => setOuvert(false)} />}
    </>
  )
}
