import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { listerRegles, supprimerRegle } from '../db'
import type { Regle } from '../types'
import { RegleFormModal } from '../composants/RegleFormModal'

/** Bibliothèque de règles (ROADMAP lot 5). */
export function Regles() {
  const { profilId } = useParams<{ profilId: string }>()
  const [regles, setRegles] = useState<Regle[]>([])
  const [modal, setModal] = useState<'nouvelle' | Regle | null>(null)
  const [aSupprimer, setASupprimer] = useState<Regle | null>(null)

  const recharger = useCallback(async () => setRegles(await listerRegles()), [])

  useEffect(() => {
    void recharger()
  }, [recharger])

  return (
    <div className="ecran">
      <div className="barre">
        <Link to={`/profil/${profilId}`} className="bouton" style={{ lineHeight: '60px', textDecoration: 'none' }}>
          Retour
        </Link>
        <h1 className="barre__titre">Règles</h1>
      </div>

      <div className="contenu pile" style={{ maxWidth: '40rem' }}>
        <button type="button" className="bouton bouton--accent" style={{ width: 'fit-content' }} onClick={() => setModal('nouvelle')}>
          + Créer une règle
        </button>

        {regles.length === 0 ? (
          <div className="vide">
            <p>Aucune règle pour l'instant. Appuyer sur « + Créer une règle ».</p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} className="pile">
            {regles.map((r) => (
              <li
                key={r.id}
                className="ligne"
                style={{
                  justifyContent: 'space-between',
                  padding: 'var(--pas)',
                  background: 'var(--surface)',
                  border: '1px solid var(--bordure)',
                  borderRadius: 'var(--rayon)',
                }}
              >
                <span style={{ fontWeight: 700 }}>{r.texte}</span>
                <span className="ligne">
                  <button type="button" className="bouton" onClick={() => setModal(r)}>
                    Modifier
                  </button>
                  <button type="button" className="bouton bouton--danger" onClick={() => setASupprimer(r)}>
                    Supprimer
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modal && (
        <RegleFormModal
          regleInitiale={modal === 'nouvelle' ? undefined : modal}
          surFermeture={() => setModal(null)}
          surValidation={() => {
            setModal(null)
            void recharger()
          }}
        />
      )}

      {aSupprimer && (
        <div
          role="dialog"
          aria-modal="true"
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
              maxWidth: '28rem',
            }}
          >
            <h2 style={{ fontSize: 22 }}>Supprimer cette règle ?</h2>
            <p style={{ margin: 0 }}>« {aSupprimer.texte} »</p>
            <div className="ligne" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="bouton" onClick={() => setASupprimer(null)}>
                Annuler
              </button>
              <button
                type="button"
                className="bouton bouton--danger"
                onClick={() => {
                  void supprimerRegle(aSupprimer.id).then(() => {
                    setASupprimer(null)
                    void recharger()
                  })
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
