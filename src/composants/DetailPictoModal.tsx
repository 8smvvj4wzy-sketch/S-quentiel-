import { useState } from 'react'
import { modifierLibellesPicto, supprimerPicto } from '../db'
import { useObjectUrl } from '../lib/useObjectUrl'
import type { Picto } from '../types'

type Props = {
  picto: Picto
  surFermeture: () => void
  surModification: () => void
}

const NOMS_SOURCE: Record<Picto['source'], string> = {
  arasaac: 'ARASAAC',
  photo: 'Photo importée',
  composite: 'Picto composite',
}

/** Édition des libellés affiché et parlé d'un picto (ROADMAP lot 1). */
export function DetailPictoModal({ picto, surFermeture, surModification }: Props) {
  const url = useObjectUrl(picto.image)
  const [libelleAffiche, setLibelleAffiche] = useState(picto.libelleAffiche)
  const [libelleParle, setLibelleParle] = useState(picto.libelleParle)
  const [confirmerSuppression, setConfirmerSuppression] = useState(false)
  const [enCours, setEnCours] = useState(false)

  const modifie = libelleAffiche !== picto.libelleAffiche || libelleParle !== picto.libelleParle

  async function enregistrer() {
    setEnCours(true)
    await modifierLibellesPicto(picto.id, libelleAffiche.trim() || picto.libelleAffiche, libelleParle.trim() || picto.libelleParle)
    setEnCours(false)
    surModification()
  }

  async function confirmer() {
    setEnCours(true)
    await supprimerPicto(picto.id)
    setEnCours(false)
    surModification()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Picto ${picto.libelleAffiche}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
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
          borderRadius: 'var(--rayon)',
          padding: 'calc(var(--pas) * 3)',
          maxWidth: '26rem',
          width: '100%',
        }}
      >
        <div className="ligne" style={{ alignItems: 'flex-start' }}>
          <span
            style={{
              width: 96,
              height: 96,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--fond)',
              border: '1px solid var(--bordure)',
            }}
          >
            {url && <img src={url} alt="" style={{ maxWidth: '100%', maxHeight: '100%' }} />}
          </span>
          <div className="pile" style={{ gap: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 18 }}>{picto.libelleAffiche}</span>
            <span style={{ fontSize: 14, color: 'var(--texte-secondaire)' }}>
              {NOMS_SOURCE[picto.source]}
            </span>
          </div>
        </div>

        <label className="etiquette" htmlFor="libelle-affiche">
          Libellé affiché
        </label>
        <input
          id="libelle-affiche"
          className="champ"
          value={libelleAffiche}
          onChange={(e) => setLibelleAffiche(e.target.value)}
        />

        <label className="etiquette" htmlFor="libelle-parle">
          Libellé parlé
        </label>
        <input
          id="libelle-parle"
          className="champ"
          value={libelleParle}
          onChange={(e) => setLibelleParle(e.target.value)}
        />
        <p style={{ margin: 0, fontSize: 14, color: 'var(--texte-secondaire)' }}>
          Ce que la voix prononce peut différer de ce qui est écrit — par exemple afficher
          « toilettes » et faire dire « je veux aller aux toilettes ».
        </p>

        {confirmerSuppression ? (
          <div className="pile" style={{ gap: 8 }}>
            <p style={{ margin: 0 }}>Supprimer ce picto de la bibliothèque ?</p>
            <div className="ligne" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="bouton" onClick={() => setConfirmerSuppression(false)}>
                Annuler
              </button>
              <button type="button" className="bouton bouton--danger" disabled={enCours} onClick={() => void confirmer()}>
                Supprimer
              </button>
            </div>
          </div>
        ) : (
          <div className="ligne" style={{ justifyContent: 'space-between' }}>
            <button type="button" className="bouton bouton--danger" onClick={() => setConfirmerSuppression(true)}>
              Supprimer
            </button>
            <div className="ligne">
              <button type="button" className="bouton" onClick={surFermeture}>
                Fermer
              </button>
              <button
                type="button"
                className="bouton bouton--accent"
                disabled={!modifie || enCours}
                onClick={() => void enregistrer()}
              >
                Enregistrer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
