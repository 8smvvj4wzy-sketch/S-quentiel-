import { useEffect, useState } from 'react'
import { obtenirPictoCatalogue, rechercherPictosLocaux } from '../db'
import { rechercherCatalogue, urlImageCatalogue, type EntreeCatalogue } from '../lib/arasaac'
import { useDebounce } from '../lib/useDebounce'
import type { Picto } from '../types'
import { TuilePicto } from './TuilePicto'

type Props = {
  surChoix: (picto: Picto) => void
  surFermeture: () => void
}

/**
 * Sélection d'un picto, dans la bibliothèque **et** dans tout le catalogue
 * ARASAAC embarqué, d'un seul geste (ROADMAP lot 7).
 *
 * Avant, il fallait d'abord « obtenir » un picto du catalogue depuis l'écran
 * Bibliothèque, puis revenir le choisir ici : deux écrans pour un seul geste.
 * Désormais le choix d'une entrée de catalogue l'enregistre en coulisse — la
 * copie de l'image en Blob dans IndexedDB reste ce qui garantit le hors
 * ligne, c'est seulement l'étape manuelle qui disparaît.
 */
export function ChoisirPictoModal({ surChoix, surFermeture }: Props) {
  const [recherche, setRecherche] = useState('')
  const rechercheRetardee = useDebounce(recherche)
  const [pictosBibliotheque, setPictosBibliotheque] = useState<Picto[]>([])
  const [entreesCatalogue, setEntreesCatalogue] = useState<EntreeCatalogue[]>([])
  const [enCours, setEnCours] = useState<string | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    void rechercherPictosLocaux(rechercheRetardee).then(setPictosBibliotheque)
  }, [rechercheRetardee])

  useEffect(() => {
    // On masque du catalogue ce qui est déjà dans la bibliothèque, pour ne
    // pas afficher deux fois le même picto.
    const dejaLa = new Set(
      pictosBibliotheque.filter((p) => p.source === 'arasaac').map((p) => p.id.replace(/^arasaac-/, '')),
    )
    void rechercherCatalogue({ recherche: rechercheRetardee, idsExclus: dejaLa, limite: 60 }).then(
      setEntreesCatalogue,
    )
  }, [rechercheRetardee, pictosBibliotheque])

  async function choisirDuCatalogue(entree: EntreeCatalogue) {
    setEnCours(entree.id)
    setErreur(null)
    try {
      surChoix(await obtenirPictoCatalogue(entree))
    } catch {
      setErreur(`Impossible de récupérer « ${entree.libelle} ».`)
    } finally {
      setEnCours(null)
    }
  }

  const rien = pictosBibliotheque.length === 0 && entreesCatalogue.length === 0

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choisir un picto"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        background: 'rgba(28, 28, 30, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'calc(var(--pas) * 2)',
      }}
    >
      <div
        className="pile"
        style={{
          background: 'var(--surface)',
          border: '2px solid var(--bordure-forte)',
          borderRadius: 'var(--rayon-grand)',
          padding: 'calc(var(--pas) * 3)',
          maxWidth: '34rem',
          width: '100%',
          maxHeight: '85vh',
        }}
      >
        <h2 style={{ fontSize: 22 }}>Choisir un picto</h2>
        <input
          className="champ"
          placeholder="Rechercher… (ex. : gâteau)"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          aria-label="Rechercher un picto"
          autoFocus
        />

        {erreur && <p style={{ margin: 0, color: 'var(--alerte)', fontWeight: 700 }}>{erreur}</p>}

        {rien ? (
          <p style={{ margin: 0, color: 'var(--texte-secondaire)' }}>
            {recherche.trim()
              ? `Aucun picto pour « ${recherche.trim()} ». Essayer un autre mot.`
              : 'Aucun picto disponible.'}
          </p>
        ) : (
          <div style={{ overflowY: 'auto' }} className="pile">
            {pictosBibliotheque.length > 0 && (
              <>
                <span style={{ fontSize: 14, color: 'var(--texte-secondaire)' }}>
                  Déjà dans la bibliothèque
                </span>
                <div style={grille}>
                  {pictosBibliotheque.map((p) => (
                    <TuilePicto
                      key={p.id}
                      image={p.image}
                      libelle={p.libelleAffiche}
                      surAppui={() => surChoix(p)}
                    />
                  ))}
                </div>
              </>
            )}

            {entreesCatalogue.length > 0 && (
              <>
                <span style={{ fontSize: 14, color: 'var(--texte-secondaire)' }}>
                  Catalogue ARASAAC
                </span>
                <div style={grille}>
                  {entreesCatalogue.map((e) => (
                    <TuilePicto
                      key={e.id}
                      image={urlImageCatalogue(e.id)}
                      libelle={e.libelle}
                      surAppui={() => void choisirDuCatalogue(e)}
                      enCours={enCours === e.id}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="ligne" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="bouton" onClick={surFermeture}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}

const grille = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
  gap: 4,
} as const
