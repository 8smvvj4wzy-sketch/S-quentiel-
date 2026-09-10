import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { creerSequence, dupliquerSequence, listerSequences, supprimerSequence } from '../db'
import type { Sequence } from '../types'

/** Bibliothèque de séquences : créer, dupliquer, supprimer (ROADMAP lot 2). */
export function Sequences() {
  const [sequences, setSequences] = useState<Sequence[]>([])
  const [nouveau, setNouveau] = useState('')
  const [aSupprimer, setASupprimer] = useState<Sequence | null>(null)

  const recharger = useCallback(async () => setSequences(await listerSequences()), [])

  useEffect(() => {
    void recharger()
  }, [recharger])

  async function creer() {
    const nom = nouveau.trim()
    if (!nom) return
    await creerSequence(nom)
    setNouveau('')
    await recharger()
  }

  async function dupliquer(id: string) {
    await dupliquerSequence(id)
    await recharger()
  }

  async function confirmerSuppression(id: string) {
    await supprimerSequence(id)
    setASupprimer(null)
    await recharger()
  }

  return (
    <div className="ecran">
      <div className="barre">
        <Link to="/educateur" className="bouton" style={{ lineHeight: '60px', textDecoration: 'none' }}>
          Retour
        </Link>
        <h1 className="barre__titre">Bibliothèque de séquences</h1>
      </div>

      <div className="contenu pile" style={{ maxWidth: '40rem' }}>
        <div className="ligne">
          <input
            className="champ"
            style={{ flex: 1, minWidth: '12rem' }}
            placeholder="Nom de la nouvelle séquence"
            value={nouveau}
            onChange={(e) => setNouveau(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void creer()
            }}
            aria-label="Nom de la nouvelle séquence"
          />
          <button type="button" className="bouton bouton--accent" disabled={!nouveau.trim()} onClick={() => void creer()}>
            Créer
          </button>
        </div>

        {sequences.length === 0 ? (
          <div className="vide">
            <p>Aucune séquence pour l'instant.</p>
            <p>Saisir un nom puis « Créer » pour en écrire une.</p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} className="pile">
            {sequences.map((s) => (
              <li
                key={s.id}
                className="ligne"
                style={{
                  justifyContent: 'space-between',
                  padding: 'var(--pas)',
                  background: 'var(--surface)',
                  border: '1px solid var(--bordure)',
                  borderRadius: 'var(--rayon)',
                }}
              >
                <Link to={`/educateur/sequences/${s.id}`} style={{ color: 'var(--texte)', textDecoration: 'none', fontWeight: 700 }}>
                  {s.nom} <span style={{ fontWeight: 400, color: 'var(--texte-secondaire)' }}>({s.etapes.length} étape{s.etapes.length > 1 ? 's' : ''})</span>
                </Link>
                <span className="ligne">
                  <button type="button" className="bouton" onClick={() => void dupliquer(s.id)}>
                    Dupliquer
                  </button>
                  <button type="button" className="bouton bouton--danger" onClick={() => setASupprimer(s)}>
                    Supprimer
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

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
              Les activités qui utilisent cette séquence n'en auront plus. Cette action est
              définitive.
            </p>
            <div className="ligne" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="bouton" onClick={() => setASupprimer(null)}>
                Annuler
              </button>
              <button type="button" className="bouton bouton--danger" onClick={() => void confirmerSuppression(aSupprimer.id)}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
