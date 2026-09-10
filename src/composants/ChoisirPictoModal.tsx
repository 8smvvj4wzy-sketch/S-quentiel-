import { useEffect, useState } from 'react'
import { rechercherPictosLocaux } from '../db'
import type { Picto } from '../types'
import { TuilePicto } from './TuilePicto'

type Props = {
  surChoix: (picto: Picto) => void
  surFermeture: () => void
}

/**
 * Sélection d'un picto déjà présent dans la bibliothèque (voir écran
 * Bibliothèque pour en obtenir de nouveaux depuis le catalogue ARASAAC,
 * importer une photo ou composer un picto).
 */
export function ChoisirPictoModal({ surChoix, surFermeture }: Props) {
  const [recherche, setRecherche] = useState('')
  const [resultats, setResultats] = useState<Picto[]>([])

  useEffect(() => {
    void rechercherPictosLocaux(recherche).then(setResultats)
  }, [recherche])

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
          borderRadius: 'var(--rayon)',
          padding: 'calc(var(--pas) * 3)',
          maxWidth: '34rem',
          width: '100%',
          maxHeight: '85vh',
        }}
      >
        <h2 style={{ fontSize: 22 }}>Choisir un picto</h2>
        <input
          className="champ"
          placeholder="Rechercher…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          aria-label="Rechercher un picto"
        />

        {resultats.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--texte-secondaire)' }}>
            Aucun picto dans la bibliothèque. Aller d'abord dans « Bibliothèque de pictos » pour
            en obtenir.
          </p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
              gap: 4,
              overflowY: 'auto',
            }}
          >
            {resultats.map((p) => (
              <TuilePicto key={p.id} image={p.image} libelle={p.libelleAffiche} surAppui={() => surChoix(p)} />
            ))}
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
