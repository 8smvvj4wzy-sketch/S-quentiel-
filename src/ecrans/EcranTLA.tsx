import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { TLAOverlay } from '../composants/TLAOverlay'

/**
 * Écran « Pour parler » (ROADMAP lot 8) : le tableau de communication en
 * plein écran, plus l'accès à ses pages et à sa grille. Le TLA reste aussi
 * joignable depuis n'importe quel écran par le menu flottant.
 */
export function EcranTLA() {
  const { profilId } = useParams<{ profilId: string }>()
  const [ouvert, setOuvert] = useState(false)

  if (!profilId) return null

  return (
    <div className="ecran">
      <div className="barre">
        <Link to={`/profil/${profilId}`} className="bouton" style={{ lineHeight: '60px', textDecoration: 'none' }}>
          Retour
        </Link>
        <h1 className="barre__titre">Pour parler</h1>
      </div>

      <div className="contenu pile" style={{ maxWidth: '34rem' }}>
        <button
          type="button"
          className="bouton bouton--accent"
          style={{ minHeight: 'var(--cible-jeune)', fontSize: 24 }}
          onClick={() => setOuvert(true)}
        >
          Ouvrir le tableau
        </button>

        <h2 style={{ fontSize: 20 }}>Préparer</h2>
        <div className="ligne">
          <Link to={`/profil/${profilId}/tla/pages`} className="bouton" style={{ textDecoration: 'none' }}>
            Pages de pictos
          </Link>
          <Link to={`/profil/${profilId}/tla/grille`} className="bouton" style={{ textDecoration: 'none' }}>
            Grille et pages du profil
          </Link>
        </div>
      </div>

      {ouvert && <TLAOverlay profilId={profilId} surFermeture={() => setOuvert(false)} />}
    </div>
  )
}
