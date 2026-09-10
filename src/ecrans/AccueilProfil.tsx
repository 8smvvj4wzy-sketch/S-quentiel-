import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { db } from '../db'
import { useVerrouillage } from '../lib/verrouillage'
import { SaisiePin } from '../composants/SaisiePin'
import type { Profil } from '../types'

const ENTREES = [
  { chemin: 'edt', libelle: 'Emploi du temps' },
  { chemin: 'sequentiels', libelle: 'Séquentiels' },
  { chemin: 'regles', libelle: 'Règles' },
  { chemin: 'tla', libelle: 'Pour parler' },
] as const

/**
 * Accueil d'un profil : les quatre supports, et rien d'autre (ROADMAP lot 8).
 *
 * Avant, tout passait par un arbre d'administration à douze écrans, derrière
 * un appui long caché et un code PIN. Le paramétrage reste protégé, mais il
 * n'est plus sur le chemin de l'usage quotidien.
 */
export function AccueilProfil() {
  const { profilId } = useParams<{ profilId: string }>()
  const [profil, setProfil] = useState<Profil | null | undefined>(undefined)
  const [demandePin, setDemandePin] = useState(false)
  const { ouvrirEducateur } = useVerrouillage()
  const naviguer = useNavigate()

  useEffect(() => {
    if (!profilId) return
    void db.profils.get(profilId).then((p) => setProfil(p ?? null))
  }, [profilId])

  if (profil === undefined) return null

  return (
    <div className="ecran">
      <div className="barre">
        <Link to="/" className="bouton" style={{ lineHeight: '60px', textDecoration: 'none' }}>
          Retour
        </Link>
        <h1 className="barre__titre">{profil ? profil.initiales : 'Profil introuvable'}</h1>
      </div>

      <div
        className="contenu"
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'calc(var(--pas) * 2)',
          alignContent: 'center',
        }}
      >
        {ENTREES.map((entree) => (
          <Link
            key={entree.chemin}
            to={`/profil/${profilId}/${entree.chemin}`}
            className="bouton"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 140,
              fontSize: 26,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            {entree.libelle}
          </Link>
        ))}
      </div>

      <div className="barre" style={{ borderBottom: 'none', borderTop: '1px solid var(--bordure)' }}>
        <span style={{ flex: 1 }} />
        <button type="button" className="bouton--discret" onClick={() => setDemandePin(true)}>
          Paramétrage
        </button>
      </div>

      {demandePin && (
        <SaisiePin
          surAnnulation={() => setDemandePin(false)}
          surSucces={() => {
            setDemandePin(false)
            ouvrirEducateur()
            naviguer('/parametrage')
          }}
        />
      )}
    </div>
  )
}
