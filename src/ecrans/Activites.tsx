import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listerActivites, listerSequences, picto as chargerPicto, supprimerActivite } from '../db'
import type { Activite, Picto, Sequence } from '../types'
import { ActiviteFormModal } from '../composants/ActiviteFormModal'
import { useObjectUrl } from '../lib/useObjectUrl'

function VignettePicto({ pictoId }: { pictoId: string }) {
  const [picto, setPicto] = useState<Picto | null>(null)
  const url = useObjectUrl(picto?.image)
  useEffect(() => {
    void chargerPicto(pictoId).then((p) => setPicto(p ?? null))
  }, [pictoId])
  return (
    <span
      aria-hidden="true"
      style={{
        width: 56,
        height: 56,
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
  )
}

/** Bibliothèque d'activités : nom, picto, séquence rattachée (ROADMAP lot 3). */
export function Activites() {
  const [activites, setActivites] = useState<Activite[]>([])
  const [sequences, setSequences] = useState<Sequence[]>([])
  const [modal, setModal] = useState<'nouvelle' | Activite | null>(null)
  const [aSupprimer, setASupprimer] = useState<Activite | null>(null)

  const recharger = useCallback(async () => {
    setActivites(await listerActivites())
    setSequences(await listerSequences())
  }, [])

  useEffect(() => {
    void recharger()
  }, [recharger])

  function nomSequence(id: string | undefined) {
    if (!id) return 'Aucune — vue plein écran du picto'
    return sequences.find((s) => s.id === id)?.nom ?? 'Séquence supprimée'
  }

  return (
    <div className="ecran">
      <div className="barre">
        <Link to="/educateur" className="bouton" style={{ lineHeight: '60px', textDecoration: 'none' }}>
          Retour
        </Link>
        <h1 className="barre__titre">Bibliothèque d'activités</h1>
      </div>

      <div className="contenu pile" style={{ maxWidth: '40rem' }}>
        <button type="button" className="bouton bouton--accent" style={{ width: 'fit-content' }} onClick={() => setModal('nouvelle')}>
          + Créer une activité
        </button>

        {activites.length === 0 ? (
          <div className="vide">
            <p>Aucune activité pour l'instant. Appuyer sur « + Créer une activité ».</p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} className="pile">
            {activites.map((a) => (
              <li
                key={a.id}
                className="ligne"
                style={{
                  justifyContent: 'space-between',
                  padding: 'var(--pas)',
                  background: 'var(--surface)',
                  border: '1px solid var(--bordure)',
                  borderRadius: 'var(--rayon)',
                }}
              >
                <VignettePicto pictoId={a.pictoId} />
                <div className="pile" style={{ flex: 1, gap: 2 }}>
                  <span style={{ fontWeight: 700 }}>{a.nom}</span>
                  <span style={{ fontSize: 14, color: 'var(--texte-secondaire)' }}>{nomSequence(a.sequenceId)}</span>
                </div>
                <span className="ligne">
                  <button type="button" className="bouton" onClick={() => setModal(a)}>
                    Modifier
                  </button>
                  <button type="button" className="bouton bouton--danger" onClick={() => setASupprimer(a)}>
                    Supprimer
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modal && (
        <ActiviteFormModal
          activiteInitiale={modal === 'nouvelle' ? undefined : modal}
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
            <h2 style={{ fontSize: 22 }}>Supprimer « {aSupprimer.nom} » ?</h2>
            <p style={{ margin: 0 }}>
              Les créneaux d'emploi du temps qui l'utilisent resteront mais n'ouvriront plus rien.
            </p>
            <div className="ligne" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="bouton" onClick={() => setASupprimer(null)}>
                Annuler
              </button>
              <button
                type="button"
                className="bouton bouton--danger"
                onClick={() => {
                  void supprimerActivite(aSupprimer.id).then(() => {
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
