import { useEffect, useState } from 'react'
import { listerActivites } from '../db'
import type { Activite } from '../types'

type Props = {
  surChoix: (activite: Activite) => void
  surFermeture: () => void
}

/** Sélection d'une activité pour l'ajouter à l'emploi du temps. */
export function ChoisirActiviteModal({ surChoix, surFermeture }: Props) {
  const [activites, setActivites] = useState<Activite[]>([])

  useEffect(() => {
    void listerActivites().then(setActivites)
  }, [])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choisir une activité"
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
          maxHeight: '80vh',
        }}
      >
        <h2 style={{ fontSize: 22 }}>Choisir une activité</h2>

        {activites.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--texte-secondaire)' }}>
            Aucune activité. Aller d'abord dans « Bibliothèque d'activités » pour en créer.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, overflowY: 'auto' }} className="pile">
            {activites.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  className="bouton"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => surChoix(a)}
                >
                  {a.nom}
                </button>
              </li>
            ))}
          </ul>
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
